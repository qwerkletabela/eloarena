import { createSupabaseServer } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { partiaId: string } }
) {
  const supabase = await createSupabaseServer()
  const { searchParams } = new URL(request.url)
  const turniejId = searchParams.get('turniejId')

  if (!turniejId) {
    return new Response(JSON.stringify({ error: 'Brak turniejId' }), { status: 400 })
  }

  try {
    // Pobierz partię
    const { data: partia, error: partiaError } = await supabase
      .from('wyniki_partii')
      .select(`
        *,
        turniej:turniej_id(id, nazwa)
      `)
      .eq('id', params.partiaId)
      .eq('turniej_id', turniejId)
      .single()

    if (partiaError || !partia) {
      return new Response(JSON.stringify({ error: 'Partia nie znaleziona' }), { status: 404 })
    }

    // Pobierz dane graczy
    const graczeIds = []
    for (let i = 1; i <= partia.liczba_graczy; i++) {
      const graczId = partia[`gracz${i}_id`]
      if (graczId) graczeIds.push(graczId)
    }

    const { data: gracze } = await supabase
      .from('gracz')
      .select('id, imie, nazwisko')
      .in('id', graczeIds)

    // Przygotuj dane graczy w partii
    const graczeWPartii = []
    for (let i = 1; i <= partia.liczba_graczy; i++) {
      const graczId = partia[`gracz${i}_id`]
      const gracz = gracze?.find(g => g.id === graczId)
      
      if (gracz) {
        graczeWPartii.push({
          id: gracz.id,
          imie: gracz.imie,
          nazwisko: gracz.nazwisko,
          male_punkty: partia[`male_punkty${i}`] || 0,
          elo_przed: partia[`elo_przed${i}`] || 1200,
          elo_po: partia[`elo_po${i}`] || 1200,
          zmiana_elo: partia[`zmiana_elo${i}`] || 0
        })
      }
    }

    return new Response(JSON.stringify({ 
      partia,
      graczeWPartii 
    }), { status: 200 })

  } catch (error) {
    console.error('Błąd pobierania partii:', error)
    return new Response(JSON.stringify({ error: 'Wewnętrzny błąd serwera' }), { status: 500 })
  }
}