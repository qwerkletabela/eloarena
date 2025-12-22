// elo-arena/app/admin/turniej/[id]/partie/nowa/action/route.ts
import { createSupabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type PartiaPayload = {
  stolik: number | null
  duzyPunkt: string
  malePunkty: Array<number | null>
}

interface RequestBody {
  turniej_id: string
  numer_partii_start: number
  liczba_partii: number
  gracze: string[]
  partie: PartiaPayload[]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isValidInt(n: unknown) {
  return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n)
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()

  // auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ errors: ['Unauthorized'] }), { status: 401 })
  }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    return new Response(JSON.stringify({ errors: ['Forbidden'] }), { status: 403 })
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return new Response(JSON.stringify({ errors: ['Nieprawidłowe JSON'] }), { status: 400 })
  }

  const { turniej_id, numer_partii_start, liczba_partii, gracze, partie } = body

  // podstawowa walidacja
  if (!turniej_id) {
    return new Response(JSON.stringify({ errors: ['Brak turniej_id'] }), { status: 400 })
  }

  if (!isValidInt(numer_partii_start) || numer_partii_start < 1) {
    return new Response(JSON.stringify({ errors: ['Nieprawidłowy numer_partii_start'] }), {
      status: 400,
    })
  }

  if (!isValidInt(liczba_partii) || liczba_partii < 1 || liczba_partii > 10) {
    return new Response(JSON.stringify({ errors: ['Nieprawidłowa liczba_partii'] }), { status: 400 })
  }

  if (!Array.isArray(gracze) || gracze.length < 2 || gracze.length > 4) {
    return new Response(JSON.stringify({ errors: ['Nieprawidłowa liczba graczy'] }), { status: 400 })
  }

  if (!Array.isArray(partie) || partie.length !== liczba_partii) {
    return new Response(JSON.stringify({ errors: ['Nieprawidłowa liczba partii'] }), { status: 400 })
  }

  // sprawdź duplikaty graczy
  const uniq = new Set(gracze)
  if (uniq.size !== gracze.length) {
    return new Response(JSON.stringify({ errors: ['Gracze nie mogą się powtarzać'] }), { status: 400 })
  }

  // sprawdź czy turniej istnieje
  const { data: turniej } = await supabase
    .from('turniej')
    .select('id')
    .eq('id', turniej_id)
    .single()

  if (!turniej) {
    return new Response(JSON.stringify({ errors: ['Nie znaleziono turnieju'] }), { status: 400 })
  }

  // baza czasu – każda partia ma +1s (różne data_rozgrywki)
  const baseTime = Date.now()

  try {
    for (let partiaIndex = 0; partiaIndex < liczba_partii; partiaIndex++) {
      const p = partie[partiaIndex]
      const numer = numer_partii_start + partiaIndex

      // walidacja zwycięzcy
      if (!p?.duzyPunkt || !gracze.includes(p.duzyPunkt)) {
        return new Response(JSON.stringify({ errors: [`Partia #${numer}: nieprawidłowy zwycięzca`] }), {
          status: 400,
        })
      }

      // walidacja stolika (opcjonalnie)
      let stolik: number | null = null
      if (p.stolik === null || typeof p.stolik === 'undefined') {
        stolik = null
      } else if (typeof p.stolik === 'number' && Number.isFinite(p.stolik)) {
        const s = Math.floor(p.stolik)
        stolik = s >= 1 ? s : null
      } else {
        return new Response(JSON.stringify({ errors: [`Partia #${numer}: nieprawidłowy stolik`] }), {
          status: 400,
        })
      }

      const male = Array.isArray(p.malePunkty) ? p.malePunkty : []
      // przygotuj rekord
      const row: any = {
        turniej_id: turniej_id,
        numer_partii: numer,
        liczba_graczy: gracze.length,
        data_rozgrywki: new Date(baseTime + partiaIndex * 1000).toISOString(),
        duzy_punkt_gracz_id: p.duzyPunkt,
        stolik: stolik, // ✅ TU zapisujemy numer stolika
      }

      // gracze + małe punkty
      gracze.forEach((graczId, i) => {
        row[`gracz${i + 1}_id`] = graczId
        const mp = male[i]
        row[`male_punkty${i + 1}`] = mp === null || typeof mp === 'undefined' ? 0 : Number(mp) || 0
      })

      const { error } = await supabase.from('wyniki_partii').insert(row)
      if (error) {
        console.error('Błąd insert wyniki_partii:', error)
        return new Response(JSON.stringify({ errors: ['Błąd przy tworzeniu partii'] }), { status: 500 })
      }

      // ✅ “z odstępem 1 sekundowym po kolei” – realny odstęp
      // (jeśli wolisz tylko różne timestamps bez czekania, usuń sleep)
      if (partiaIndex < liczba_partii - 1) {
        await sleep(1000)
      }
    }

    revalidatePath(`/admin/turniej/${turniej_id}/partie`)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Błąd POST /partie/nowa/action:', err)
    return new Response(JSON.stringify({ errors: ['Wewnętrzny błąd serwera'] }), { status: 500 })
  }
}
