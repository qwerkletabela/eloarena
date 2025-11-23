// app/admin/turniej/[id]/edit/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import Link from 'next/link'
import MapPicker from '@/components/MapPicker'
import AutoHide from '@/components/AutoHide'
import SheetPicker from '@/components/SheetPicker'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = Promise<{ id: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

type TurniejRow = {
  id: string
  nazwa: string | null
  data_turnieju: string | null
  godzina_turnieju: string | null
  zakonczenie_turnieju: string | null
  gsheet_url: string | null
  gsheet_id: string | null
  arkusz_nazwa: string | null
  kolumna_nazwisk: string | null
  pierwszy_wiersz_z_nazwiskiem: number | null
  limit_graczy: number | null
  lat: number | null
  lng: number | null
}

type WynikRow = {
  id: string
  gracz_id: string
  full_name: string | null
  club: string | null
  status: string | null
  seed: number | null
  miejsce: number | null
  punkty: number | null
}

/** Parser CSV (prosty, wspiera cudzysłowy) + heurystyka separatora , / ; */
function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/)[0] ?? ''
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let i = 0, field = '', row: string[] = [], inQuotes = false
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false; i++; continue
      }
      field += ch; i++; continue
    } else {
      if (ch === '"') { inQuotes = true; i++; continue }
      if (ch === sep) { row.push(field); field = ''; i++; continue }
      if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue }
      if (ch === '\r') { i++; continue }
      field += ch; i++
    }
  }
  row.push(field); rows.push(row)
  return rows
}

/** A→0, B→1, ... */
function colLetterToIndex(letter: string) {
  const l = letter.trim().toUpperCase()
  if (!/^[A-Z]+$/.test(l)) return null
  let idx = 0
  for (let i = 0; i < l.length; i++) idx = idx * 26 + (l.charCodeAt(i) - 64)
  return idx - 1
}

/** Odogonkowienie PL */
function unaccentPl(s: string) {
  const map: Record<string, string> = {
    'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
    'Ą':'A','Ć':'C','Ę':'E','Ł':'L','Ń':'N','Ó':'O','Ś':'S','Ź':'Z','Ż':'Z'
  }
  return s.replace(/[ĄĆĘŁŃÓŚŹŻąćęłńóśźż]/g, ch => map[ch] ?? ch)
}

