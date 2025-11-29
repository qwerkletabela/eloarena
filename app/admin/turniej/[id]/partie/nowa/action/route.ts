// elo-arena/app/admin/turniej/[id]/partie/nowa/action/route.ts
import { createSupabaseServer } from '@/lib/supabase/server'
import { calculateEloChanges, validatePartia } from '@/lib/eloCalculator'
import { revalidatePath } from 'next/cache'

interface RequestBody {
  turniej_id: string
  numer_partii_start: number
  liczba_partii: number
  gracze: string[]
  partie: Array<{
    duzyPunkt: string
    malePunkty: number[]
  }>
}

interface ZmianaElo {
  gracz_id: string
  imie: string
  nazwisko: string
  elo_przed: number
  elo_po: number
  zmiana_elo: number
  male_punkty: number
  duzy_punkt: boolean
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()

  // Sprawdzenie uprawnień
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ errors: ['Unauthorized'] }), { status: 401 })
  }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    return new Response(JSON.stringify({ errors: ['Forbidden'] }), { status: 403 })
  }

  const body: RequestBody = await request.json()
  const { turniej_id, numer_partii_start, liczba_partii, gracze, partie } = body

  // Walidacja podstawowa
  if (!gracze || gracze.length < 2 || gracze.length > 4) {
    return new Response(JSON.stringify({ errors: ['Nieprawidłowa liczba graczy'] }), { status: 400 })
  }

  if (!partie || partie.length !== liczba_partii) {
    return new Response(JSON.stringify({ errors: ['Nieprawidłowa liczba partii'] }), { status: 400 })
  }

  const wszystkieZmiany: ZmianaElo[][] = []

  try {
    // Pobierz aktualne dane graczy (raz na początku)
    const { data: aktualneElo } = await supabase
      .from('gracz')
      .select('id, imie, nazwisko, aktualny_elo, liczba_partii, suma_malych_punktow, liczba_duzych_punktow')
      .in('id', gracze)

    if (!aktualneElo || aktualneElo.length !== gracze.length) {
      return new Response(JSON.stringify({ errors: ['Błąd pobierania rankingu graczy'] }), { status: 400 })
    }

    // Pobierz konfigurację Elo
    const { data: config } = await supabase
      .from('elo_config')
      .select('*')
      .single()

    // Przygotuj początkowy stan graczy
    let stanGraczy = aktualneElo.map(gracz => ({
      id: gracz.id,
      imie: gracz.imie,
      nazwisko: gracz.nazwisko,
      aktualny_elo: gracz.aktualny_elo,
      liczba_partii: gracz.liczba_partii,
      suma_malych_punktow: gracz.suma_malych_punktow,
      liczba_duzych_punktow: gracz.liczba_duzych_punktow
    }))

    // Przetwarzaj każdą partię sekwencyjnie
    for (let partiaIndex = 0; partiaIndex < liczba_partii; partiaIndex++) {
      const partiaData = partie[partiaIndex]
      const numerBiezacejPartii = numer_partii_start + partiaIndex

      // Przygotuj dane graczy dla walidacji
      const wybraniGracze = gracze.map((graczId, index) => ({
        id: graczId,
        duzy_punkt: partiaData.duzyPunkt === graczId,
        male_punkty: partiaData.malePunkty[index] || 0
      }))

      // Walidacja partii
      const errors = validatePartia(wybraniGracze.map(g => ({ id: g.id, duzy_punkt: g.duzy_punkt })))
      if (errors.length > 0) {
        console.error('Błędy walidacji partii:', partiaIndex, errors)
        return new Response(JSON.stringify({ errors }), { status: 400 })
      }

      // Przygotuj dane do obliczenia Elo
      const graczeDoObliczen = wybraniGracze.map(g => {
        const graczStan = stanGraczy.find(s => s.id === g.id)
        return {
          id: g.id,
          elo_przed: graczStan?.aktualny_elo || 1200,
          liczba_partii: graczStan?.liczba_partii || 0,
          duzy_punkt: g.duzy_punkt
        }
      })

      // Oblicz nowe Elo
      const noweElo = calculateEloChanges(graczeDoObliczen, config || {
        k_factor_nowy_gracz: 40,
        k_factor_staly_gracz: 20,
        prog_staly_gracz: 30
      })

      // Stwórz partię
      const partiaDoZapisu: any = {
        turniej_id: turniej_id,
        numer_partii: numerBiezacejPartii,
        liczba_graczy: gracze.length,
        data_rozgrywki: new Date().toISOString(),
        duzy_punkt_gracz_id: partiaData.duzyPunkt
      }

      // Uzupełnij dane dla każdego gracza
      gracze.forEach((graczId, index) => {
        const graczStan = stanGraczy.find(s => s.id === graczId)
        const elo = noweElo.find(e => e.id === graczId)
        
        partiaDoZapisu[`gracz${index+1}_id`] = graczId
        partiaDoZapisu[`male_punkty${index+1}`] = partiaData.malePunkty[index] || 0
        partiaDoZapisu[`elo_przed${index+1}`] = graczStan?.aktualny_elo || 1200
        partiaDoZapisu[`elo_po${index+1}`] = elo?.elo_po
        partiaDoZapisu[`zmiana_elo${index+1}`] = elo?.zmiana_elo
      })

      // Wstaw partię do bazy
      const { data: nowaPartia, error: errorPartia } = await supabase
        .from('wyniki_partii')
        .insert(partiaDoZapisu)
        .select()
        .single()

      if (errorPartia) {
        console.error('Błąd przy tworzeniu partii:', errorPartia)
        return new Response(JSON.stringify({ errors: ['Błąd przy tworzeniu partii'] }), { status: 500 })
      }

      // Aktualizuj stan graczy dla następnej partii
      stanGraczy = stanGraczy.map(gracz => {
        const elo = noweElo.find(e => e.id === gracz.id)
        const wybranyGracz = wybraniGracze.find(g => g.id === gracz.id)
        
        return {
          ...gracz,
          aktualny_elo: elo?.elo_po || gracz.aktualny_elo,
          liczba_partii: gracz.liczba_partii + 1,
          suma_malych_punktow: gracz.suma_malych_punktow + (wybranyGracz?.male_punkty || 0),
          liczba_duzych_punktow: gracz.liczba_duzych_punktow + (wybranyGracz?.duzy_punkt ? 1 : 0)
        }
      })

      // Przygotuj dane do podsumowania
      const zmiany = wybraniGracze.map(g => {
        const graczStan = stanGraczy.find(s => s.id === g.id)
        const elo = noweElo.find(e => e.id === g.id)
        
        return {
          gracz_id: g.id,
          imie: graczStan?.imie || '',
          nazwisko: graczStan?.nazwisko || '',
          elo_przed: graczeDoObliczen.find(d => d.id === g.id)?.elo_przed || 1200,
          elo_po: elo?.elo_po || 1200,
          zmiana_elo: elo?.zmiana_elo || 0,
          male_punkty: g.male_punkty,
          duzy_punkt: g.duzy_punkt
        }
      })

      wszystkieZmiany.push(zmiany)
    }

    // Na koniec zaktualizuj graczy w bazie danych
    for (const gracz of stanGraczy) {
      const { error: errorUpdate } = await supabase
        .from('gracz')
        .update({
          aktualny_elo: gracz.aktualny_elo,
          liczba_partii: gracz.liczba_partii,
          suma_malych_punktow: gracz.suma_malych_punktow,
          liczba_duzych_punktow: gracz.liczba_duzych_punktow,
          ostatnia_aktualizacja: new Date().toISOString()
        })
        .eq('id', gracz.id)

      if (errorUpdate) {
        console.error('Błąd aktualizacji rankingu gracza:', errorUpdate)
      }
    }

    // Revalidate path
    revalidatePath(`/admin/turniej/${turniej_id}/partie`)

    return new Response(JSON.stringify({ 
      success: true,
      zmiany: wszystkieZmiany
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Błąd podczas zapisywania partii:', error)
    return new Response(JSON.stringify({ errors: ['Wewnętrzny błąd serwera'] }), { status: 500 })
  }
}