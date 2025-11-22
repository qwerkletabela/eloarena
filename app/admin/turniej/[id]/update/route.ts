import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

const urlRe = /^https?:\/\/\S+$/i
const sheetColRe = /^[A-Za-z]$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const origin = req.nextUrl.origin
  const { id } = await ctx.params
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.redirect(new URL('/admin/turniej?e=invalid_id', origin), { status: 303 })
  }

  const supabase = await createSupabaseServerMutable()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/signin', origin), { status: 303 })
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.redirect(new URL('/', origin), { status: 303 })

  const fd = await req.formData()
  const nazwa = String(fd.get('nazwa') || '').trim()
  const data_turnieju = String(fd.get('data_turnieju') || '').trim()
  const godzina_turnieju = String(fd.get('godzina_turnieju') || '').trim()
  const zakonczenie_turnieju = String(fd.get('zakonczenie_turnieju') || '').trim() || null // DODANE

  const gsheet_url = (String(fd.get('gsheet_url') || '').trim()) || null
  const gsheet_id = (String(fd.get('gsheet_id') || '').trim()) || null
  const arkusz_nazwa = (String(fd.get('arkusz_nazwa') || '').trim()) || null

  const kolumna_nazwisk_raw = String(fd.get('kolumna_nazwisk') || '').trim()
  const kolumna_nazwisk = kolumna_nazwisk_raw ? kolumna_nazwisk_raw.toUpperCase() : null

  const pierwszy_wiersz_raw = fd.get('pierwszy_wiersz_z_nazwiskiem')
  const pierwszy_wiersz_z_nazwiskiem = pierwszy_wiersz_raw ? Number(pierwszy_wiersz_raw) : null

  const limit_graczy_raw = fd.get('limit_graczy')
  const limit_graczy = limit_graczy_raw !== null && String(limit_graczy_raw) !== '' ? Number(limit_graczy_raw) : null

  const lat_raw = fd.get('lat')
  const lng_raw = fd.get('lng')
  const lat = lat_raw !== null && String(lat_raw) !== '' ? Number(lat_raw) : null
  const lng = lng_raw !== null && String(lng_raw) !== '' ? Number(lng_raw) : null

  if (!nazwa || !data_turnieju || !godzina_turnieju) {
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=invalid_input`, origin), { status: 303 })
  }
  if (kolumna_nazwisk && !sheetColRe.test(kolumna_nazwisk)) {
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=sheet_col_invalid`, origin), { status: 303 })
  }
  if (pierwszy_wiersz_z_nazwiskiem !== null && (!Number.isFinite(pierwszy_wiersz_z_nazwiskiem) || pierwszy_wiersz_z_nazwiskiem < 1)) {
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=number_invalid`, origin), { status: 303 })
  }
  if (limit_graczy !== null && (!Number.isFinite(limit_graczy) || limit_graczy < 1)) {
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=number_invalid`, origin), { status: 303 })
  }
  if (gsheet_url && !urlRe.test(gsheet_url)) {
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=url_invalid`, origin), { status: 303 })
  }
  if (lat !== null && !Number.isFinite(lat)) {
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=number_invalid`, origin), { status: 303 })
  }
  if (lng !== null && !Number.isFinite(lng)) {
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=number_invalid`, origin), { status: 303 })
  }

  const updates: Record<string, any> = {
    nazwa, 
    data_turnieju, 
    godzina_turnieju,
    zakonczenie_turnieju, // DODANE
    gsheet_url, 
    gsheet_id, 
    arkusz_nazwa,
    kolumna_nazwisk, 
    pierwszy_wiersz_z_nazwiskiem,
    limit_graczy, 
    lat, 
    lng,
  }

  const { error } = await supabase.from('turniej').update(updates).eq('id', id)
  if (error) {
    console.error('update turniej error', error)
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=save_failed`, origin), { status: 303 })
  }

  return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?ok=1`, origin), { status: 303 })
}