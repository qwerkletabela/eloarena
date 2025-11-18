// app/api/gsheets/list/route.ts
import { NextRequest, NextResponse } from 'next/server'

function extractSheetId(url: string) {
  const m = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return m?.[1] ?? null
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') || ''
  const sheetId = extractSheetId(url)
  if (!sheetId) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  }

  // Publiczny feed z listą arkuszy (wymaga publikacji/udostępnienia linkiem)
  const feed = `https://spreadsheets.google.com/feeds/worksheets/${sheetId}/public/full?alt=json`

  try {
    const r = await fetch(feed, { cache: 'no-store' })
    if (!r.ok) {
      return NextResponse.json({ error: 'fetch_failed', status: r.status }, { status: 400 })
    }
    const j = await r.json() as any
    const entries: any[] = j?.feed?.entry || []

    const sheets = entries.map((e) => {
      const name: string = e?.title?.$t ?? ''
      const linkHref: string = e?.link?.[0]?.href ?? ''
      // spróbuj wyciągnąć gid z href
      const gidMatch = linkHref.match(/[?&]gid=(\d+)/)
      const gid = gidMatch?.[1] ?? null
      return { name, gid }
    }).filter(s => s.name)

    return NextResponse.json({ sheets }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: 'exception' }, { status: 500 })
  }
}
