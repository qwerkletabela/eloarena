import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface PartiaDetailPageProps {
  params: Promise<{
    id: string
    partiaId: string
  }>
}

export default async function PartiaDetailPage({ params }: PartiaDetailPageProps) {
  // Oczekujemy na params
  const { id: turniejId, partiaId } = await params;
  const supabase = await createSupabaseServer()

  // Pobierz dane partii - UPEWNIJ SIĘ ŻE FILTRUJEMY PO TURNIEJU!
  const { data: partia, error: partiaError } = await supabase
    .from('wyniki_partii')
    .select(`
      *,
      turniej:turniej_id(id, nazwa)
    `)
    .eq('id', partiaId)
    .eq('turniej_id', turniejId)
    .single()

  if (partiaError || !partia) {
    console.error('Błąd pobierania partii:', partiaError)
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Partia nie znaleziona</h1>
          <p className="text-slate-400 mb-6">
            Partia nie istnieje lub nie należy do tego turnieju
          </p>
          <Link
            href={`/admin/turniej/${turniejId}/partie`}
            className="text-sky-500 hover:text-sky-400"
          >
            Powrót do listy partii
          </Link>
        </div>
      </div>
    )
  }

  // Pobierz dane graczy
  const graczeIds = []
  for (let i = 1; i <= partia.liczba_graczy; i++) {
    const graczId = partia[`gracz${i}_id` as keyof typeof partia]
    if (graczId) graczeIds.push(graczId)
  }

  const { data: gracze } = await supabase
    .from('gracz')
    .select('id, imie, nazwisko')
    .in('id', graczeIds)

  // Przygotuj dane graczy w partii
  const graczeWPartii = []
  for (let i = 1; i <= partia.liczba_graczy; i++) {
    const graczId = partia[`gracz${i}_id` as keyof typeof partia]
    const gracz = gracze?.find(g => g.id === graczId)
    
    if (gracz) {
      graczeWPartii.push({
        id: gracz.id,
        imie: gracz.imie,
        nazwisko: gracz.nazwisko,
        male_punkty: partia[`male_punkty${i}` as keyof typeof partia] as number || 0,
        elo_przed: partia[`elo_przed${i}` as keyof typeof partia] as number || 1200,
        elo_po: partia[`elo_po${i}` as keyof typeof partia] as number || 1200,
        zmiana_elo: partia[`zmiana_elo${i}` as keyof typeof partia] as number || 0
      })
    }
  }

  const zwyciezca = graczeWPartii.find(g => g.id === partia.duzy_punkt_gracz_id)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Nagłówek */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href={`/admin/turniej/${turniejId}/partie`}
            className="inline-flex items-center text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do partii
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Partia #{partia.numer_partii}</h1>
            <p className="text-slate-400 mt-1">
              {partia.turniej?.nazwa}
            </p>
          </div>
        </div>
      </div>

      {/* Informacje o partii */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-700 rounded-lg p-2">
              <Calendar className="h-6 w-6 text-slate-300" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Data rozgrywki</p>
              <p className="text-white font-semibold">
                {new Date(partia.data_rozgrywki).toLocaleDateString('pl-PL')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-slate-700 rounded-lg p-2">
              <Users className="h-6 w-6 text-slate-300" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Liczba graczy</p>
              <p className="text-white font-semibold">{partia.liczba_graczy}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500/20 rounded-lg p-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Zwycięzca</p>
              <p className="text-white font-semibold">
                {zwyciezca ? `${zwyciezca.imie} ${zwyciezca.nazwisko}` : 'Nieznany'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wyniki graczy */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Wyniki graczy</h2>
        </div>
        
        <div className="divide-y divide-slate-700">
          {graczeWPartii
            .sort((a, b) => (b.id === partia.duzy_punkt_gracz_id ? 1 : 0) - (a.id === partia.duzy_punkt_gracz_id ? 1 : 0))
            .map((gracz) => (
              <div key={gracz.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {gracz.id === partia.duzy_punkt_gracz_id && (
                      <div className="bg-yellow-500 rounded-full p-2">
                        <Trophy className="h-5 w-5 text-yellow-900" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {gracz.imie} {gracz.nazwisko}
                        {gracz.id === partia.duzy_punkt_gracz_id && (
                          <span className="ml-2 text-yellow-400 text-sm">🎯 ZWYCIĘZCA</span>
                        )}
                      </h3>
                      <p className="text-slate-400">
                        Małe punkty: <span className="text-white font-medium">{gracz.male_punkty}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-4 mb-2">
                      <div className="text-slate-400">
                        <span className="text-sm">ELO przed:</span>
                        <span className="text-white font-bold ml-2">{Math.round(gracz.elo_przed)}</span>
                      </div>
                      <div className="text-slate-400">
                        <span className="text-sm">ELO po:</span>
                        <span className="text-white font-bold ml-2">{Math.round(gracz.elo_po)}</span>
                      </div>
                    </div>
                    <div className={`flex items-center justify-end space-x-2 text-lg font-bold ${
                      gracz.zmiana_elo > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {gracz.zmiana_elo > 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                      <span>
                        {gracz.zmiana_elo > 0 ? '+' : ''}{Math.round(gracz.zmiana_elo)} punktów
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Podsumowanie zmian */}
      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">Podsumowanie zmian ELO:</h4>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• <strong>Zwycięzca zyskuje punkty ELO</strong> od każdego przegranego</li>
          <li>• <strong>Przegrani tracą punkty ELO</strong> tylko w konfrontacji ze zwycięzcą</li>
          <li>• <strong>Współczynnik K</strong> zależy od aktualnego rankingu i liczby rozegranych partii</li>
          <li>• <strong>Małe punkty</strong> nie wpływają na ELO - służą tylko do statystyk</li>
        </ul>
      </div>
    </div>
  )
}