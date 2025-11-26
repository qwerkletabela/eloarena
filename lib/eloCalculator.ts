export interface EloConfig {
  k_factor_nowy_gracz: number;
  k_factor_staly_gracz: number;
  prog_staly_gracz: number;
}

export interface GraczWPartii {
  id: string;
  miejsce: number;
  elo_przed: number;
  liczba_partii: number;
}

export interface WynikElo {
  id: string;
  elo_po: number;
  zmiana_elo: number;
  k_factor: number;
}

export function calculateEloChanges(
  gracze: GraczWPartii[],
  config: EloConfig
): WynikElo[] {
  const wyniki: WynikElo[] = [];
  const n = gracze.length;
  
  if (n < 2 || n > 4) {
    throw new Error(`Nieprawidłowa liczba graczy: ${n}. Wymagane 2-4 graczy.`);
  }

  const posortowaniGracze = [...gracze].sort((a, b) => a.miejsce - b.miejsce);

  for (let i = 0; i < n; i++) {
    const gracz = posortowaniGracze[i];
    
    let k_factor = config.k_factor_staly_gracz;
    if (gracz.liczba_partii < config.prog_staly_gracz) {
      k_factor = config.k_factor_nowy_gracz;
    }

    let expected = 0;
    const actual = calculateActualScore(gracz.miejsce, n);

    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const opponent = posortowaniGracze[j];
        expected += 1 / (1 + Math.pow(10, (opponent.elo_przed - gracz.elo_przed) / 400));
      }
    }

    if (n > 1) {
      expected = expected / (n - 1);
    }

    const zmiana_elo = k_factor * (actual - expected);
    const elo_po = gracz.elo_przed + zmiana_elo;

    wyniki.push({
      id: gracz.id,
      elo_po: Math.round(elo_po * 100) / 100,
      zmiana_elo: Math.round(zmiana_elo * 100) / 100,
      k_factor: k_factor
    });
  }

  return wyniki;
}

function calculateActualScore(miejsce: number, liczbaGraczy: number): number {
  switch (liczbaGraczy) {
    case 2:
      return miejsce === 1 ? 1.0 : 0.0;
    case 3:
      return miejsce === 1 ? 1.0 : miejsce === 2 ? 0.5 : 0.0;
    case 4:
      return miejsce === 1 ? 1.0 : miejsce === 2 ? 0.67 : miejsce === 3 ? 0.33 : 0.0;
    default:
      return 0.0;
  }
}

export function validatePartia(gracze: { id: string, miejsce: number }[]): string[] {
  const errors: string[] = [];
  const n = gracze.length;

  if (n < 2 || n > 4) {
    errors.push(`Nieprawidłowa liczba graczy: ${n}. Wymagane 2-4 graczy.`);
    return errors;
  }

  const miejsca = gracze.map(g => g.miejsce);
  const unikalneMiejsca = [...new Set(miejsca)];
  
  if (unikalneMiejsca.length !== n) {
    errors.push(`Miejsca muszą być unikalne. Obecne miejsca: ${miejsca.join(', ')}`);
  }

  for (const miejsce of miejsca) {
    if (miejsce < 1 || miejsce > n) {
      errors.push(`Nieprawidłowe miejsce: ${miejsce}. Miejsca muszą być w zakresie 1-${n}.`);
      break;
    }
  }

  return errors;
}

// Funkcja do przeliczania całej historii od początku
export async function recalculateAllElo(supabase: any, turniej_id?: string) {
  console.log('Rozpoczynam przeliczanie całej historii Elo...');
  
  // Resetuj ranking wszystkich graczy
  const { error: resetError } = await supabase
    .from('gracz')
    .update({
      aktualny_elo: 1200,
      liczba_partii: 0,
      suma_malych_punktow: 0,
      liczba_duzych_punktow: 0,
      ostatnia_aktualizacja: new Date().toISOString()
    });

  if (resetError) {
    console.error('Błąd resetowania rankingu:', resetError);
    return;
  }

  // Pobierz wszystkie partie w kolejności chronologicznej
  let query = supabase
    .from('wyniki_partii')
    .select('*')
    .order('data_rozgrywki', { ascending: true })
    .order('numer_partii', { ascending: true });

  if (turniej_id) {
    query = query.eq('turniej_id', turniej_id);
  }

  const { data: wszystkiePartie, error } = await query;

  if (error) {
    console.error('Błąd pobierania partii:', error);
    return;
  }

  console.log(`Znaleziono ${wszystkiePartie.length} partii do przeliczenia`);

  // Pobierz konfigurację Elo
  const { data: config } = await supabase
    .from('elo_config')
    .select('*')
    .single();

  // Przelicz każdą partię od początku
  for (const partia of wszystkiePartie) {
    await recalculateSinglePartia(supabase, partia, config);
  }

  console.log('Przeliczanie zakończone pomyślnie');
}

async function recalculateSinglePartia(supabase: any, partia: any, config: any) {
  const gracze = [];
  
  // Przygotuj dane graczy do obliczeń Elo
  for (let i = 1; i <= partia.liczba_graczy; i++) {
    const graczId = partia[`gracz${i}_id`];
    if (graczId) {
      // Pobierz aktualny stan gracza
      const { data: gracz } = await supabase
        .from('gracz')
        .select('*')
        .eq('id', graczId)
        .single();

      if (gracz) {
        gracze.push({
          id: graczId,
          miejsce: partia[`miejsce${i}`],
          elo_przed: gracz.aktualny_elo,
          liczba_partii: gracz.liczba_partii,
          // Zapisz referencję do całego obiektu gracza dla późniejszej aktualizacji
          gracz_data: gracz
        });
      }
    }
  }

  // Oblicz nowe Elo
  const noweElo = calculateEloChanges(gracze, config);

  // Przygotuj dane do aktualizacji partii
  const updateData: any = {};
  for (let i = 0; i < gracze.length; i++) {
    const gracz = gracze[i];
    const elo = noweElo.find(e => e.id === gracz.id);
    
    updateData[`elo_przed${i+1}`] = gracz.elo_przed;
    updateData[`elo_po${i+1}`] = elo?.elo_po;
    updateData[`zmiana_elo${i+1}`] = elo?.zmiana_elo;
  }

  // Aktualizuj partię
  await supabase
    .from('wyniki_partii')
    .update(updateData)
    .eq('id', partia.id);

  // Aktualizuj graczy - używając pobranych danych zamiast sql
  for (const gracz of gracze) {
    const elo = noweElo.find(e => e.id === gracz.id);
    const index = gracze.findIndex(g => g.id === gracz.id) + 1;
    const malePunkty = partia[`male_punkty${index}`] || 0;
    const duzyPunkt = partia.duzy_punkt_gracz_id === gracz.id ? 1 : 0;

    await supabase
      .from('gracz')
      .update({
        aktualny_elo: elo?.elo_po,
        liczba_partii: gracz.gracz_data.liczba_partii + 1,
        suma_malych_punktow: gracz.gracz_data.suma_malych_punktow + malePunkty,
        liczba_duzych_punktow: gracz.gracz_data.liczba_duzych_punktow + duzyPunkt,
        ostatnia_aktualizacja: new Date().toISOString()
      })
      .eq('id', gracz.id);
  }
}