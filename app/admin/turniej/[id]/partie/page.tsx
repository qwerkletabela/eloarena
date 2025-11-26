import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus,
  Edit3,
  Trash2,
  Users,
  Trophy,
  Calendar,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { recalculateAllElo } from '@/lib/eloCalculator'

export default async function PartieTurniejuPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const { data: turniej } = await supabase
    .from('turniej')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!turniej) {
    redirect('/admin/turniej')
  }

  const { data: partie } = await supabase
    .from('wyniki_partii')
    .select(`
      *,
      gracz1:gracz1_id(*),
      gracz2:gracz2_id(*),
      gracz3:gracz3_id(*),
      gracz4:gracz4_id(*),
      zwyciezca:duzy_punkt_gracz_id(*)
    `)
    .eq('turniej_id', params.id)
    .order('numer_partii', { ascending: true })

  const { data: gracze } = await supabase
    .from('gracz')
    .select('*')
    .eq('turniej_id', params.id)
    .order('aktualny_elo', { ascending: false })

  async function usunPartie(partiaId: string) {
    'use server'
    const supabase = await createSupabaseServer()
    
    // Najpierw cofnij zmiany Elo - pobierz aktualne dane graczy przed usunięciem
    const { data: partia } = await supabase
      .from('wyniki_partii')
      .select('*')
      .eq('id', partiaId)
      .single()

    if (partia) {
      // Dla każdego gracza w partii
      for (let i = 1; i <= partia.liczba_graczy; i++) {
        const graczId = partia[`gracz${i}_id`];
        if (graczId) {
          // Pobierz aktualne dane gracza
          const { data: gracz } = await supabase
            .from('gracz')
            .select('*')
            .eq('id', graczId)
            .single()

          if (gracz) {
            const malePunkty = partia[`male_punkty${i}`] || 0;
            const duzyPunkt = partia.duzy_punkt_gracz_id === graczId ? 1 : 0;

            // Przywróć poprzednie Elo i zmniejsz liczniki
            await supabase
              .from('gracz')
              .update({ 
                aktualny_elo: partia[`elo_przed${i}`],
                liczba_partii: Math.max(0, gracz.liczba_partii - 1),
                suma_malych_punktow: Math.max(0, gracz.suma_malych_punktow - malePunkty),
                liczba_duzych_punktow: Math.max(0, gracz.liczba_duzych_punktow - duzyPunkt),
                ostatnia_aktualizacja: new Date().toISOString()
              })
              .eq('id', graczId)
          }
        }
      }
    }
    
    // Usuń partię
    await supabase.from('wyniki_partii').delete().eq('id', partiaId)
    redirect(`/admin/turniej/${params.id}/partie`)
  }

  async function przeliczElo() {
    'use server'
    const supabase = await createSupabaseServer()
    await recalculateAllElo(supabase, params.id)
    redirect(`/admin/turniej/${params.id}/partie?recalculated=true`)
  }

  return (
    <div className="p-8">
      {/* Nagłówek */}
      <div className="mb-6">
        <Link
          href="/admin/turniej"
          className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Powrót do listy turniejów
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Partie turnieju</h1>
            <p className="text-slate-400">{turniej.nazwa}</p>
            <p className="text-sm text-slate-500">
              Data: {new Date(turniej.data_turnieju).toLocaleDateString('pl-PL')}
            </p>
          </div>
          <div className="flex space-x-3">
            <form action={przeliczElo}>
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center text-sm"
                onClick={(e) => {
                  if (!confirm('Czy na pewno chcesz przeliczyć cały ranking Elo od początku? Ta operacja może chwilę potrwać.')) {
                    e.preventDefault()
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Przelicz Elo
              </button>
            </form>
            <Link
              href={`/admin/turniej/${params.id}/partie/nowa`}
              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nowa partia
            </Link>
            <Link
              href={`/admin/turniej/${params.id}/ranking`}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center text-sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Ranking
            </Link>
          </div>
        </div>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Partii</div>
          <div className="text-2xl font-bold text-white">{partie?.length || 0}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Graczy</div>
          <div className="text-2xl font-bold text-white">{gracze?.length || 0}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Średni ranking</div>
          <div className="text-2xl font-bold text-white">
            {gracze && gracze.length > 0 
              ? Math.round(gracze.reduce((acc, g) => acc + (g.aktualny_elo || 1200), 0) / gracze.length)
              : '1200'}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Najwyższy ranking</div>
          <div className="text-2xl font-bold text-white">
            {gracze && gracze.length > 0 ? Math.round(gracze[0].aktualny_elo) : '1200'}
          </div>
        </div>
      </div>

      {/* Lista partii */}
      <div className="space-y-6">
        {partie?.map((partia) => (
          <div key={partia.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Partia #{partia.numer_partii}</h3>
                <p className="text-slate-400 text-sm">
                  Rozegrana: {new Date(partia.data_rozgrywki).toLocaleString('pl-PL')} • 
                  {partia.liczba_graczy} graczy
                </p>
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/admin/turniej/${params.id}/partie/${partia.id}/edytuj`}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                >
                  <Edit3 className="h-4 w-4" />
                </Link>
                <form action={usunPartie.bind(null, partia.id)}>
                  <button 
                    type="submit"
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                    onClick={(e) => {
                      if (!confirm('Czy na pewno chcesz usunąć tę partię? Spowoduje to cofnięcie zmian rankingu Elo.')) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
            
            {/* Gracze w partii */}
            <div className="grid gap-3">
              {[
                { id: 1, gracz: partia.gracz1, miejsce: partia.miejsce1, male_punkty: partia.male_punkty1, elo_przed: partia.elo_przed1, elo_po: partia.elo_po1, zmiana_elo: partia.zmiana_elo1 },
                { id: 2, gracz: partia.gracz2, miejsce: partia.miejsce2, male_punkty: partia.male_punkty2, elo_przed: partia.elo_przed2, elo_po: partia.elo_po2, zmiana_elo: partia.zmiana_elo2 },
                { id: 3, gracz: partia.gracz3, miejsce: partia.miejsce3, male_punkty: partia.male_punkty3, elo_przed: partia.elo_przed3, elo_po: partia.elo_po3, zmiana_elo: partia.zmiana_elo3 },
                { id: 4, gracz: partia.gracz4, miejsce: partia.miejsce4, male_punkty: partia.male_punkty4, elo_przed: partia.elo_przed4, elo_po: partia.elo_po4, zmiana_elo: partia.zmiana_elo4 }
              ]
              .filter(item => item.gracz)
              .sort((a, b) => a.miejsce - b.miejsce)
              .map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    partia.duzy_punkt_gracz_id === item.gracz.id 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      item.miejsce === 1 ? 'bg-yellow-500 text-yellow-900' :
                      item.miejsce === 2 ? 'bg-gray-400 text-gray-900' :
                      item.miejsce === 3 ? 'bg-orange-700 text-orange-100' :
                      'bg-slate-600 text-slate-300'
                    }`}>
                      {item.miejsce}
                    </span>
                    <span className="text-white font-medium">
                      {item.gracz.imie} {item.gracz.nazwisko}
                    </span>
                    {partia.duzy_punkt_gracz_id === item.gracz.id && (
                      <Trophy className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-slate-400">
                      Punkty: <span className="text-white font-medium">{item.male_punkty}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Elo: {Math.round(item.elo_przed)} → {Math.round(item.elo_po)} 
                      <span className={`ml-1 ${item.zmiana_elo > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ({item.zmiana_elo > 0 ? '+' : ''}{Math.round(item.zmiana_elo)})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {(!partie || partie.length === 0) && (
          <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
            <Users className="h-16 w-16 mx-auto mb-4 text-slate-500" />
            <h3 className="text-lg font-semibold text-white mb-2">Brak partii</h3>
            <p className="text-slate-400 mb-4">Dodaj pierwszą partię, aby rozpocząć turniej</p>
            <Link
              href={`/admin/turniej/${params.id}/partie/nowa`}
              className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-lg inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Dodaj pierwszą partię
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}