// elo-arena/app/admin/turniej/[id]/partie/nowa/action/route.ts
import { createSupabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface RequestBody {
  turniej_id: string
  numer_partii_start: number
  liczba_partii: number
  gracze: string[] // 2-4 graczy, w stałej kolejności
  partie: Array<{
    duzyPunkt: string // id zwycięzcy (musi być jednym z gracze[])
    malePunkty: Array<number | null> // opcjonalne, mogą być null
  }>
}

function validateBasic(body: RequestBody) {
  const errors: string[] = []

  if (!body.turniej_id) errors.push('Brak turniej_id')
  if (!Number.isFinite(body.numer_partii_start) || body.numer_partii_start < 1)
    errors.push('Nieprawidłowy numer_partii_start')
  if (!Number.isFinite(body.liczba_partii) || body.liczba_partii < 1 || body.liczba_partii > 10)
    errors.push('Nieprawidłowa liczba_partii (1-10)')

  if (!body.gracze || body.gracze.length < 2 || body.gracze.length > 4)
    errors.push('Nieprawidłowa liczba graczy (2-4)')

  // brak duplikatów graczy
  if (body.gracze) {
    const set = new Set(body.gracze)
    if (set.size !== body.gracze.length) errors.push('Gracze nie mogą się powtarzać')
  }

  if (!body.partie || body.partie.length !== body.liczba_partii)
    errors.push('Nieprawidłowa liczba partii')

  // walidacja każdej partii: zwycięzca musi być wśród gracze[]
  body.partie?.forEach((p, idx) => {
    if (!p.duzyPunkt) errors.push(`Partia ${idx + 1}: nie wybrano zwycięzcy`)
    if (p.duzyPunkt && !body.gracze.includes(p.duzyPunkt))
      errors.push(`Partia ${idx + 1}: zwycięzca nie jest wśród wybranych graczy`)

    // małe punkty: jeśli wpisane, muszą być liczbą
    if (p.malePunkty && Array.isArray(p.malePunkty)) {
      p.malePunkty.forEach((val, i) => {
        if (val === null || val === undefined) return
        if (!Number.isFinite(val))
          errors.push(`Partia ${idx + 1}: nieprawidłowe małe punkty gracza ${i + 1}`)
      })
    }
  })

  return errors
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()

  // Sprawdzenie uprawnień
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

  const body: RequestBody = await request.json()
  const errors = validateBasic(body)
  if (errors.length > 0) {
    return new Response(JSON.stringify({ errors }), { status: 400 })
  }

  const { turniej_id, numer_partii_start, liczba_partii, gracze, partie } = body

  try {
    // ✅ baza czasu "teraz", a kolejne partie dostają +1s, +2s, +3s...
    const baseTime = Date.now()

    // przygotuj rekordy do insertu
    const rows = partie.map((p, partiaIndex) => {
      const numer = numer_partii_start + partiaIndex

      const row: any = {
        turniej_id,
        numer_partii: numer,
        liczba_graczy: gracze.length,
        // ✅ każdy rekord ma inny timestamp, ale bez realnego czekania
        data_rozgrywki: new Date(baseTime + partiaIndex * 1000).toISOString(),
        duzy_punkt_gracz_id: p.duzyPunkt,
      }

      // ustaw graczy + małe punkty w tej samej kolejności co "gracze[]"
      gracze.forEach((graczId, i) => {
        row[`gracz${i + 1}_id`] = graczId

        // małe punkty opcjonalne: null => zapisujemy 0 (prościej dla raportów)
        const mp = p.malePunkty?.[i]
        row[`male_punkty${i + 1}`] = mp === null || mp === undefined ? 0 : mp
      })

      // wyczyść sloty 4-go gracza jeśli partia jest na 2-3 osoby (u Ciebie to i tak 2-4)
      for (let i = gracze.length; i < 4; i++) {
        row[`gracz${i + 1}_id`] = null
        row[`male_punkty${i + 1}`] = 0
      }

      return row
    })

    const { error: insertError } = await supabase.from('wyniki_partii').insert(rows)
    if (insertError) {
      console.error('Błąd przy tworzeniu partii:', insertError)
      return new Response(JSON.stringify({ errors: ['Błąd przy tworzeniu partii'] }), { status: 500 })
    }

    // odśwież widok listy partii
    revalidatePath(`/admin/turniej/${turniej_id}/partie`)

    return new Response(
      JSON.stringify({
        success: true,
        saved: liczba_partii,
        numer_od: numer_partii_start,
        numer_do: numer_partii_start + liczba_partii - 1,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('Błąd podczas zapisywania partii:', err)
    return new Response(JSON.stringify({ errors: ['Wewnętrzny błąd serwera'] }), { status: 500 })
  }
}
