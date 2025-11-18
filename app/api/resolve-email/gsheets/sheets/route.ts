import { NextRequest, NextResponse } from 'next/server'

function extractSpreadsheetId(url: string) {
  // wspiera: .../spreadsheets/d/{ID}/...  (link udostępniony)
  const m = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return m?.[1] || null
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url') || ''
    const idFromUrl = extractSpreadsheetId(url)
    const id = idFromUrl || url.trim() // pozwól też wkleić samo ID

    if (!id) {
      return NextResponse.json({ error: 'missing_id' }, { status: 400 })
    }
    const key = process.env.GOOGLE_SHEETS_API_KEY
    if (!key) {
      return NextResponse.json({ error: 'missing_api_key' }, { status: 500 })
    }

    // pobieramy tylko tytuły kart (bez danych)
    const api = `https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=sheets(properties(title))&key=${key}`
    const res = await fetch(api, { cache: 'no-store' })
    if (!res.ok) {
      const txt = await res.text()
      return NextResponse.json({ error: 'fetch_failed', details: txt }, { status: 502 })
    }

    const json = await res.json()
    const titles: string[] =
      json?.sheets?.map((s: any) => s?.properties?.title).filter(Boolean) ?? []

    return NextResponse.json({ spreadsheetId: id, sheets: titles })
  } catch (e: any) {
    return NextResponse.json({ error: 'exception', message: e?.message }, { status: 500 })
  }
}
