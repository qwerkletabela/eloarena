import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

// pomocnicze funkcje (te same co w imporcie)
function buildCsvUrl(sheetUrl: string, sheetName?: string | null) {
  const m = sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  const id = m?.[1]; if (!id) return null
  if (sheetName && !/^\d+$/.test(sheetName)) {
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  }
  const gidMatch = sheetUrl.match(/[?&]gid=(\d+)/)
  const gid = gidMatch?.[1]
  if (gid) return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`
}

function colLetterToIndex(letter: string) {
  const l = letter.trim().toUpperCase()
  if (!/^[A-Z]+$/.test(l)) return null
  let idx = 0
  for (let i = 0; i < l.length; i++) idx = idx * 26 + (l.charCodeAt(i) - 64)
  return idx - 1
}

function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/)[0] ?? ''
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let i = 0, field = '', row: string[] = [], inQuotes = false
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue } inQuotes = false; i++; continue }
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

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createSupabaseServer()

  // auth + admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!user || !isAdmin) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // turniej
  const { data: t, error } = await supabase
    .from('turniej')
    .select('nazwa, gsheet_url, arkusz_nazwa, kolumna_nazwisk, pierwszy_wiersz_z_nazwiskiem')
    .eq('id', id)
    .maybeSingle()
  if (error || !t) return new NextResponse('Turniej nie znaleziony', { status: 404 })

  if (!t.gsheet_url || !t.kolumna_nazwisk || !t.pierwszy_wiersz_z_nazwiskiem) {
    return new NextResponse('Brak konfiguracji arkusza (url/kolumna/pierwszy wiersz)', { status: 400 })
  }

  const csvUrl = buildCsvUrl(t.gsheet_url, t.arkusz_nazwa)
  if (!csvUrl) return new NextResponse('Zły link do arkusza', { status: 400 })

  let csv = ''
  try {
    const r = await fetch(csvUrl, { headers: { 'cache-control': 'no-cache' } })
    if (!r.ok) return new NextResponse(`Nie można pobrać CSV (${r.status})`, { status: 400 })
    csv = await r.text()
  } catch {
    return new NextResponse('Błąd pobierania CSV', { status: 400 })
  }

  const colIdx = colLetterToIndex(t.kolumna_nazwisk)
  if (colIdx == null) return new NextResponse('Nieprawidłowa kolumna', { status: 400 })

  const rows = parseCsv(csv)
  const startAt = Math.max(1, t.pierwszy_wiersz_z_nazwiskiem || 1)
  const names = rows.slice(startAt - 1).map(r => (r[colIdx] || '').trim()).filter(Boolean)

  // prosty HTML – lista tylko z podanej kolumny
  const html = `<!doctype html>
<html lang="pl">
<meta charset="utf-8" />
<title>Podgląd: ${t.nazwa ?? 'Turniej'}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 16px; }
  h1 { font-size: 18px; margin: 0 0 12px; }
  ol { padding-left: 20px; }
  li { padding: 4px 0; border-bottom: 1px solid #eee; }
  .meta { color:#6b7280; font-size:12px; margin: 6px 0 12px; }
</style>
<h1>Podgląd kolumny nazwisk</h1>
<div class="meta">
Źródło: ${t.gsheet_url ? `<a href="${t.gsheet_url}" target="_blank" rel="noreferrer">Arkusz</a>` : '—'}
 • kolumna: <b>${t.kolumna_nazwisk}</b>
 • od wiersza: <b>${startAt}</b>
</div>
<ol>
  ${names.map(n => `<li>${n.replace(/</g, '&lt;')}</li>`).join('\n')}
</ol>
</html>`
  return new NextResponse(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })
}
