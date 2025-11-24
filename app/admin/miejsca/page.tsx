// app/admin/miejsca/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Row = {
  id: string
  nazwa: string
  miasto: string
  wojewodztwo: string | null
  adres: string | null
  latitude: number
  longitude: number
  created_at: string | null
}

export default async function AdminMiejscaList() {
  const supabase = await createSupabaseServer()

  // wymagane logowanie
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  // wymagany admin (tak jak w innych stronach panelu)
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  // pobierz miejsca
  const { data: rows, error } = await supabase
    .from('miejsce_turnieju')
    .select(
      'id, nazwa, miasto, wojewodztwo, adres, latitude, longitude, created_at'
    )
    .order('miasto', { ascending: true })
    .order('nazwa', { ascending: true })

  if (error) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6">
          <h1 className="text-2xl font-semibold text-sky-50 mb-4">
            Miejsca turniejów - Panel admina
          </h1>
          <div className="rounded-md border border-red-400/50 bg-red-500/10 px-4 py-3 text-red-200">
            Nie udało się pobrać danych miejsc.
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
            <h1 className="text-2xl font-semibold text-sky-50">
              Miejsca turniejów
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Lista wszystkich zdefiniowanych lokalizacji, które możesz podpiąć
              pod turnieje.
            </p>
          </div>
          <Link
            href="/admin/miejsca/new"
            className="rounded-full bg-sky-600 hover:bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Dodaj miejsce
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-600">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">
                  Miasto
                </th>
                <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">
                  Nazwa miejsca
                </th>
                <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">
                  Województwo
                </th>
                <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">
                  Adres
                </th>
                <th className="px-4 py-3 text-left text-sky-100 font-medium text-xs uppercase tracking-wider">
                  Współrzędne
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
              {rows?.map((raw) => {
                const r = raw as Row
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-700/30 transition"
                  >
                    <td className="px-4 py-3 text-sky-100">
                      {r.miasto || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/miejsca/${r.id}/edit`}
                        className="text-sky-100 hover:text-sky-200 font-medium hover:underline"
                      >
                        {r.nazwa}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-200 text-xs">
                      {r.wojewodztwo || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-200 text-xs max-w-xs truncate">
                      {r.adres || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-200 text-xs">
                      {r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-slate-200 text-xs">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString('pl-PL')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/miejsca/${r.id}/edit`}
                        className="inline-flex items-center gap-1 rounded bg-sky-600 hover:bg-sky-500 px-3 py-1 text-xs font-medium text-white transition"
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
                      {/* Tutaj w przyszłości możesz dodać DeleteMiejsce tak jak DeleteTurniej */}
                    </td>
                  </tr>
                )
              })}

              {!rows?.length && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-slate-400 text-sm"
                    colSpan={7}
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
                      <p>Brak zdefiniowanych miejsc turniejów</p>
                      <Link
                        href="/admin/miejsca/new"
                        className="text-sky-400 hover:text-sky-300 text-sm underline"
                      >
                        Dodaj pierwsze miejsce
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {rows && rows.length > 0 && (
          <div className="text-sm text-slate-400 text-center">
            Znaleziono {rows.length} miejsc
            {rows.length === 1
              ? 'e'
              : rows.length > 1 && rows.length < 5
              ? 'a'
              : ''}
          </div>
        )}
      </div>
    </main>
  )
}
