import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { 
  Plus, 
  Users, 
  Trophy, 
  Calendar,
  ArrowLeft,
  Eye,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface GraczWPartii {
  id: string
  imie: string
  nazwisko: string
  elo_przed: number
  elo_po: number
  zmiana_elo: number
  male_punkty: number
}

interface Partia {
  id: string
  numer_partii: number
  data_rozgrywki: string
  liczba_graczy: number
  duzy_punkt_gracz_id: string
  gracze: GraczWPartii[]
}

interface Turniej {
  id: string
  nazwa: string
}

export default async function PartieTurniejuPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  // Oczekujemy na params
  const { id: turniejId } = await params;
  const supabase = await createSupabaseServer()

  // Pobierz dane turnieju
  const { data: turniej, error: turniejError } = await supabase
    .from('turniej')
    .select('id, nazwa')
    .eq('id', turniejId)
    .single()

  if (turniejError) {
    console.error('Błąd pobierania turnieju:', turniejError)
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Błąd</h1>
          <p className="text-slate-400 mb-6">Nie udało się załadować turnieju</p>
          <Link
            href="/admin/turniej"
            className="text-sky-500 hover:text-sky-400"
          >
            Powrót do listy turniejów
          </Link>
        </div>
      </div>
    )
  }

  // Pobierz partie TYLKO z tego turnieju
  const { data: partie, error: partieError } = await supabase
    .from('wyniki_partii')
    .select(`
      id,
      numer_partii,
      data_rozgrywki,
      liczba_graczy,
      duzy_punkt_gracz_id,
      gracz1_id,
      gracz2_id,
      gracz3_id,
      gracz4_id,
      male_punkty1,
      male_punkty2,
      male_punkty3,
      male_punkty4,
      elo_przed1,
      elo_przed2,
      elo_przed3,
      elo_przed4,
      elo_po1,
      elo_po2,
      elo_po3,
      elo_po4,
      zmiana_elo1,
      zmiana_elo2,
      zmiana_elo3,
      zmiana_elo4
    `)
    .eq('turniej_id', turniejId)
    .order('numer_partii', { ascending: true })

  if (partieError) {
    console.error('Błąd pobierania partii:', partieError)
  }

  console.log(`Pobrano ${partie?.length || 0} partii dla turnieju ${turniejId}`)

  // Zbierz wszystkie ID graczy występujących w partiach
  const graczeIds = new Set<string>()
  partie?.forEach(partia => {
    for (let i = 1; i <= 4; i++) {
      const graczId = partia[`gracz${i}_id` as keyof typeof partia] as string
      if (graczId) graczeIds.add(graczId)
    }
  })

  // Pobierz dane graczy
  const { data: gracze, error: graczeError } = await supabase
    .from('gracz')
    .select('id, imie, nazwisko')
    .in('id', Array.from(graczeIds))

  if (graczeError) {
    console.error('Błąd pobierania graczy:', graczeError)
  }

  // Przygotuj dane partii z informacjami o graczach
  const partieZGraczami: Partia[] = partie?.map(partia => {
    const graczePartii: GraczWPartii[] = []
    
    for (let i = 1; i <= partia.liczba_graczy; i++) {
      const graczId = partia[`gracz${i}_id` as keyof typeof partia] as string
      const gracz = gracze?.find(g => g.id === graczId)
      
      if (gracz) {
        graczePartii.push({
          id: gracz.id,
          imie: gracz.imie,
          nazwisko: gracz.nazwisko,
          elo_przed: partia[`elo_przed${i}` as keyof typeof partia] as number || 1200,
          elo_po: partia[`elo_po${i}` as keyof typeof partia] as number || 1200,
          zmiana_elo: partia[`zmiana_elo${i}` as keyof typeof partia] as number || 0,
          male_punkty: partia[`male_punkty${i}` as keyof typeof partia] as number || 0
        })
      }
    }

    return {
      id: partia.id,
      numer_partii: partia.numer_partii,
      data_rozgrywki: partia.data_rozgrywki,
      liczba_graczy: partia.liczba_graczy,
      duzy_punkt_gracz_id: partia.duzy_punkt_gracz_id,
      gracze: graczePartii
    }
  }) || []

  // Oblicz następny numer partii
  const kolejnyNumer = partie && partie.length > 0 
    ? Math.max(...partie.map(p => p.numer_partii)) + 1 
    : 1

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Nagłówek */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/turniej"
            className="inline-flex items-center text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do turniejów
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Partie turnieju</h1>
            <p className="text-slate-400 mt-1">
              {turniej?.nazwa} • {partieZGraczami.length} partii
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Link
            href={`/admin/turniej/${turniejId}/partie/nowa`}
            className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nowa partia
          </Link>
        </div>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Łącznie partii</p>
              <p className="text-2xl font-bold text-white">{partieZGraczami.length}</p>
            </div>
            <Users className="h-8 w-8 text-slate-400" />
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Następna partia</p>
              <p className="text-2xl font-bold text-white">#{kolejnyNumer}</p>
            </div>
            <Plus className="h-8 w-8 text-slate-400" />
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Średnio graczy</p>
              <p className="text-2xl font-bold text-white">
                {partieZGraczami.length > 0 
                  ? Math.round(partieZGraczami.reduce((acc, p) => acc + p.liczba_graczy, 0) / partieZGraczami.length * 10) / 10 
                  : 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-slate-400" />
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Ostatnia partia</p>
              <p className="text-sm font-bold text-white">
                {partieZGraczami.length > 0 
                  ? new Date(partieZGraczami[partieZGraczami.length - 1].data_rozgrywki).toLocaleDateString('pl-PL')
                  : 'Brak'}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Lista partii */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            Lista partii - {turniej?.nazwa}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Partie przypisane do tego turnieju
          </p>
        </div>

        {partieZGraczami.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Brak partii w tym turnieju</h3>
            <p className="text-slate-400 mb-6">Stwórz pierwszą partię dla tego turnieju</p>
            <Link
              href={`/admin/turniej/${turniejId}/partie/nowa`}
              className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Stwórz pierwszą partię
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {partieZGraczami.map((partia) => (
              <PartiaCard 
                key={partia.id} 
                partia={partia} 
                turniejId={turniejId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Komponent karty partii
function PartiaCard({ partia, turniejId }: { partia: Partia, turniejId: string }) {
  const zwyciezca = partia.gracze.find(g => g.id === partia.duzy_punkt_gracz_id)
  
  return (
    <div className="p-6 hover:bg-slate-700/30 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="bg-slate-700 rounded-lg px-3 py-1">
            <span className="text-white font-semibold">#{partia.numer_partii}</span>
          </div>
          <div className="text-slate-400 text-sm">
            <Calendar className="h-4 w-4 inline mr-1" />
            {new Date(partia.data_rozgrywki).toLocaleDateString('pl-PL')}
          </div>
          <div className="text-slate-400 text-sm">
            <Users className="h-4 w-4 inline mr-1" />
            {partia.liczba_graczy} graczy
          </div>
        </div>
        
        <Link
          href={`/admin/turniej/${turniejId}/partie/${partia.id}`}
          className="text-slate-400 hover:text-white flex items-center"
        >
          <Eye className="h-4 w-4 mr-1" />
          Szczegóły
        </Link>
      </div>

      {/* Gracze */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {partia.gracze.map((gracz) => (
          <div 
            key={gracz.id}
            className={`p-4 rounded-lg border ${
              gracz.id === partia.duzy_punkt_gracz_id
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-slate-700/30 border-slate-600'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-white">
                  {gracz.imie} {gracz.nazwisko}
                  {gracz.id === partia.duzy_punkt_gracz_id && (
                    <Trophy className="h-4 w-4 text-yellow-500 inline ml-2" />
                  )}
                </h4>
                <p className="text-slate-400 text-sm">
                  Małe punkty: {gracz.male_punkty}
                </p>
              </div>
              
              <div className={`flex items-center space-x-1 ${
                gracz.zmiana_elo > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {gracz.zmiana_elo > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {gracz.zmiana_elo > 0 ? '+' : ''}{Math.round(gracz.zmiana_elo)}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">
                ELO: {Math.round(gracz.elo_przed)} → {Math.round(gracz.elo_po)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}