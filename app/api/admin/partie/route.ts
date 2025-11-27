// app/api/admin/partie/route.ts
import { createSupabaseServer } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer()

  try {
    // Pobierz wszystkie partie z informacjami o turnieju
    const { data: partie, error } = await supabase
      .from('wyniki_partii')
      .select(`
        *,
        turniej:turniej_id(id, nazwa)
      `)
      .order('data_rozgrywki', { ascending: false })

    if (error) {
      console.error('Błąd pobierania partii:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    // Dla każdej partii pobierz graczy
    const partieZGraczami = await Promise.all(
      partie.map(async (partia) => {
        // Pobierz ID graczy z partii
        const graczeIds = []
        for (let i = 1; i <= partia.liczba_graczy; i++) {
          const graczId = partia[`gracz${i}_id`]
          if (graczId) graczeIds.push(graczId)
        }

        // Pobierz dane graczy
        const { data: gracze } = await supabase
          .from('gracz')
          .select('id, imie, nazwisko')
          .in('id', graczeIds)

        return {
          ...partia,
          gracze: gracze || []
        }
      })
    )

    return new Response(JSON.stringify({ partie: partieZGraczami }), { status: 200 })

  } catch (error) {
    console.error('Błąd pobierania partii:', error)
    return new Response(JSON.stringify({ error: 'Wewnętrzny błąd serwera' }), { status: 500 })
  }
}