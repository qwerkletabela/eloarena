// app/organizer/dashboard/page.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, MapPin, Calendar, Users } from 'lucide-react'

export default async function OrganizerDashboardPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer' && profile?.role !== 'admin') {
    redirect('/')
  }

  // Pobierz statystyki organizatora
  const [tournamentsResult, locationsResult] = await Promise.all([
    supabase
      .from('turniej')
      .select('*', { count: 'exact' })
      .eq('created_by', user.id),
    
    supabase
      .from('miejsce_turnieju')
      .select('*', { count: 'exact' })
      .eq('created_by', user.id)
  ])

  const tournamentCount = tournamentsResult.count || 0
  const locationCount = locationsResult.count || 0

  return (
    <div className="space-y-6">
      {/* Nagłówek */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Organizatora</h1>
          <p className="text-slate-400">
            Witaj w panelu zarządzania turniejami i miejscami
          </p>
        </div>
        <div className="px-4 py-2 bg-emerald-900/30 border border-emerald-700/50 rounded-lg">
          <span className="text-emerald-300 font-medium">
            {profile?.role === 'admin' ? 'Administrator/Organizer' : 'Organizer'}
          </span>
        </div>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Moje turnieje</p>
              <p className="text-2xl font-bold text-white mt-2">{tournamentCount}</p>
            </div>
            <div className="p-3 bg-emerald-900/30 rounded-lg">
              <Trophy className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Moje miejsca</p>
              <p className="text-2xl font-bold text-white mt-2">{locationCount}</p>
            </div>
            <div className="p-3 bg-blue-900/30 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Nadchodzące</p>
              <p className="text-2xl font-bold text-white mt-2">0</p>
            </div>
            <div className="p-3 bg-purple-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Zakończone</p>
              <p className="text-2xl font-bold text-white mt-2">0</p>
            </div>
            <div className="p-3 bg-rose-900/30 rounded-lg">
              <Users className="h-6 w-6 text-rose-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Szybkie akcje */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Szybkie akcje</h2>
          <div className="space-y-3">
            <a
              href="/turniej/nowy"
              className="flex items-center justify-between p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-lg hover:bg-emerald-900/30 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-900/40 rounded-lg">
                  <Trophy className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Utwórz nowy turniej</p>
                  <p className="text-sm text-slate-400">Dodaj nowy turniej do systemu</p>
                </div>
              </div>
              <span className="text-emerald-400">→</span>
            </a>

            <a
              href="/miejsce/nowe"
              className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg hover:bg-blue-900/30 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-900/40 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Dodaj nowe miejsce</p>
                  <p className="text-sm text-slate-400">Zarejestruj nowe miejsce turniejów</p>
                </div>
              </div>
              <span className="text-blue-400">→</span>
            </a>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Ostatnie turnieje</h2>
          <div className="space-y-3">
            {tournamentsResult.data && tournamentsResult.data.length > 0 ? (
              tournamentsResult.data.slice(0, 3).map((tournament) => (
                <div
                  key={tournament.id}
                  className="p-4 bg-slate-900/30 border border-slate-700 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">{tournament.nazwa}</p>
                      <p className="text-sm text-slate-400">
                        {tournament.data_turnieju 
                          ? new Date(tournament.data_turnieju).toLocaleDateString('pl-PL')
                          : 'Brak daty'
                        }
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300">
                      {tournament.limit_graczy ? `${tournament.limit_graczy} osób` : 'Bez limitu'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-slate-900/30 border border-slate-700 rounded-lg text-center">
                <p className="text-slate-400">Brak utworzonych turniejów</p>
                <a href="/turniej/nowy" className="text-emerald-400 hover:underline text-sm">
                  Utwórz pierwszy turniej
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}