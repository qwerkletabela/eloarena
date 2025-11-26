import { createSupabaseServer } from '@/lib/supabase/server'
import { 
  Users, 
  Trophy, 
  UserPlus, 
  BarChart3,
  Calendar,
  MapPin,
  Settings
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const supabase = await createSupabaseServer()

  // Pobieranie statystyk
  const [turnieje, gracze, uzytkownicy, ostatnieTurnieje] = await Promise.all([
    supabase.from('turniej').select('id', { count: 'exact', head: true }),
    supabase.from('gracz').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('turniej')
      .select('nazwa, data')
      .order('data', { ascending: false })
      .limit(3)
  ])

  const cntTurnieje = turnieje.count ?? 0
  const cntGracze = gracze.count ?? 0
  const cntUsers = uzytkownicy.count ?? 0

  return (
    <main className="p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Witaj w panelu administratora
        </h1>
        <p className="text-slate-400">
          Zarządzaj użytkownikami, turniejami i ustawieniami systemu
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-slate-800/50 p-6 border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-500/20 p-3">
              <Trophy className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Turnieje</p>
              <p className="text-2xl font-bold text-white">{cntTurnieje}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800/50 p-6 border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-500/20 p-3">
              <Users className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Gracze</p>
              <p className="text-2xl font-bold text-white">{cntGracze}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800/50 p-6 border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-purple-500/20 p-3">
              <UserPlus className="h-6 w-6 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Użytkownicy</p>
              <p className="text-2xl font-bold text-white">{cntUsers}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800/50 p-6 border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-orange-500/20 p-3">
              <BarChart3 className="h-6 w-6 text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Aktywność</p>
              <p className="text-2xl font-bold text-white">24h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-6">Szybkie akcje</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/admin/users"
              className="group relative rounded-2xl bg-slate-800/50 p-6 border border-slate-700 backdrop-blur-sm transition-all hover:border-sky-400 hover:bg-slate-800 hover:transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="rounded-lg bg-blue-500/20 p-3 inline-block">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    Zarządzaj użytkownikami
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Przeglądaj konta, zmieniaj role i uprawnienia
                  </p>
                </div>
                <div className="text-sky-400 transition-transform group-hover:translate-x-1">
                  →
                </div>
              </div>
            </Link>

            <Link
              href="/admin/turniej"
              className="group relative rounded-2xl bg-slate-800/50 p-6 border border-slate-700 backdrop-blur-sm transition-all hover:border-green-400 hover:bg-slate-800 hover:transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="rounded-lg bg-green-500/20 p-3 inline-block">
                    <Trophy className="h-6 w-6 text-green-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    Zarządzaj turniejami
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Edytuj turnieje, importuj dane, zarządzaj uczestnikami
                  </p>
                </div>
                <div className="text-green-400 transition-transform group-hover:translate-x-1">
                  →
                </div>
              </div>
            </Link>

            <Link
              href="/turniej/new"
              className="group relative rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 p-6 border border-sky-500 backdrop-blur-sm transition-all hover:transform hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="rounded-lg bg-white/20 p-3 inline-block">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    Nowy turniej
                  </h3>
                  <p className="mt-2 text-sm text-sky-100">
                    Utwórz nowy turniej z pełną konfiguracją
                  </p>
                </div>
                <div className="text-white transition-transform group-hover:translate-x-1">
                  +
                </div>
              </div>
            </Link>

            <Link
              href="/admin/miejsca"
              className="group relative rounded-2xl bg-slate-800/50 p-6 border border-slate-700 backdrop-blur-sm transition-all hover:border-orange-400 hover:bg-slate-800 hover:transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="rounded-lg bg-orange-500/20 p-3 inline-block">
                    <MapPin className="h-6 w-6 text-orange-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    Miejsca turniejów
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Zarządzaj lokalizacjami i mapą turniejów
                  </p>
                </div>
                <div className="text-orange-400 transition-transform group-hover:translate-x-1">
                  →
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Sidebar - Ostatnie turnieje i dodatkowe opcje */}
        <div className="space-y-6">
          {/* Ostatnie turnieje */}
          <div className="rounded-2xl bg-slate-800/50 p-6 border border-slate-700 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">
              Ostatnie turnieje
            </h3>
            <div className="space-y-3">
              {ostatnieTurnieje.data?.map((turniej, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {turniej.nazwa}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(turniej.data).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                </div>
              ))}
              {(!ostatnieTurnieje.data || ostatnieTurnieje.data.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-4">
                  Brak turniejów
                </p>
              )}
            </div>
          </div>

          {/* Dodatkowe narzędzia */}
          <div className="rounded-2xl bg-slate-800/50 p-6 border border-slate-700 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">
              Narzędzia systemowe
            </h3>
            <div className="space-y-3">
              <Link
                href="/admin/backup"
                className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-white">Kopia zapasowa</span>
              </Link>
              <Link
                href="/admin/logs"
                className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
              >
                <BarChart3 className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-white">Logi systemowe</span>
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-white">Ustawienia</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}