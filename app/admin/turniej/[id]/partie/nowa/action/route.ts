// app/admin/turniej/[id]/partie/nowa/action/route.ts
import { createSupabaseServer } from '@/lib/supabase/server'
import { calculateEloChanges, validatePartia } from '@/lib/eloCalculator'
import { revalidatePath } from 'next/cache'

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

  const formData = await request.formData()
  const turniej_id = formData.get('turniej_id') as string
  const numer_partii = parseInt(formData.get('numer_partii') as string)

  // Pobierz wybranych graczy z formularza
  const wybraniGracze = [];
  for (let i = 1; i <= 4; i++) {
    const graczId = formData.get(`gracz${i}`) as string;
    if (graczId && graczId.trim() !== '') {
      wybraniGracze.push({
        id: graczId,
        miejsce: parseInt(formData.get(`miejsce${i}`) as string),
        duzy_punkt: formData.get('duzy_punkt') === graczId,
        male_punkty: parseFloat(formData.get(`male_punkty${i}`) as string) || 0
      });
    }
  }

  // Walidacja
  const errors = validatePartia(wybraniGracze.map(g => ({ id: g.id, miejsce: g.miejsce })));
  if (errors.length > 0) {
    console.error('Błędy walidacji:', errors);
    return new Response(JSON.stringify({ errors }), { status: 400 })
  }

  // Sprawdź czy jest dokładnie jeden zwycięzca
  const zwyciezcy = wybraniGracze.filter(g => g.duzy_punkt);
  if (zwyciezcy.length !== 1) {
    return new Response(JSON.stringify({ errors: ['Musi być dokładnie jeden zwycięzca (duży punkt)'] }), { status: 400 })
  }

  // Pobierz aktualne Elo graczy (z imieniem i nazwiskiem)
  const graczeIds = wybraniGracze.map(g => g.id);
  const { data: aktualneElo } = await supabase
    .from('gracz')
    .select('id, imie, nazwisko, aktualny_elo, liczba_partii, suma_malych_punktow, liczba_duzych_punktow')
    .in('id', graczeIds)

  if (!aktualneElo || aktualneElo.length !== wybraniGracze.length) {
    return new Response(JSON.stringify({ errors: ['Błąd pobierania rankingu graczy'] }), { status: 400 })
  }

  // Pobierz konfigurację Elo
  const { data: config } = await supabase
    .from('elo_config')
    .select('*')
    .single()

  // Przygotuj dane do obliczenia Elo
  const graczeDoObliczen = wybraniGracze.map(g => {
    const graczDB = aktualneElo.find(e => e.id === g.id);
    return {
      id: g.id,
      miejsce: g.miejsce,
      elo_przed: graczDB?.aktualny_elo || 1200,
      liczba_partii: graczDB?.liczba_partii || 0
    };
  });

  // Oblicz nowe Elo
  const noweElo = calculateEloChanges(graczeDoObliczen, config || {
    k_factor_nowy_gracz: 40,
    k_factor_staly_gracz: 20,
    prog_staly_gracz: 30
  });

  // Stwórz partię
  const partiaData: any = {
    turniej_id: turniej_id,
    numer_partii: numer_partii,
    liczba_graczy: wybraniGracze.length,
    data_rozgrywki: new Date().toISOString(),
    duzy_punkt_gracz_id: zwyciezcy[0].id
  };

  // Uzupełnij dane dla każdego gracza
  wybraniGracze.forEach((g, index) => {
    const graczDB = aktualneElo.find(e => e.id === g.id);
    const elo = noweElo.find(e => e.id === g.id);
    
    partiaData[`gracz${index+1}_id`] = g.id;
    partiaData[`miejsce${index+1}`] = g.miejsce;
    partiaData[`male_punkty${index+1}`] = g.male_punkty;
    partiaData[`elo_przed${index+1}`] = graczDB?.aktualny_elo || 1200;
    partiaData[`elo_po${index+1}`] = elo?.elo_po;
    partiaData[`zmiana_elo${index+1}`] = elo?.zmiana_elo;
  });

  // Wstaw partię do bazy
  const { data: nowaPartia, error: errorPartia } = await supabase
    .from('wyniki_partii')
    .insert(partiaData)
    .select()
    .single()

  if (errorPartia) {
    console.error('Błąd przy tworzeniu partii:', errorPartia);
    return new Response(JSON.stringify({ errors: ['Błąd przy tworzeniu partii'] }), { status: 500 })
  }

  // Aktualizuj globalny ranking graczy
  for (const gracz of wybraniGracze) {
    const elo = noweElo.find(e => e.id === gracz.id);
    const graczDB = aktualneElo.find(e => e.id === gracz.id);
    
    if (graczDB) {
      const { error: errorUpdate } = await supabase
        .from('gracz')
        .update({
          aktualny_elo: elo?.elo_po,
          liczba_partii: graczDB.liczba_partii + 1,
          suma_malych_punktow: graczDB.suma_malych_punktow + gracz.male_punkty,
          liczba_duzych_punktow: graczDB.liczba_duzych_punktow + (gracz.duzy_punkt ? 1 : 0),
          ostatnia_aktualizacja: new Date().toISOString()
        })
        .eq('id', gracz.id)

      if (errorUpdate) {
        console.error('Błąd aktualizacji rankingu gracza:', errorUpdate);
      }
    }
  }

  // Przygotuj dane do podsumowania
  const zmiany = wybraniGracze.map(g => {
    const graczDB = aktualneElo.find(e => e.id === g.id);
    const elo = noweElo.find(e => e.id === g.id);
    
    return {
      gracz_id: g.id,
      imie: graczDB?.imie || '',
      nazwisko: graczDB?.nazwisko || '',
      elo_przed: graczDB?.aktualny_elo || 1200,
      elo_po: elo?.elo_po || 1200,
      zmiana_elo: elo?.zmiana_elo || 0,
      miejsce: g.miejsce,
      male_punkty: g.male_punkty,
      duzy_punkt: g.duzy_punkt
    };
  });

  // Revalidate path
  revalidatePath(`/admin/turniej/${turniej_id}/partie`)

  // Zwróć dane zamiast przekierowania
  return new Response(JSON.stringify({ 
    success: true,
    zmiany 
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}