// app/admin/turniej/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import DeleteTurniej from '@/components/DeleteTurniej'
import { Users, Plus, Calendar, Clock, UserCheck, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Row = {
  id: string
  nazwa: string
  data_turnieju: string | null
  godzina_turnieju: string | null
  zakonczenie_turnieju: string | null
  limit_graczy: number | null
  created_at: string | null
}

// łączenie daty + godziny w Date
function joinDateTime(d: string | null, t: string | null): Date | null {
  if (!d) return null
  const hhmm = (t ?? '00:00').slice(0, 5)
  return new Date(`${d}T${hhmm}`)
}

// pierwsza litera wielka
function capitalizeFirst(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// data po polsku, z ładnym formatem
function formatDatePL(d: Date) {
  const formatted = d.toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
  })
  return capitalizeFirst(formatted)
}

// zawsze HH:MM
function formatTimeHHMM(raw: string | null) {
  if (!raw) return '00:00'
  return raw.slice(0, 5)
}

export default async function AdminTurniejList() {
  const supabase = await createSupabaseServer()

  // wymagane logowanie
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  // wymagany admin
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  // lista turniejów
  const { data: rows, error } = await supabase
    .from('turniej')
    .select(
      'id, nazwa, data_turnieju, godzina_turnieju, zakonczenie_turnieju, limit_graczy, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  // Pobierz liczbę partii dla każdego turnieju
  const turniejeZPartiami = await Promise.all(
    rows?.map(async (turniej) => {
      const { count } = await supabase
        .from('wyniki_partii')
        .select('*', { count: 'exact', head: true })
        .eq('turniej_id', turniej.id)

      return {
        ...turniej,
        liczba_partii: count || 0
      }
    }) || []
  )

  if (error) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6">
          <h1 className="text-2xl font-semibold text-sky-50 mb-4">Turnieje - Panel admina</h1>
          <div className="rounded-md border border-red-400/50 bg-red-500/10 px-4 py-3 text-red-200">
            Nie udało się pobrać danych.
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-sky-50">Zarządzanie turniejami</h1>
            <p className="mt-1 text-sm text-slate-400">Lista wszystkich turniejów w systemie</p>
          </div>
          <Link
            href="/turniej/new"
            className="rounded-full bg-sky-600 hover:bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Dodaj turniej
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-600">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">
                  Nazwa turnieju
                </th>
                <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">
                  Termin
                </th>
                <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">
                  Limit graczy
                </th>
                <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">
                  Partie
                </th>
                <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">
                  Utworzono
                </th>
                <th className="px-4 py-3 text-right text-sky-100 font-medium text-xs uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600">
              {turniejeZPartiami?.map((raw) => {
                const r = raw as Row & { liczba_partii: number }
                const start = joinDateTime(r.data_turnieju, r.godzina_turnieju)

                return (
                  <tr key={r.id} className="hover:bg-slate-700/30 transition">
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <Link
                          href={`/admin/turniej/${r.id}/edit`}
                          className="text-sky-100 hover:text-sky-200 font-medium hover:underline block"
                        >
                          {r.nazwa}
                        </Link>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/turniej/${r.id}/partie`}
                            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition"
                          >
                            <Users className="h-3 w-3" />
                            Zarządzaj
                          </Link>
                          <Link
                            href={`/admin/turniej/${r.id}/partie/nowa`}
                            className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition"
                          >
                            <Plus className="h-3 w-3" />
                            Dodaj partię
                          </Link>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {r.data_turnieju ? (
                          <div className="flex items-center gap-2 text-sky-100">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className="text-sm">
                              {start ? formatDatePL(start) : r.data_turnieju}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">—</span>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs">
                          {r.godzina_turnieju && (
                            <div className="flex items-center gap-1 text-slate-300">
                              <Clock className="h-3 w-3" />
                              <span>Start: {formatTimeHHMM(r.godzina_turnieju)}</span>
                            </div>
                          )}
                          
                          {r.zakonczenie_turnieju && (
                            <div className="flex items-center gap-1 text-slate-300">
                              <Clock className="h-3 w-3" />
                              <span>Koniec: {formatTimeHHMM(r.zakonczenie_turnieju)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {r.limit_graczy ? (
                        <div className="flex items-center gap-2 text-sky-100">
                          <UserCheck className="h-4 w-4" />
                          <span className="font-medium">{r.limit_graczy}</span>
                          <span className="text-xs text-slate-400">graczy</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">Bez limitu</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sky-100">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{r.liczba_partii}</span>
                        </div>
                        {r.liczba_partii > 0 && (
                          <Link
                            href={`/admin/turniej/${r.id}/partie`}
                            className="text-xs text-slate-400 hover:text-slate-300 underline"
                          >
                            zobacz
                          </Link>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sky-100 text-sm">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString('pl-PL')
                          : '—'}
                      </div>
                      {r.created_at && (
                        <div className="text-xs text-slate-400">
                          {new Date(r.created_at).toLocaleTimeString('pl-PL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/turniej/${r.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs font-medium text-sky-100 transition border border-slate-600"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edytuj
                        </Link>
                        <DeleteTurniej id={r.id} nazwa={r.nazwa} />
                      </div>
                    </td>
                  </tr>
                )
              })}

              {!turniejeZPartiami?.length && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-slate-400 text-sm"
                    colSpan={6}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-slate-600"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10,9 9,9 8,9" />
                      </svg>
                      <p>Brak turniejów w systemie</p>
                      <Link
                        href="/turniej/new"
                        className="text-sky-400 hover:text-sky-300 text-sm underline"
                      >
                        Dodaj pierwszy turniej
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {turniejeZPartiami && turniejeZPartiami.length > 0 && (
          <div className="flex justify-between items-center text-sm text-slate-400">
            <div>
              Znaleziono {turniejeZPartiami.length} turniej
              {turniejeZPartiami.length === 1
                ? ''
                : turniejeZPartiami.length > 1 && turniejeZPartiami.length < 5
                ? 'e'
                : 'y'}
            </div>
            <div className="text-xs">
              Ostatnie turnieje na górze
            </div>
          </div>
        )}
      </div>
    </main>
  )
}