// app/admin/turniej/[id]/edit/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import Link from 'next/link'
import MapPicker from '@/components/MapPicker'
import AutoHide from '@/components/AutoHide'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = Promise<{ id: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

type TurniejRow = {
  id: string
  nazwa: string | null
  data_turnieju: string | null
  godzina_turnieju: string | null
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

/** Heurystyka separatora + prosty parser CSV (obsługa "cudzysłowów") */
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
      } else { field += ch; i++; continue }
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

/** Zamiana litery kolumny (np. "B") na index 0-based */
function colLetterToIndex(letter: string) {
  const l = letter.trim().toUpperCase()
  if (!/^[A-Z]+$/.test(l)) return null
  let idx = 0
  for (let i = 0; i < l.length; i++) idx = idx * 26 + (l.charCodeAt(i) - 64)
  return idx - 1
}

/** Twarde odogonkowienie polskich znaków (ł→l itd.) */
function unaccentPl(s: string) {
  const map: Record<string, string> = {
    'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
    'Ą':'A','Ć':'C','Ę':'E','Ł':'L','Ń':'N','Ó':'O','Ś':'S','Ź':'Z','Ż':'Z'
  }
  return s.replace(/[ĄĆĘŁŃÓŚŹŻąćęłńóśźż]/g, ch => map[ch] ?? ch)
}

/** Normalizacja jak w SQL public.norm_txt: unaccentPL + lower + NFD bez diakryt. + pojedyncze spacje */
function normTxt(s: string) {
  return unaccentPl(s)
    .toLowerCase()
    .normalize('NFD')              // rozbij resztę akcentów (np. é)
    .replace(/[\u0300-\u036f]/g, '') // usuń znaki łączące (diakrytyki)
    .replace(/\s+/g, ' ')
    .trim()
}

/** Rozbicie "Imię Nazwisko" → { imie, nazwisko } (ostatnie słowo = nazwisko) */
function splitFullName(full: string) {
  const clean = full.replace(/\s+/g, ' ').trim()
  if (!clean) return null
  const parts = clean.split(' ')
  const nazwisko = parts.pop()!
  const imie = parts.join(' ')
  if (!imie || !nazwisko) return null
  return { imie, nazwisko }
}

/** URL CSV z gsheet_url (+ opcjonalnie nazwa karty) */
function buildCsvUrl(sheetUrl: string, sheetName?: string | null) {
  const m = sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  const id = m?.[1]
  if (!id) return null
  if (sheetName && !/^\d+$/.test(sheetName)) {
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  }
  const gidMatch = sheetUrl.match(/[?&]gid=(\d+)/)
  const gid = gidMatch?.[1]
  if (gid) return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`
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

  // (opcjonalnie) lista istniejących uczestników (v_wyniki)
  const { data: uczestnicy } = await supabase
    .from('v_wyniki')
    .select('id, gracz_id, full_name, club, status, seed, miejsce, punkty')
    .eq('turniej_id', id)
    .order('miejsce', { ascending: true, nullsFirst: false })
    .order('seed', { ascending: true, nullsFirst: false })
    .returns<WynikRow[]>()

  // ---- PODGLĄD Z ARKUSZA (ta sama strona) ----
  let previewNames: { raw: string; imie: string; nazwisko: string; norm: string }[] = []
  let previewError: string | null = null

  if (t.gsheet_url && t.kolumna_nazwisk && t.pierwszy_wiersz_z_nazwiskiem) {
    try {
      const csvUrl = buildCsvUrl(t.gsheet_url, t.arkusz_nazwa)
      if (!csvUrl) throw new Error('Nieprawidłowy link do arkusza')
      const resp = await fetch(csvUrl, { headers: { 'cache-control': 'no-cache' } })
      if (!resp.ok) throw new Error(`Nie udało się pobrać CSV (${resp.status})`)
      const text = await resp.text()

      const rows = parseCsv(text)
      const colIdx = colLetterToIndex(t.kolumna_nazwisk)
      if (colIdx == null) throw new Error('Nieprawidłowa kolumna (użyj litery, np. B)')

      const startAt = Math.max(1, t.pierwszy_wiersz_z_nazwiskiem || 1)
      const picked = rows.slice(startAt - 1).map(r => (r[colIdx] || '').trim()).filter(Boolean)

      previewNames = picked
        .map(raw => {
          const s = splitFullName(raw)
          if (!s) return null
          return { raw, imie: s.imie, nazwisko: s.nazwisko, norm: normTxt(`${s.imie} ${s.nazwisko}`) }
        })
        .filter(Boolean) as any[]
    } catch (e: any) {
      previewError = e?.message || 'Błąd podglądu arkusza'
    }
  }

  // Mapa istniejących graczy po fullname_norm (znormalizowane po stronie TS)
  let existsMap = new Map<string, true>()
  if (previewNames.length) {
    const norms = Array.from(new Set(previewNames.map(n => n.norm)))
    // zapytaj bazę po fullname_norm IN (...)
    const { data: found } = await supabase
      .from('gracz')
      .select('id, imie, nazwisko, fullname_norm')
      .in('fullname_norm', norms)
    found?.forEach(r => { if (r.fullname_norm) existsMap.set(String(r.fullname_norm), true) })
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edytuj: {t.nazwa}</h1>
        <Link href="/admin/turniej" className="pill pill--secondary">← Lista</Link>
      </div>

      {ok && (
        <AutoHide>
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Zapisano.
          </div>
        </AutoHide>
      )}
      {err && (
        <AutoHide>
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err === 'add_failed' && 'Nie udało się dodać gracza.'}
            {err === 'add_invalid' && 'Brak imienia lub nazwiska.'}
            {!['add_failed', 'add_invalid'].includes(err) && 'Nie udało się zapisać.'}
          </div>
        </AutoHide>
      )}

      {/* Formularz turnieju (bez zmian) */}
      <form action={`/admin/turniej/${t.id}/update`} method="post" className="space-y-5 max-w-2xl">
        <div>
          <label className="block text-sm font-medium">Nazwa *</label>
          <input name="nazwa" defaultValue={t.nazwa ?? ''} required className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Data *</label>
            <input type="date" name="data_turnieju" defaultValue={t.data_turnieju ?? ''} required className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Godzina *</label>
            <input type="time" name="godzina_turnieju" defaultValue={t.godzina_turnieju ?? ''} required className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Link do arkusza Google</label>
          <input name="gsheet_url" defaultValue={t.gsheet_url ?? ''} className="mt-1 w-full rounded border px-3 py-2" placeholder="https://docs.google.com/..." />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">ID arkusza</label>
            <input name="gsheet_id" defaultValue={t.gsheet_id ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Nazwa karty</label>
            <input name="arkusz_nazwa" defaultValue={t.arkusz_nazwa ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Kolumna nazwisk</label>
            <input name="kolumna_nazwisk" defaultValue={t.kolumna_nazwisk ?? ''} className="mt-1 w-full rounded border px-3 py-2" placeholder="np. B" maxLength={2} />
          </div>
          <div>
            <label className="block text-sm font-medium">Pierwszy wiersz</label>
            <input
              type="number"
              name="pierwszy_wiersz_z_nazwiskiem"
              defaultValue={t.pierwszy_wiersz_z_nazwiskiem ?? 2}
              min={1}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Limit graczy</label>
            <input type="number" name="limit_graczy" defaultValue={t.limit_graczy ?? ''} min={1} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        {/* LAT/LNG + MapPicker */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Lat</label>
            <input id="lat" name="lat" defaultValue={t.lat ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Lng</label>
            <input id="lng" name="lng" defaultValue={t.lng ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div className="flex items-end">
            <MapPicker
              targetLatId="lat"
              targetLngId="lng"
              lat={t.lat ?? null}
              lng={t.lng ?? null}
              buttonLabel="Ustaw pinezkę"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button className="pill pill--primary" type="submit">Zapisz</button>
          <Link href="/admin/turniej" className="pill pill--secondary">Anuluj</Link>
        </div>
      </form>

      {/* --- Podgląd z arkusza (na stronie) --- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolumna 1: lista uczestników (z bazy) */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Lista uczestników (z bazy)</h3>
          <div className="overflow-x-auto rounded border">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-red-50">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Zawodnik</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Seed</th>
                  <th className="px-3 py-2 text-left">Miejsce</th>
                  <th className="px-3 py-2 text-left">Punkty</th>
                </tr>
              </thead>
              <tbody>
                {uczestnicy?.map((r, i) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{r.full_name ?? '—'}</td>
                    <td className="px-3 py-2">{r.status ?? 'registered'}</td>
                    <td className="px-3 py-2">{r.seed ?? '—'}</td>
                    <td className="px-3 py-2">{r.miejsce ?? '—'}</td>
                    <td className="px-3 py-2">{r.punkty ?? '—'}</td>
                  </tr>
                ))}
                {!uczestnicy?.length && (
                  <tr>
                    <td className="px-3 py-6 text-sm opacity-60" colSpan={6}>
                      Brak uczestników. Użyj importu lub dodaj ręcznie.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolumna 2: podgląd kolumny z arkusza + status w bazie + dodawanie */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Podgląd z arkusza (kolumna)</h3>
          <p className="text-xs text-slate-600">
            {t.gsheet_url ? <>Źródło: <a className="underline" href={t.gsheet_url} target="_blank" rel="noreferrer">Google Sheet</a></> : 'Brak linku'}
            {t.kolumna_nazwisk ? <> • kolumna: <strong>{t.kolumna_nazwisk}</strong></> : null}
            {typeof t.pierwszy_wiersz_z_nazwiskiem === 'number' ? <> • od wiersza: <strong>{t.pierwszy_wiersz_z_nazwiskiem}</strong></> : null}
          </p>

          {previewError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {previewError}
            </div>
          ) : (
            <div className="overflow-x-auto rounded border">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-slate-50">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Z arkusza</th>
                    <th className="px-3 py-2 text-left">Status w bazie</th>
                    <th className="px-3 py-2 text-left">Akcja</th>
                  </tr>
                </thead>
                <tbody>
                  {previewNames.map((n, i) => {
                    const exists = existsMap.get(n.norm) === true
                    return (
                      <tr key={`${n.raw}-${i}`} className="border-b last:border-0">
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2">{n.raw}</td>
                        <td className="px-3 py-2">
                          {exists ? <span className="text-green-700">✅ w bazie</span> : <span className="text-slate-700">— brak —</span>}
                        </td>
                        <td className="px-3 py-2">
                          {!exists && (
                            <form action="/admin/gracz/add" method="post" className="inline">
                              <input type="hidden" name="imie" value={n.imie} />
                              <input type="hidden" name="nazwisko" value={n.nazwisko} />
                              {/* wracamy na bieżącą stronę po akcji */}
                              <input type="hidden" name="back" value={`/admin/turniej/${t.id}/edit`} />
                              <button type="submit" className="pill pill--secondary">Dodaj</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {!previewNames.length && (
                    <tr>
                      <td className="px-3 py-6 text-sm opacity-60" colSpan={4}>
                        Brak danych do podglądu — uzupełnij link, kolumnę i pierwszy wiersz.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
