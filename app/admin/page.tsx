import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const supabase = await createSupabaseServer()

  // kto jest zalogowany?
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // sprawdzenie roli admin
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    redirect('/')
  }

  // proste statystyki (bez pobierania całych rekordów)
  const [turnieje, gracze, uzytkownicy] = await Promise.all([
    supabase.from('turniej').select('id', { count: 'exact', head: true }),
    supabase.from('gracz').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  const cntTurnieje = turnieje.count ?? 0
  const cntGracze = gracze.count ?? 0
  const cntUsers = uzytkownicy.count ?? 0

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-sky-50">Panel administratora</h1>
              <p className="text-sm text-sky-200/80">
                Zarządzanie użytkownikami, turniejami i danymi.
              </p>
            </div>
            <div className="rounded-full border border-slate-600 bg-slate-900/80 px-4 py-1.5 text-xs text-sky-200">
              <span className="opacity-70">Zalogowano jako:</span>{' '}
              <span className="font-medium">{user.email ?? '—'}</span>{' '}
              <span className="ml-2 rounded-full bg-red-600/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                admin
              </span>
            </div>
          </header>

          {/* statystyki */}
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Turnieje</div>
              <div className="mt-1 text-2xl font-semibold text-sky-100">{cntTurnieje}</div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Gracze</div>
              <div className="mt-1 text-2xl font-semibold text-sky-100">{cntGracze}</div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Użytkownicy</div>
              <div className="mt-1 text-2xl font-semibold text-sky-100">{cntUsers}</div>
            </div>
          </section>

          {/* kafelki na akcje */}
          <section className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/admin/users"
              className="group rounded-xl border border-slate-700 bg-slate-900/80 p-4 transition hover:border-sky-400/70 hover:bg-slate-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-sky-100">
                  Zarządzaj użytkownikami
                </h2>
                <span className="text-xs text-sky-300 group-hover:translate-x-0.5 transition-transform">
                  → {/* strzałka */}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Podgląd kont, zmiana ról (user/admin).
              </p>
            </Link>

            <Link
              href="/admin/turniej"
              className="group rounded-xl border border-slate-700 bg-slate-900/80 p-4 transition hover:border-sky-400/70 hover:bg-slate-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-sky-100">
                  Zarządzaj turniejami
                </h2>
                <span className="text-xs text-sky-300 group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Lista turniejów, edycja danych, import z arkusza, mapa, usuwanie.
              </p>
            </Link>

            <Link
              href="/turniej/new"
              className="group rounded-xl border border-sky-700 bg-sky-900/70 p-4 transition hover:border-sky-400 hover:bg-sky-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-sky-50">
                  Dodaj nowy turniej
                </h2>
                <span className="text-xs text-sky-100 group-hover:translate-x-0.5 transition-transform">
                  +
                </span>
              </div>
              <p className="text-xs text-sky-100/80">
                Utwórz nowy turniej, ustaw datę, godziny, limit graczy, arkusz i lokalizację.
              </p>
            </Link>

            <Link
              href="/admin/miejsca/new"
              className="group rounded-xl border border-slate-700 bg-slate-900/80 p-4 transition hover:border-sky-400/70 hover:bg-slate-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-sky-100">
                  Zarządzaj miejscem turnieju.
                </h2>
                <span className="text-xs text-sky-300 group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Przegląd i zarządzanie tabelą miejscem turnieju.
              </p>
            </Link>
          </section>
        </div>
      </main>
    {/* DODANE: Zamknięcie kontenera z tłem */}
    </div>
  )
}