/** Normalizacja jak w SQL public.norm_txt */
function normTxt(s: string) {
  return unaccentPl(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** „Imię Nazwisko” → { imie, nazwisko } */
function splitFullName(full: string) {
  const clean = full.replace(/\s+/g, ' ').trim()
  if (!clean) return null
  const parts = clean.split(' ')
  const nazwisko = parts.pop()!
  const imie = parts.join(' ')
  if (!imie || !nazwisko) return null
  return { imie, nazwisko }
}

/** Budowa URL CSV z gsheet_url (+ opcjonalnie nazwa karty i zakres) */
function buildCsvUrl(sheetUrl: string, sheetName?: string | null, range?: string) {
  const m = sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  const id = m?.[1]
  if (!id) return null

  let params = new URLSearchParams()
  params.set('format', 'csv')
  if (sheetName && !/^\d+$/.test(sheetName)) {
    params.set('sheet', sheetName)
  }
  if (range) {
    params.set('range', range)
  }

  return `https://docs.google.com/spreadsheets/d/${id}/export?${params.toString()}`
}

/** Usuwa BOM, NBSP, zero-width; normalizuje spacje */
function cleanCell(s: string) {
  return String(s ?? '')
    .replace(/^\uFEFF/, '')
    .replace(/[\u00A0\u200B\u200C\u200D\u2060]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default async function EditTurniejPage({ params, searchParams }: { params: Params, searchParams: SearchParams }) {
  const { id } = await params
  const sp = await searchParams
  const ok = sp.ok === '1'
  const err = typeof sp.e === 'string' ? sp.e : undefined

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const { data: t } = await supabase
    .from('turniej')
    .select('*')
    .eq('id', id)
    .maybeSingle<TurniejRow>()
  if (!t) redirect('/admin/turniej')

  const { data: uczestnicy } = await supabase
    .from('v_wyniki')
    .select('id, gracz_id, full_name, club, status, seed, miejsce, punkty')
    .eq('turniej_id', id)
    .order('miejsce', { ascending: true, nullsFirst: false })
    .order('seed', { ascending: true, nullsFirst: false })
    .returns<WynikRow[]>()

  // ---- PODGLĄD Z ARKUSZA ----
  let preview: {row: number, value: string}[] = []
  let previewError: string | null = null

  if (t.gsheet_url && t.kolumna_nazwisk && t.pierwszy_wiersz_z_nazwiskiem) {
    try {
      const startAt = Number(t.pierwszy_wiersz_z_nazwiskiem) || 1
      const colLetter = t.kolumna_nazwisk.toUpperCase()
      
      // Pobierz zakres komórek (np. G4:G100) zamiast całego arkusza
      const range = `${colLetter}${startAt}:${colLetter}100`
      const csvUrl = buildCsvUrl(t.gsheet_url, t.arkusz_nazwa, range)
      if (!csvUrl) throw new Error('Nieprawidłowy link do arkusza')
      
      const resp = await fetch(csvUrl, { cache: 'no-store' })
      if (!resp.ok) throw new Error(`Nie udało się pobrać CSV (${resp.status})`)
      const text = await resp.text()

      const rows = parseCsv(text)
      const colIdx = 0 // ponieważ pobraliśmy tylko jedną kolumnę, to zawsze 0

      // Przekształć dane na listę z poprawną numeracją wierszy
      preview = rows.map((row, index) => ({
        row: startAt + index,
        value: cleanCell(row[colIdx] ?? '')
      })).filter(item => item.value.trim() !== '') // Filtruj puste wiersze

    } catch (e: any) {
      previewError = e?.message || 'Błąd podglądu arkusza'
    }
  }

  // Przygotuj listę do sprawdzenia w bazie tylko dla poprawnych „Imię Nazwisko”
  const toParse = preview
    .map(item => {
      const clean = item.value.replace(/\s+/g, ' ').trim()
      if (!clean) return null
      const parts = clean.split(' ')
      if (parts.length < 2) return null
      const nazwisko = parts.pop()!
      const imie = parts.join(' ')
      if (!imie || !nazwisko) return null
      const norm = normTxt(`${imie} ${nazwisko}`)
      return { raw: clean, imie, nazwisko, norm, row: item.row }
    })
    .filter(Boolean) as { raw: string, imie: string, nazwisko: string, norm: string, row: number }[]

  let existsMap = new Map<string, true>()
  if (toParse.length) {
    const norms = Array.from(new Set(toParse.map(r => r.norm)))
    const { data: found } = await supabase
      .from('gracz')
      .select('fullname_norm')
      .in('fullname_norm', norms)
    found?.forEach(r => { if (r.fullname_norm) existsMap.set(String(r.fullname_norm), true) })
  }

  // Klasy stylów dla ciemnego motywu
  const inputClass = "w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-sky-50 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
  const labelClass = "block text-sm font-medium text-sky-100"
  const primaryBtn = "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.9)] transition hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_14px_35px_rgba(15,23,42,1)]"
  const secondaryBtn = "inline-flex items-center justify-center rounded-full border border-slate-500 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-slate-700 hover:border-sky-400 transition"

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-sky-50">Edytuj turniej: {t.nazwa}</h1>
            <p className="mt-1 text-sm text-slate-400">Zarządzanie danymi turnieju i uczestnikami</p>
          </div>
          <Link href="/admin/turniej" className={secondaryBtn}>
            ← Powrót do listy
          </Link>
        </div>

        {ok && (
          <AutoHide>
            <div className="rounded-md border border-emerald-300/70 bg-emerald-900/30 px-4 py-3 text-sm text-emerald-200">
              Zapisano zmiany.
            </div>
          </AutoHide>
        )}
        {err && (
          <AutoHide>
            <div className="rounded-md border border-red-400/80 bg-red-900/40 px-4 py-3 text-sm text-red-100">
              {err === 'add_failed' && 'Nie udało się dodać gracza.'}
              {err === 'add_invalid' && 'Brak imienia lub nazwiska.'}
              {!['add_failed', 'add_invalid'].includes(err) && 'Nie udało się zapisać.'}
            </div>
          </AutoHide>
        )}

        {/* Formularz turnieju */}
        <form action={`/admin/turniej/${t.id}/update`} method="post" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Lewa kolumna - podstawowe informacje */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-sky-100 border-b border-slate-600 pb-2">Podstawowe informacje</h3>
              
              <div>
                <label className={labelClass}>Nazwa turnieju *</label>
                <input 
                  name="nazwa" 
                  defaultValue={t.nazwa ?? ''} 
                  required 
                  className={inputClass}
                  placeholder="Wpisz nazwę turnieju"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Data *</label>
                  <input 
                    type="date" 
                    name="data_turnieju" 
                    defaultValue={t.data_turnieju ?? ''} 
                    required 
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Godzina rozpoczęcia *</label>
                  <input 
                    type="time" 
                    name="godzina_turnieju" 
                    defaultValue={t.godzina_turnieju ?? ''} 
                    required 
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Godzina zakończenia</label>
                  <input 
                    type="time" 
                    name="zakonczenie_turnieju" 
                    defaultValue={t.zakonczenie_turnieju ?? ''} 
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Limit graczy</label>
                <input 
                  type="number" 
                  name="limit_graczy" 
                  defaultValue={t.limit_graczy ?? ''} 
                  min={1} 
                  className={inputClass}
                  placeholder="np. 32"
                />
              </div>
            </div>

            {/* Prawa kolumna - lokalizacja i arkusz */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-sky-100 border-b border-slate-600 pb-2">Lokalizacja i dane</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Szerokość (lat)</label>
                  <input 
                    id="lat" 
                    name="lat" 
                    defaultValue={t.lat ?? ''} 
                    className={inputClass}
                    placeholder="52.2297"
                  />
                </div>
                <div>
                  <label className={labelClass}>Długość (lng)</label>
                  <input 
                    id="lng" 
                    name="lng" 
                    defaultValue={t.lng ?? ''} 
                    className={inputClass}
                    placeholder="21.0122"
                  />
                </div>
                <div className="flex items-end">
                  <MapPicker
                    targetLatId="lat"
                    targetLngId="lng"
                    lat={t.lat ?? null}
                    lng={t.lng ?? null}
                    buttonLabel="Wybierz na mapie"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Link do arkusza Google</label>
                <input
                  id="gsheet_url"
                  name="gsheet_url"
                  defaultValue={t.gsheet_url ?? ''}
                  className={inputClass}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Nazwa karty</label>
                  <input
                    id="arkusz_nazwa"
                    name="arkusz_nazwa"
                    defaultValue={t.arkusz_nazwa ?? ''}
                    className={inputClass}
                    placeholder="np. Lista"
                  />
                </div>
                <div>
                  <label className={labelClass}>ID arkusza</label>
                  <input 
                    name="gsheet_id" 
                    defaultValue={t.gsheet_id ?? ''} 
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Wybór karty z pliku */}
              <div>
                <label className={labelClass}>Wybierz kartę z pliku</label>
                <div className="mt-1">
                  <SheetPicker
                    urlInputId="gsheet_url"
                    sheetInputId="arkusz_nazwa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Kolumna nazwisk</label>
                  <input 
                    name="kolumna_nazwisk" 
                    defaultValue={t.kolumna_nazwisk ?? ''} 
                    className={inputClass} 
                    placeholder="np. B" 
                    maxLength={2} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Pierwszy wiersz</label>
                  <input
                    type="number"
                    name="pierwszy_wiersz_z_nazwiskiem"
                    defaultValue={t.pierwszy_wiersz_z_nazwiskiem ?? 2}
                    min={1}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-600">
            <button className={primaryBtn} type="submit">
              Zapisz zmiany
            </button>
            <Link href="/admin/turniej" className={secondaryBtn}>
              Anuluj
            </Link>
          </div>
        </form>

        {/* Sekcje uczestników i podglądu arkusza */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-600">
          {/* Lewa kolumna - lista uczestników z bazy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-100">Lista uczestników (z bazy)</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-600">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">Zawodnik</th>
                    <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">Seed</th>
                    <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">Miejsce</th>
                    <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">Punkty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {uczestnicy?.map((r, i) => (
                    <tr key={r.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3 text-sky-100">{i + 1}</td>
                      <td className="px-4 py-3 text-sky-100">{r.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-sky-100">{r.status ?? 'registered'}</td>
                      <td className="px-4 py-3 text-sky-100">{r.seed ?? '—'}</td>
                      <td className="px-4 py-3 text-sky-100">{r.miejsce ?? '—'}</td>
                      <td className="px-4 py-3 text-sky-100">{r.punkty ?? '—'}</td>
                    </tr>
                  ))}
                  {!(uczestnicy && uczestnicy.length) && (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-400 text-sm" colSpan={6}>
                        <div className="flex flex-col items-center gap-2">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-600">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                          </svg>
                          <p>Brak uczestników</p>
                          <p className="text-xs">Użyj importu lub dodaj ręcznie</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Prawa kolumna - podgląd z arkusza */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-100">Podgląd z arkusza (kolumna {t.kolumna_nazwisk})</h3>
            <p className="text-sm text-slate-400">
              {t.gsheet_url ? (
                <>Źródło: <a className="text-sky-400 hover:text-sky-300 underline" href={t.gsheet_url} target="_blank" rel="noreferrer">Google Sheet</a></>
              ) : (
                'Brak linku do arkusza'
              )}
              {t.kolumna_nazwisk && ` • Kolumna: ${t.kolumna_nazwisk}`}
              {typeof t.pierwszy_wiersz_z_nazwiskiem === 'number' && ` • Od wiersza: ${t.pierwszy_wiersz_z_nazwiskiem}`}
            </p>

            {previewError && (
              <div className="rounded-md border border-amber-400/50 bg-amber-500/10 px-4 py-3 text-amber-200">
                {previewError}
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-slate-600">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">
                      # w arkuszu
                    </th>
                    <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">Z arkusza</th>
                    <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">Status w bazie</th>
                    <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">Akcja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600">
                  {preview.map((item) => {
                    const clean = item.value.replace(/\s+/g, ' ').trim()
                    const rowData = toParse.find(r => r.row === item.row)

                    let imie: string | null = null
                    let nazwisko: string | null = null
                    let norm: string | null = null

                    if (rowData) {
                      imie = rowData.imie
                      nazwisko = rowData.nazwisko
                      norm = rowData.norm
                    } else if (clean) {
                      const parts = clean.split(' ')
                      if (parts.length >= 2) {
                        nazwisko = parts.pop()!
                        imie = parts.join(' ')
                        if (imie && nazwisko) norm = normTxt(`${imie} ${nazwisko}`)
                      }
                    }

                    const exists = norm ? existsMap.get(norm) === true : false

                    return (
                      <tr key={`${item.row}-${clean}`} className="hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 text-sky-100 text-center">{item.row}</td>
                        <td className="px-4 py-3 text-sky-100">{clean || <span className="text-slate-500">— puste —</span>}</td>
                        <td className="px-4 py-3">
                          {!norm ? (
                            <span className="text-amber-400">⚠ format niepełny</span>
                          ) : exists ? (
                            <span className="text-emerald-400">✅ w bazie</span>
                          ) : (
                            <span className="text-slate-400">— brak —</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {norm && !exists && imie && nazwisko ? (
                            <form action="/admin/gracz/add" method="post" className="inline">
                              <input type="hidden" name="imie" value={imie} />
                              <input type="hidden" name="nazwisko" value={nazwisko} />
                              <input type="hidden" name="back" value={`/admin/turniej/${t.id}/edit`} />
                              <button type="submit" className="inline-flex items-center gap-1 rounded bg-sky-600 hover:bg-sky-500 px-3 py-1 text-xs font-medium text-white transition">
                                Dodaj
                              </button>
                            </form>
                          ) : (
                            !norm && clean && <span className="text-xs text-slate-500">uzupełnij „Imię Nazwisko”</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {!preview.length && (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-400 text-sm" colSpan={4}>
                        <div className="flex flex-col items-center gap-2">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-600">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                          </svg>
                          <p>Brak danych do podglądu</p>
                          <p className="text-xs">Uzupełnij link, kolumnę i pierwszy wiersz</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}