// elo-arena/app/turniej/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

const urlRe = /^https?:\/\/\S+$/i
const sheetColRe = /^[A-Za-z]$/
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Dozwolone warianty (muszą się zgadzać z frontendowym selectem + ewentualnym CHECK w DB)
const ALLOWED_GAMES = new Set(['Rummikub Standard', 'Rummikub Twist', 'Qwirkle'])

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin
  const supabase = await createSupabaseServerMutable()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.redirect(new URL('/auth/signin', origin), { status: 303 })

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.redirect(new URL('/', origin), { status: 303 })

  const fd = await req.formData()

  // Tournament data
  const nazwa = String(fd.get('nazwa') || '').trim()

  // NOWE: gra / wariant
  const gra = String(fd.get('gra') || '').trim()

  const data_turnieju = String(fd.get('data_turnieju') || '').trim()
  const godzina_turnieju = String(fd.get('godzina_turnieju') || '').trim()
  const zakonczenie_turnieju = String(fd.get('zakonczenie_turnieju') || '').trim() || null

  const gsheet_url = String(fd.get('gsheet_url') || '').trim() || null
  const arkusz_nazwa = String(fd.get('arkusz_nazwa') || '').trim() || null

  const kolumna_nazwisk_raw = String(fd.get('kolumna_nazwisk') || '').trim()
  const kolumna_nazwisk = kolumna_nazwisk_raw ? kolumna_nazwisk_raw.toUpperCase() : null

  const pierwszy_wiersz_z_nazwiskiem_raw = fd.get('pierwszy_wiersz_z_nazwiskiem')
  const pierwszy_wiersz_z_nazwiskiem = pierwszy_wiersz_z_nazwiskiem_raw
    ? Number(pierwszy_wiersz_z_nazwiskiem_raw)
    : null

  const limit_graczy_raw = fd.get('limit_graczy')
  const limit_graczy = limit_graczy_raw ? Number(limit_graczy_raw) : null

  // Location ID - this is the crucial field
  const miejsce_id = String(fd.get('miejsce_id') || '').trim()

  console.log('Form data received:', {
    nazwa,
    gra, // NOWE
    data_turnieju,
    godzina_turnieju,
    miejsce_id,
    wszystkieFields: Array.from(fd.keys()),
  })

  // Validations
  if (!nazwa)
    return NextResponse.redirect(new URL('/turniej/new?e=invalid_input', origin), {
      status: 303,
    })

  // NOWE: walidacja gry
  if (!gra) {
    // możesz dodać nowy kod błędu w UI, ale żeby nie ruszać mapowania – używam invalid_input
    return NextResponse.redirect(new URL('/turniej/new?e=invalid_input', origin), {
      status: 303,
    })
  }
  if (!ALLOWED_GAMES.has(gra)) {
    return NextResponse.redirect(new URL('/turniej/new?e=invalid_input', origin), {
      status: 303,
    })
  }

  if (!data_turnieju || !godzina_turnieju) {
    return NextResponse.redirect(new URL('/turniej/new?e=date_time_required', origin), {
      status: 303,
    })
  }

  // Validate that miejsce_id is provided and is a valid UUID
  if (!miejsce_id) {
    console.error('miejsce_id is missing from form data')
    return NextResponse.redirect(new URL('/turniej/new?e=location_required', origin), {
      status: 303,
    })
  }

  if (!uuidRe.test(miejsce_id)) {
    console.error('miejsce_id is not a valid UUID:', miejsce_id)
    return NextResponse.redirect(new URL('/turniej/new?e=invalid_location_id', origin), {
      status: 303,
    })
  }

  if (kolumna_nazwisk && !sheetColRe.test(kolumna_nazwisk)) {
    return NextResponse.redirect(new URL('/turniej/new?e=sheet_col_invalid', origin), {
      status: 303,
    })
  }

  if (
    pierwszy_wiersz_z_nazwiskiem !== null &&
    (!Number.isFinite(pierwszy_wiersz_z_nazwiskiem) || pierwszy_wiersz_z_nazwiskiem < 1)
  ) {
    return NextResponse.redirect(new URL('/turniej/new?e=number_invalid', origin), {
      status: 303,
    })
  }

  if (limit_graczy !== null && (!Number.isFinite(limit_graczy) || limit_graczy < 1)) {
    return NextResponse.redirect(new URL('/turniej/new?e=number_invalid', origin), {
      status: 303,
    })
  }

  if (gsheet_url && !urlRe.test(gsheet_url)) {
    return NextResponse.redirect(new URL('/turniej/new?e=url_invalid', origin), {
      status: 303,
    })
  }

  // Verify that the location exists and get location details
  const { data: location, error: locationError } = await supabase
    .from('miejsce_turnieju')
    .select('id, nazwa, miasto')
    .eq('id', miejsce_id)
    .single()

  if (locationError || !location) {
    console.error('Location not found:', miejsce_id, locationError)
    return NextResponse.redirect(new URL('/turniej/new?e=location_not_found', origin), {
      status: 303,
    })
  }

  const payload = {
    nazwa,
    gra, // <-- NOWE: zapis do bazy
    data_turnieju,
    godzina_turnieju,
    zakonczenie_turnieju,
    gsheet_url,
    arkusz_nazwa,
    kolumna_nazwisk,
    pierwszy_wiersz_z_nazwiskiem,
    limit_graczy,
    miejsce_id,
    created_by: user.id,
  }

  console.log('Inserting tournament with payload:', payload)

  const { error } = await supabase.from('turniej').insert(payload)
  if (error) {
    console.error('insert turniej error', error)
    return NextResponse.redirect(new URL('/turniej/new?e=database_error', origin), {
      status: 303,
    })
  }

  // Przekierowanie z danymi do modala / strony
  const params = new URLSearchParams({
    ok: '1',
    nazwa: encodeURIComponent(nazwa),
    gra: encodeURIComponent(gra), // <-- NOWE (opcjonalnie do UI)
    data: encodeURIComponent(data_turnieju),
    miejsce: encodeURIComponent(`${location.nazwa} - ${location.miasto}`),
  })

  return NextResponse.redirect(new URL(`/turniej/new?${params.toString()}`, origin), {
    status: 303,
  })
}
