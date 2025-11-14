// app/admin/turniej/[id]/import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

type RowT = {
  id: string
  nazwa: string | null
  gsheet_url: string | null
  arkusz_nazwa: string | null
  kolumna_nazwisk: string | null // np. "B" (pełne imię+nazwisko w jednej kolumnie)
  pierwszy_wiersz_z_nazwiskiem: number | null // np. 2
}

/** Buduje URL CSV z gsheet_url i (opcjonalnie) nazwą karty. */
function buildCsvUrl(sheetUrl: string, sheetName?: string | null) {
  const m = sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  const id = m?.[1]
  if (!id) return null

  // Jeśli podano nazwę karty (nie liczbowy gid) – użyj gviz CSV
  if (sheetName && !/^\d+$/.test(sheetName)) {
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  }

  // Jeżeli w URL już jest gid – użyj go
  const gidMatch = sheetUrl.match(/[?&]gid=(\d+)/)
  const gid = gidMatch?.[1]
  if (gid) return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`

  // Domyślnie: pierwsza karta
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`
}

/** Zamienia literę kolumny (np. "B") na indeks 0-based. */
function colLetterToIndex(letter: string) {
  const l = letter.trim().toUpperCase()
  if (!/^[A-Z]+$/.test(l)) return null
  let idx = 0
  for (let i = 0; i < l.length; i++) {
    idx = idx * 26 + (l.charCodeAt(i) - 64)
  }
  return idx - 1
}

/** Prosty parser CSV: radzi sobie z cudzysłowami i separatorami , lub ; */
function parseCsv(text: string): string[][] {
  // heurystyka separatora: jeśli w pierwszej linii więcej ; niż , to ;
  const firstLine = text.split(/\r?\n/)[0] ?? ''
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let i = 0, field = '', row: string[] = [], inQuotes = false

  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'; i += 2; continue
        } else {
          inQuotes = false; i++; continue
        }
      } else {
        field += ch; i++; continue
      }
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

/** Rozbija pełne imię+nazwisko na {imie, nazwisko}. Ostatnie słowo → nazwisko. */
function splitFullName(full: string) {
  const clean = full.replace(/\s+/g, ' ').trim()
  if (!clean) return null
  const parts = clean.split(' ')
  const nazwisko = parts.pop()!
  const imie = parts.join(' ') || ''
  if (!imie || !nazwisko) return null
  return { imie, nazwisko }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const origin = req.nextUrl.origin
  const supabase = await createSupabaseServerMutable()

  // 0) auth + admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/signin', origin), { status: 303 })
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.redirect(new URL('/', origin), { status: 303 })

  // 1) pobierz ustawienia turnieju
  const { data: t, error: terr } = await supabase
    .from('turniej')
    .select('id, nazwa, gsheet_url, arkusz_nazwa, kolumna_nazwisk, pierwszy_wiersz_z_nazwiskiem')
    .eq('id', id)
    .single<RowT>()

  if (terr || !t) {
    const url = new URL(`/admin/turniej/${id}/edit?e=no_tournament`, origin)
    return NextResponse.redirect(url, { status: 303 })
  }
  if (!t.gsheet_url || !t.kolumna_nazwisk || !t.pierwszy_wiersz_z_nazwiskiem) {
    const url = new URL(`/admin/turniej/${id}/edit?e=missing_sheet_cfg`, origin)
    return NextResponse.redirect(url, { status: 303 })
  }

  // 2) zbuduj URL CSV i pobierz treść
  const csvUrl = buildCsvUrl(t.gsheet_url, t.arkusz_nazwa)
  if (!csvUrl) {
    const url = new URL(`/admin/turniej/${id}/edit?e=bad_sheet_url`, origin)
    return NextResponse.redirect(url, { status: 303 })
  }

  let csvText = ''
  try {
    const resp = await fetch(csvUrl, { headers: { 'cache-control': 'no-cache' } })
    if (!resp.ok) throw new Error(`csv fetch ${resp.status}`)
    csvText = await resp.text()
  } catch (e) {
    const url = new URL(`/admin/turniej/${id}/edit?e=fetch_failed`, origin)
    return NextResponse.redirect(url, { status: 303 })
  }

  // 3) CSV -> wiersze -> wybór kolumny
  const rows = parseCsv(csvText)
  const colIdx = colLetterToIndex(t.kolumna_nazwisk!)
  if (colIdx == null) {
    const url = new URL(`/admin/turniej/${id}/edit?e=col_invalid`, origin)
    return NextResponse.redirect(url, { status: 303 })
  }

  const startAt = Math.max(1, t.pierwszy_wiersz_z_nazwiskiem || 1) // 1-based w UI
  const picked = rows.slice(startAt - 1).map(r => (r[colIdx] || '').trim()).filter(Boolean)

  // 4) przygotuj upsert do gracz
  const grPayload = []
  for (const full of picked) {
    const s = splitFullName(full)
    if (!s) continue
    grPayload.push({
      imie: s.imie,
      nazwisko: s.nazwisko,
      // reszta pól opcjonalnie null
    })
  }
  if (!grPayload.length) {
    const url = new URL(`/admin/turniej/${id}/edit?e=empty_after_parse`, origin)
    return NextResponse.redirect(url, { status: 303 })
  }

  // 5) upsert graczy po unikalnym fullname_norm (generowana – ale conflict działa)
  //    Uwaga: Supabase upsert przyjmie conflict po nazwie constraintu albo kolumny; tu użyjemy kolumny
  const { data: inserted, error: gerr } = await supabase
    .from('gracz')
    .upsert(grPayload, { onConflict: 'fullname_norm' })
    .select('id, imie, nazwisko')

  if (gerr) {
    const url = new URL(`/admin/turniej/${id}/edit?e=gracz_upsert_failed`, origin)
    return NextResponse.redirect(url, { status: 303 })
  }

  // 6) pobierz ID wszystkich graczy odpowiadających picked (by uniknąć case/ogonki problemów)
  //    Prosto: po imie+nazwisko które właśnie upsertowaliśmy:
  const names = grPayload.map(x => `${x.imie} ${x.nazwisko}`)
  // (jeśli listy duże, można dzielić na paczki)
  const { data: allMatched } = await supabase
    .from('gracz')
    .select('id, imie, nazwisko')
    .in('fullname_norm', names.map(n => n.toLowerCase().normalize('NFKD'))) // orientacyjnie
  // Uproszczenie: użyjemy id z `inserted` oraz zignorujemy brakujące

  const ids = new Set<string>()
  inserted?.forEach(r => ids.add(r.id))

  // 7) upsert do wyniki (unikat po turniej_id, gracz_id)
  const wynikiPayload = Array.from(ids).map(gracz_id => ({ turniej_id: id, gracz_id }))
  if (wynikiPayload.length) {
    await supabase
      .from('wyniki')
      .upsert(wynikiPayload, { onConflict: 'turniej_id,gracz_id' })
  }

  // 8) sukces
  const url = new URL(`/admin/turniej/${id}/edit?ok=1`, origin)
  return NextResponse.redirect(url, { status: 303 })
}
