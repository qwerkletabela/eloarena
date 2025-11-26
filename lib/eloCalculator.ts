// lib/eloCalculator.ts
export interface EloConfig {
  k_factor_nowy_gracz: number;
  k_factor_staly_gracz: number;
  prog_staly_gracz: number;
  k_factors: {
    below_1400: number;
    below_1800: number;
    below_2000: number;
    below_2200: number;
    above_2200: number;
  };
  games_for_new_player: number;
  bonus_k_for_new: number;
  max_k_for_new: number;
}

export interface GraczWPartii {
  id: string;
  elo_przed: number;
  liczba_partii: number;
  duzy_punkt: boolean;
}

export interface WynikElo {
  id: string;
  elo_po: number;
  zmiana_elo: number;
  k_factor: number;
}

// Dynamiczny współczynnik K jak w Google Script
function getDynamicKFor(elo: number, games: number, config: EloConfig): number {
  let K: number;
  
  // Podstawowy K na podstawie ELO
  if (elo < 1400) K = config.k_factors.below_1400;
  else if (elo < 1800) K = config.k_factors.below_1800;
  else if (elo < 2000) K = config.k_factors.below_2000;
  else if (elo < 2200) K = config.k_factors.below_2200;
  else K = config.k_factors.above_2200;
  
  // Bonus dla nowych graczy
  if (games < config.games_for_new_player) {
    K = Math.min(config.max_k_for_new, K + config.bonus_k_for_new);
  }
  
  return K;
}

// Uśrednianie K między graczami
function pairK(Kw: number, Kl: number): number {
  return (Kw > 0 && Kl > 0) ? (2 * Kw * Kl) / (Kw + Kl) : 0;
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

  // Znajdź zwycięzcę
  const zwyciezca = gracze.find(g => g.duzy_punkt);
  if (!zwyciezca) {
    throw new Error('Nie znaleziono gracza z dużym punktem');
  }

  // Oblicz skalowanie jak w Google Script
  const scale = (n >= 3) ? (2 / (n - 1)) : 1;

  // Oblicz zmiany dla każdego gracza
  for (const gracz of gracze) {
    let zmiana_elo = 0;
    const k_gracza = getDynamicKFor(gracz.elo_przed, gracz.liczba_partii, config);

    if (gracz.duzy_punkt) {
      // ZWYCIĘZCA: Zyskuje od każdego przegranego
      for (const przeciwnik of gracze) {
        if (przeciwnik.id !== gracz.id) {
          const k_przeciwnika = getDynamicKFor(przeciwnik.elo_przed, przeciwnik.liczba_partii, config);
          const k_efektywne = pairK(k_gracza, k_przeciwnika);
          
          const expected = 1 / (1 + Math.pow(10, (przeciwnik.elo_przed - gracz.elo_przed) / 400));
          const gain = k_efektywne * (1 - expected);
          
          zmiana_elo += gain;
        }
      }
    } else {
      // PRZEGRANY: Trací tylko ze zwycięzcą
      const k_zwyciezcy = getDynamicKFor(zwyciezca.elo_przed, zwyciezca.liczba_partii, config);
      const k_efektywne = pairK(k_gracza, k_zwyciezcy);
      
      const expected = 1 / (1 + Math.pow(10, (zwyciezca.elo_przed - gracz.elo_przed) / 400));
      zmiana_elo = k_efektywne * (0 - expected);
    }

    // Zastosuj skalowanie
    zmiana_elo *= scale;

    const elo_po = gracz.elo_przed + zmiana_elo;

    wyniki.push({
      id: gracz.id,
      elo_po: Math.round(elo_po * 100) / 100,
      zmiana_elo: Math.round(zmiana_elo * 100) / 100,
      k_factor: k_gracza
    });
  }

  return wyniki;
}

export function validatePartia(gracze: { id: string, duzy_punkt: boolean }[]): string[] {
  const errors: string[] = [];
  const n = gracze.length;

  if (n < 2 || n > 4) {
    errors.push(`Nieprawidłowa liczba graczy: ${n}. Wymagane 2-4 graczy.`);
    return errors;
  }

  // Sprawdź unikalność graczy
  const graczeIds = gracze.map(g => g.id);
  const unikalniGracze = [...new Set(graczeIds)];
  if (unikalniGracze.length !== n) {
    errors.push('Gracze muszą być unikalni');
  }

  // Sprawdź czy jest dokładnie jeden zwycięzca
  const zwyciezcy = gracze.filter(g => g.duzy_punkt);
  if (zwyciezcy.length !== 1) {
    errors.push('Musi być dokładnie jeden zwycięzca (duży punkt)');
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

  // Domyślna konfiguracja jeśli brak w bazie
  const fullConfig: EloConfig = config || {
    k_factor_nowy_gracz: 40,
    k_factor_staly_gracz: 20,
    prog_staly_gracz: 30,
    k_factors: {
      below_1400: 32,
      below_1800: 28,
      below_2000: 24,
      below_2200: 18,
      above_2200: 12
    },
    games_for_new_player: 20,
    bonus_k_for_new: 8,
    max_k_for_new: 40
  };

  // Przelicz każdą partię od początku
  for (const partia of wszystkiePartie) {
    await recalculateSinglePartia(supabase, partia, fullConfig);
  }

  console.log('Przeliczanie zakończone pomyślnie');
}

async function recalculateSinglePartia(supabase: any, partia: any, config: EloConfig) {
  const gracze: GraczWPartii[] = [];
  
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
          elo_przed: gracz.aktualny_elo,
          liczba_partii: gracz.liczba_partii,
          duzy_punkt: partia.duzy_punkt_gracz_id === graczId
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
    updateData[`k_factor${i+1}`] = elo?.k_factor;
  }

  // Aktualizuj partię
  await supabase
    .from('wyniki_partii')
    .update(updateData)
    .eq('id', partia.id);

  // Aktualizuj graczy
  for (const gracz of gracze) {
    const elo = noweElo.find(e => e.id === gracz.id);
    const index = gracze.findIndex(g => g.id === gracz.id) + 1;
    const malePunkty = partia[`male_punkty${index}`] || 0;
    const duzyPunkt = partia.duzy_punkt_gracz_id === gracz.id ? 1 : 0;

    // Pobierz aktualne wartości przed aktualizacją
    const { data: currentGracz } = await supabase
      .from('gracz')
      .select('suma_malych_punktow, liczba_duzych_punktow')
      .eq('id', gracz.id)
      .single();

    await supabase
      .from('gracz')
      .update({
        aktualny_elo: elo?.elo_po,
        liczba_partii: gracz.liczba_partii + 1,
        suma_malych_punktow: (currentGracz?.suma_malych_punktow || 0) + malePunkty,
        liczba_duzych_punktow: (currentGracz?.liczba_duzych_punktow || 0) + duzyPunkt,
        ostatnia_aktualizacja: new Date().toISOString()
      })
      .eq('id', gracz.id);
  }
}