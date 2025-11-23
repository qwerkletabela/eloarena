// app/page.tsx
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const supabase = await createSupabaseServer()
  
  // Pobierz najbliższe turnieje
  const { data: upcomingTournaments } = await supabase
    .from('turniej')
    .select('id, nazwa, data_turnieju, godzina_turnieju, limit_graczy')
    .gte('data_turnieju', new Date().toISOString().split('T')[0])
    .order('data_turnieju', { ascending: true })
    .limit(3)

  // Pobierz statystyki
  const [
    { count: tournamentsCount },
    { count: playersCount },
    { count: usersCount }
  ] = await Promise.all([
    supabase.from('turniej').select('*', { count: 'exact', head: true }),
    supabase.from('gracz').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
  ])

  return (
    <main className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl text-center space-y-8">
          {/* Nagłówek */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-sky-50">
              Witaj w <span className="text-sky-400">ELO Arena</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
              Platforma do organizacji i śledzenia turniejów rankingowych
            </p>
          </div>

          {/* Statystyki */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-6 text-center">
              <div className="text-3xl font-bold text-sky-400">{tournamentsCount || 0}</div>
              <div className="text-sm text-slate-400 mt-2">Turniejów</div>
            </div>
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-6 text-center">
              <div className="text-3xl font-bold text-sky-400">{playersCount || 0}</div>
              <div className="text-sm text-slate-400 mt-2">Graczy</div>
            </div>
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-6 text-center">
              <div className="text-3xl font-bold text-sky-400">{usersCount || 0}</div>
              <div className="text-sm text-slate-400 mt-2">Użytkowników</div>
            </div>
          </div>

          {/* Przyciski akcji */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link
              href="/turniej"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 px-8 py-4 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.9)] transition hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_14px_35px_rgba(15,23,42,1)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
              </svg>
              Przeglądaj turnieje
            </Link>
            
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-500 bg-slate-800/80 px-8 py-4 text-lg font-semibold text-sky-100 hover:bg-slate-700 hover:border-sky-400 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.5 12H3"/>
              </svg>
              Zaloguj się
            </Link>
          </div>
        </div>
      </section>

      {/* Nadchodzące turnieje */}
      {upcomingTournaments && upcomingTournaments.length > 0 && (
        <section className="px-4 py-12">
          <div className="w-full max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-sky-50 text-center mb-8">
              Nadchodzące turnieje
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  href={`/turniej`}
                  className="group rounded-2xl bg-slate-800/80 border border-slate-700 p-6 hover:border-sky-400/70 hover:bg-slate-800 transition-all duration-300"
                >
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-sky-100 group-hover:text-sky-50">
                      {tournament.nazwa}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>
                          {new Date(tournament.data_turnieju!).toLocaleDateString('pl-PL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      {tournament.godzina_turnieju && (
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <span>Godzina: {tournament.godzina_turnieju.slice(0, 5)}</span>
                        </div>
                      )}
                      
                      {tournament.limit_graczy && (
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                          </svg>
                          <span>Limit: {tournament.limit_graczy} graczy</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1 text-sky-400 text-sm font-medium group-hover:gap-2 transition-all">
                        Zobacz szczegóły
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link
                href="/turniej"
                className="inline-flex items-center gap-2 rounded-full border border-slate-500 bg-slate-800/80 px-6 py-3 text-sm font-semibold text-sky-100 hover:bg-slate-700 hover:border-sky-400 transition"
              >
                Zobacz wszystkie turnieje
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="px-4 py-12">
        <div className="w-full max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-sky-50 text-center mb-12">
            Dlaczego ELO Arena?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-400/30">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-sky-100">Ranking ELO</h3>
              <p className="text-slate-300">
                Śledź swoje postępy w rankingach ELO i rywalizuj z innymi graczami
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-sky-100">Łatwa organizacja</h3>
              <p className="text-slate-300">
                Twórz i zarządzaj turniejami w prosty i intuicyjny sposób
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-sky-100">Statystyki</h3>
              <p className="text-slate-300">
                Analizuj swoje wyniki i porównuj się z innymi zawodnikami
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}