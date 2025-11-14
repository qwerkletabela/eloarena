// app/admin/turniej/[id]/import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

type TurniejRow = {
  id: string
  nazwa: string | null
  gsheet_url: string | null
  arkusz_nazwa: string | null
  kolumna_nazwisk: string | null
  pierwszy_wiersz_z_nazwiskiem: number | null
}

/** Buduje URL CSV z gsheet_url i (opcjonalnie) nazwą karty. */
function buildCsvUrl(sheetUrl: string, sheetName?: string | null) {
  const m = sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  const id = m?.[1]
  if (!id) return null

  // Jeśli jest nazwa karty – użyj gviz CSV
  if (sheetName && !/^\d+$/.test(sheetName)) {
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  }

  // Jeśli w URL jest gid – użyj go
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

/** Prosty parser CSV: wspiera cudzysłowy i separator , lub ; */
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

/** Rozbija „Imię Nazwisko” na { imie, nazwisko }. Ostatnie słowo = nazwisko. */
function splitFullName(full: string) {
  const clean = full.replace(/\s+/g, ' ').trim()
  if (!clean) return null
  const parts = clean.split(' ')
  const nazwisko = parts.pop()!
  const imie = parts.join(' ')
  if (!imie || !nazwisko) return null
  return { imie, nazwisko }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const origin = req.nextUrl.origin
  const supabase = await createSupabaseServerMutable()

  // auth + admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/signin', origin), { status: 303 })
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.redirect(new URL('/', origin), { status: 303 })

  // pobierz konfigurację turnieju
  const { data: t, error: terr } = await supabase
    .from('turniej')
    .select('id, nazwa, gsheet_url, arkusz_nazwa, kolumna_nazwisk, pierwszy_wiersz_z_nazwiskiem')
    .eq('id', id)
    .single<TurniejRow>()

  if (terr || !t) {
    console.error('[import] no_tournament', terr)
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=no_tournament`, origin), { status: 303 })
  }
  if (!t.gsheet_url || !t.kolumna_nazwisk || !t.pierwszy_wiersz_z_nazwiskiem) {
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=missing_sheet_cfg`, origin), { status: 303 })
  }

  const csvUrl = buildCsvUrl(t.gsheet_url, t.arkusz_nazwa)
  if (!csvUrl) {
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=bad_sheet_url`, origin), { status: 303 })
  }

  // pobierz CSV
  let csvText = ''
  try {
    const resp = await fetch(csvUrl, { headers: { 'cache-control': 'no-cache' } })
    if (!resp.ok) {
      console.error('[import] fetch_failed', resp.status, await resp.text().catch(() => ''))
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=fetch_failed&s=${resp.status}`, origin), { status: 303 })
    }
    csvText = await resp.text()
  } catch (e) {
    console.error('[import] fetch_error', e)
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=fetch_failed`, origin), { status: 303 })
  }

  // CSV -> rows -> wybór kolumny
  const rows = parseCsv(csvText)
  const colIdx = colLetterToIndex(t.kolumna_nazwisk!)
  if (colIdx == null) {
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=col_invalid`, origin), { status: 303 })
  }

  const startAt = Math.max(1, t.pierwszy_wiersz_z_nazwiskiem || 1) // 1-based
  const picked = rows.slice(startAt - 1).map(r => (r[colIdx] || '').trim()).filter(Boolean)
  if (!picked.length) {
    console.warn('[import] empty_after_parse', { startAt, colIdx, totalRows: rows.length })
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=empty_after_parse`, origin), { status: 303 })
  }

  // przygotuj payload graczy
  const grPayload: { imie: string; nazwisko: string }[] = []
  for (const full of picked) {
    const s = splitFullName(full)
    if (!s) continue
    grPayload.push({ imie: s.imie, nazwisko: s.nazwisko })
  }
  if (!grPayload.length) {
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=empty_after_parse`, origin), { status: 303 })
  }

  // upsert graczy po kolumnie unikatowej (fullname_norm)
  const { data: inserted, error: gerr } = await supabase
    .from('gracz')
    .upsert(grPayload, { onConflict: 'fullname_norm' }) // <- poprawka
    .select('id')

  if (gerr) {
    console.error('[import] gracz_upsert_failed', gerr)
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=gracz_upsert_failed`, origin), { status: 303 })
  }

  // zbuduj payload do wyniki (unikat: turniej_id, gracz_id)
  const ids = new Set<string>()
  inserted?.forEach(r => ids.add(r.id))

  const wynikiPayload = Array.from(ids).map(gracz_id => ({ turniej_id: id, gracz_id }))
  if (wynikiPayload.length) {
    const { error: werr } = await supabase
      .from('wyniki')
      .upsert(wynikiPayload, { onConflict: 'turniej_id,gracz_id' })
    if (werr) {
      console.error('[import] wyniki_upsert_failed', werr)
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=wyniki_upsert_failed`, origin), { status: 303 })
    }
  }

  return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?ok=1`, origin), { status: 303 })
}
