import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

const urlRe = /^https?:\/\/\S+$/i
const sheetColRe = /^[A-Za-z]$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔄 UPDATE ROUTE CALLED - START')
    
    const params = await context.params
    const origin = req.nextUrl.origin
    const { id } = params
    
    console.log('📝 Tournament ID from params:', id)
    
    if (!id || !UUID_RE.test(id)) {
      console.log('❌ Invalid tournament ID')
      // ZMIENIONE: przekierowanie do /admin/turniej/[id]/edit
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=invalid_id`, origin), { status: 303 })
    }

    const supabase = await createSupabaseServerMutable()
    
    // Sprawdź autoryzację
    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 User:', user?.email)
    
    if (!user) {
      console.log('❌ No user')
      return NextResponse.redirect(new URL('/auth/signin', origin), { status: 303 })
    }

    const { data: isAdmin } = await supabase.rpc('is_admin')
    console.log('🔐 Is admin:', isAdmin)
    
    if (!isAdmin) {
      console.log('❌ Not admin')
      return NextResponse.redirect(new URL('/', origin), { status: 303 })
    }

    const fd = await req.formData()
    const formKeys = Array.from(fd.keys())
    console.log('📋 Form data keys:', formKeys)
    
    // Pobierz wszystkie pola
    const nazwa = String(fd.get('nazwa') || '').trim()
    const data_turnieju = String(fd.get('data_turnieju') || '').trim()
    const godzina_turnieju = String(fd.get('godzina_turnieju') || '').trim()
    const zakonczenie_turnieju = String(fd.get('zakonczenie_turnieju') || '').trim() || null
    const gsheet_url = (String(fd.get('gsheet_url') || '').trim()) || null
    const gsheet_id = (String(fd.get('gsheet_id') || '').trim()) || null
    const arkusz_nazwa = (String(fd.get('arkusz_nazwa') || '').trim()) || null
    const kolumna_nazwisk_raw = String(fd.get('kolumna_nazwisk') || '').trim()
    const kolumna_nazwisk = kolumna_nazwisk_raw ? kolumna_nazwisk_raw.toUpperCase() : null
    const pierwszy_wiersz_raw = fd.get('pierwszy_wiersz_z_nazwiskiem')
    const pierwszy_wiersz_z_nazwiskiem = pierwszy_wiersz_raw ? Number(pierwszy_wiersz_raw) : null
    const limit_graczy_raw = fd.get('limit_graczy')
    const limit_graczy = limit_graczy_raw !== null && String(limit_graczy_raw) !== '' ? Number(limit_graczy_raw) : null
    
    const miejsce_id = String(fd.get('miejsce_id') || '').trim() || null
    
    console.log('🏟️  Place field:', { miejsce_id })
    console.log('📊 Basic fields:', { nazwa, data_turnieju, godzina_turnieju })

    // Walidacja podstawowych pól
    if (!nazwa || !data_turnieju || !godzina_turnieju) {
      console.log('❌ Missing required fields')
      // ZMIENIONE: przekierowanie do /admin/turniej/[id]/edit
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=invalid_input`, origin), { status: 303 })
    }

    // Walidacja miejsca
    if (!miejsce_id) {
      console.log('❌ No place ID provided')
      // ZMIENIONE: przekierowanie do /admin/turniej/[id]/edit
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=miejsce_required`, origin), { status: 303 })
    }

    // Sprawdź czy miejsce istnieje w bazie
    const { data: miejsce, error: miejsceError } = await supabase
      .from('miejsce_turnieju')
      .select('id, latitude, longitude')
      .eq('id', miejsce_id)
      .single()

    if (miejsceError || !miejsce) {
      console.log('❌ Place not found:', miejsce_id)
      // ZMIENIONE: przekierowanie do /admin/turniej/[id]/edit
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=place_not_found`, origin), { status: 303 })
    }

    console.log('✅ Place exists:', miejsce_id, 'with coords:', { lat: miejsce.latitude, lng: miejsce.longitude })

    // Przygotowanie danych
    const updates: Record<string, any> = {
      nazwa, 
      data_turnieju, 
      godzina_turnieju,
      zakonczenie_turnieju,
      gsheet_url, 
      gsheet_id, 
      arkusz_nazwa,
      kolumna_nazwisk, 
      pierwszy_wiersz_z_nazwiskiem,
      limit_graczy,
      miejsce_id,
      lat: miejsce.latitude,
      lng: miejsce.longitude,
    }

    console.log('💾 Final updates:', updates)

    // Aktualizacja
    const { data, error } = await supabase
      .from('turniej')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) {
      console.error('❌ Database error:', error)
      // ZMIENIONE: przekierowanie do /admin/turniej/[id]/edit
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=save_failed`, origin), { status: 303 })
    }

    console.log('✅ Full update successful:', data)
    // ZMIENIONE: przekierowanie do /admin/turniej/[id]/edit
    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?ok=1`, origin), { status: 303 })

  } catch (error) {
    console.error('💥 Unexpected error in route:', error)
    const params = await context.params
    // ZMIENIONE: przekierowanie do /admin/turniej/[id]/edit
    return NextResponse.redirect(new URL(`/admin/turniej/${params.id}/edit?e=server_error`, req.nextUrl.origin), { status: 303 })
  }
}