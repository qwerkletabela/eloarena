// app/api/admin/partie/[partiaId]/route.ts
import { createSupabaseServer } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ partiaId: string }> }
) {
  const supabase = await createSupabaseServer()
  const { searchParams } = new URL(request.url)
  const turniejId = searchParams.get('turniejId')

  const resolvedParams = await params
  const partiaId = resolvedParams.partiaId

  try {
    // Sprawdź uprawnienia
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    // Pobierz pełne dane partii
    const { data: partia, error: partiaError } = await supabase
      .from('wyniki_partii')
      .select('*')
      .eq('id', partiaId)
      .single()

    if (partiaError || !partia) {
      return new Response(JSON.stringify({ error: 'Partia nie znaleziona' }), { status: 404 })
    }

    // Sprawdź czy partia należy do turnieju (jeśli podano turniejId)
    if (turniejId && partia.turniej_id !== turniejId) {
      return new Response(JSON.stringify({ error: 'Partia nie należy do tego turnieju' }), { status: 400 })
    }

    // Przygotuj dane graczy do aktualizacji
    const graczeAktualizacje = []
    const zwyciezcaId = partia.duzy_punkt_gracz_id

    for (let i = 1; i <= partia.liczba_graczy; i++) {
      const graczId = partia[`gracz${i}_id`]
      if (graczId) {
        const eloPrzed = partia[`elo_przed${i}`] || 1200
        const zmianaElo = partia[`zmiana_elo${i}`] || 0
        const czyWygral = graczId === zwyciezcaId

        graczeAktualizacje.push({
          id: graczId,
          eloPrzed,
          zmianaElo,
          czyWygral
        })
      }
    }

    // Wykonaj wszystkie aktualizacje w transakcji
    for (const gracz of graczeAktualizacje) {
      // Pobierz aktualne dane gracza
      const { data: aktualnyGracz, error: graczError } = await supabase
        .from('gracz')
        .select('ranking, games_played, wins')
        .eq('id', gracz.id)
        .single()

      if (graczError) {
        console.error(`Błąd pobierania gracza ${gracz.id}:`, graczError)
        continue
      }

      // Przygotuj nowe wartości
      const nowyRanking = gracz.eloPrzed // Przywróć ELO sprzed partii
      const noweGamesPlayed = Math.max(0, (aktualnyGracz.games_played || 0) - 1)
      const noweWins = gracz.czyWygral 
        ? Math.max(0, (aktualnyGracz.wins || 0) - 1)
        : (aktualnyGracz.wins || 0)

      // Zaktualizuj gracza
      const { error: updateError } = await supabase
        .from('gracz')
        .update({
          ranking: nowyRanking,
          games_played: noweGamesPlayed,
          wins: noweWins,
          updated_at: new Date().toISOString()
        })
        .eq('id', gracz.id)

      if (updateError) {
        console.error(`Błąd aktualizacji gracza ${gracz.id}:`, updateError)
        // Kontynuuj mimo błędu - nie przerywaj całej operacji
      }
    }

    // Usuń partię
    const { error: deleteError } = await supabase
      .from('wyniki_partii')
      .delete()
      .eq('id', partiaId)

    if (deleteError) {
      return new Response(JSON.stringify({ error: 'Błąd usuwania partii' }), { status: 500 })
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `Partia usunięta. Przywrócono rankingi ${graczeAktualizacje.length} graczy.`
    }), { status: 200 })

  } catch (error) {
    console.error('Błąd usuwania partii:', error)
    return new Response(JSON.stringify({ error: 'Wewnętrzny błąd serwera' }), { status: 500 })
  }
}