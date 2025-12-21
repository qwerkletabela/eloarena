// elo-arena/app/admin/turniej/[id]/update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

const urlRe = /^https?:\/\/\S+$/i
const sheetColRe = /^[A-Za-z]$/
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const GAME_VALUES = new Set(['rummikub_standard', 'rummikub_twist', 'qwirkle', 'rummikub_duel', 'rummikub_expert'])

function toNullIfEmpty(v: unknown): string | null {
  const s = String(v ?? '').trim()
  return s === '' ? null : s
}

function toIntOrNull(v: unknown): number | null {
  const s = String(v ?? '').trim()
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const origin = req.nextUrl.origin
    const { id } = params

    if (!id || !UUID_RE.test(id)) {
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=invalid_id`, origin), {
        status: 303,
      })
    }

    const supabase = await createSupabaseServerMutable()

    // 🔐 Autoryzacja
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin', origin), { status: 303 })
    }

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', origin), { status: 303 })
    }

    const fd = await req.formData()

    // wymagane
    const nazwa = String(fd.get('nazwa') || '').trim()
    const gra = String(fd.get('gra') || '').trim()
    const data_turnieju = String(fd.get('data_turnieju') || '').trim()
    const godzina_turnieju = String(fd.get('godzina_turnieju') || '').trim()

    // opcjonalne
    const zakonczenie_turnieju = toNullIfEmpty(fd.get('zakonczenie_turnieju'))
    const gsheet_url = toNullIfEmpty(fd.get('gsheet_url'))
    const arkusz_nazwa = toNullIfEmpty(fd.get('arkusz_nazwa'))

    const kolumna_nazwisk_raw = toNullIfEmpty(fd.get('kolumna_nazwisk'))
    const kolumna_nazwisk = kolumna_nazwisk_raw ? kolumna_nazwisk_raw.toUpperCase() : null

    const pierwszy_wiersz_z_nazwiskiem = toIntOrNull(fd.get('pierwszy_wiersz_z_nazwiskiem'))
    const limit_graczy = toIntOrNull(fd.get('limit_graczy'))

    const miejsce_id = toNullIfEmpty(fd.get('miejsce_id'))

    // ✅ Walidacje wymaganych
    if (!nazwa || !gra || !data_turnieju || !godzina_turnieju) {
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=invalid_input`, origin), {
        status: 303,
      })
    }

    if (!GAME_VALUES.has(gra)) {
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=invalid_game`, origin), {
        status: 303,
      })
    }

    // ✅ Walidacje opcjonalnych
    if (kolumna_nazwisk && !sheetColRe.test(kolumna_nazwisk)) {
      return NextResponse.redirect(
        new URL(`/admin/turniej/${id}/edit?e=sheet_col_invalid`, origin),
        { status: 303 }
      )
    }

    if (gsheet_url && !urlRe.test(gsheet_url)) {
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=url_invalid`, origin), {
        status: 303,
      })
    }

    if (
      pierwszy_wiersz_z_nazwiskiem !== null &&
      (Number.isNaN(pierwszy_wiersz_z_nazwiskiem) || pierwszy_wiersz_z_nazwiskiem < 1)
    ) {
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=number_invalid`, origin), {
        status: 303,
      })
    }

    if (limit_graczy !== null && (Number.isNaN(limit_graczy) || limit_graczy < 1)) {
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=number_invalid`, origin), {
        status: 303,
      })
    }

    // ✅ Walidacja miejsca (jeśli podane)
    if (miejsce_id) {
      if (!UUID_RE.test(miejsce_id)) {
        return NextResponse.redirect(
          new URL(`/admin/turniej/${id}/edit?e=invalid_location_id`, origin),
          { status: 303 }
        )
      }

      const { data: miejsce, error: miejsceError } = await supabase
        .from('miejsce_turnieju')
        .select('id')
        .eq('id', miejsce_id)
        .single()

      if (miejsceError || !miejsce) {
        return NextResponse.redirect(
          new URL(`/admin/turniej/${id}/edit?e=place_not_found`, origin),
          { status: 303 }
        )
      }
    }

    // ✅ Pobierz aktualny turniej (do blokady zmiany gry)
    const { data: existing, error: existingErr } = await supabase
      .from('turniej')
      .select('id, gra')
      .eq('id', id)
      .single()

    if (existingErr || !existing) {
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=save_failed`, origin), {
        status: 303,
      })
    }

    const oldGra = String((existing as any).gra || '').trim()

    // ✅ BLOKADA: jeśli zmiana gry i są wyniki w wyniki_partii -> stop
    if (oldGra && gra !== oldGra) {
      const { count, error: countErr } = await supabase
        .from('wyniki_partii')
        .select('id', { head: true, count: 'exact' })
        .eq('turniej_id', id)

      if (countErr) {
        return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=save_failed`, origin), {
          status: 303,
        })
      }

      if ((count ?? 0) > 0) {
        return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=gra_locked`, origin), {
          status: 303,
        })
      }
    }

    // ✅ Aktualizacja (wszystkie pola z tabeli które edytujesz)
    const updates: Record<string, any> = {
      nazwa,
      gra,
      data_turnieju,
      godzina_turnieju,
      zakonczenie_turnieju,
      limit_graczy,
      miejsce_id, // null jeśli puste
      gsheet_url,
      arkusz_nazwa,
      kolumna_nazwisk,
      pierwszy_wiersz_z_nazwiskiem,
    }

    const { error } = await supabase.from('turniej').update(updates).eq('id', id)

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?e=save_failed`, origin), {
        status: 303,
      })
    }

    return NextResponse.redirect(new URL(`/admin/turniej/${id}/edit?ok=1`, origin), {
      status: 303,
    })
  } catch (error) {
    console.error('💥 Unexpected error in route:', error)
    const params = await context.params
    return NextResponse.redirect(
      new URL(`/admin/turniej/${params.id}/edit?e=server_error`, req.nextUrl.origin),
      { status: 303 }
    )
  }
}
