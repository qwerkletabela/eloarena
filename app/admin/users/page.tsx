// app/admin/users/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type ProfileRow = {
  id: string
  username: string | null
  email: string | null
  role: 'user' | 'organizer' | 'admin' | null
  created_at: string | null
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const ok = sp.ok === '1'
  const err = typeof sp.e === 'string' ? sp.e : undefined

  const supabase = await createSupabaseServer()

  // kto jest zalogowany?
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // czy admin?
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    redirect('/')
  }

  // pobranie profili
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, email, role, created_at')
    .order('created_at', { ascending: false })
    .returns<ProfileRow[]>()

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      {/* KARTA – nowy brand jak layout/signup/turnieje */}
      <div className="w-full max-w-4xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-5">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-sky-50">
              Użytkownicy – role
            </h1>
            <p className="text-sm text-sky-200/80">
              Zmieniaj role: <span className="font-semibold">user</span>,{' '}
              <span className="font-semibold">organizer</span>,{' '}
              <span className="font-semibold">admin</span>.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-xs text-sky-200 hover:text-sky-100 underline-offset-2 hover:underline"
          >
            ← Powrót do panelu
          </Link>
        </header>

        {/* komunikaty */}
        {ok && (
          <div className="rounded-md border border-emerald-500/70 bg-emerald-900/40 px-3 py-2 text-xs text-emerald-100">
            Zapisano zmianę roli.
          </div>
        )}
        {err && (
          <div className="rounded-md border border-red-500/70 bg-red-900/40 px-3 py-2 text-xs text-red-100">
            {err === 'invalid_id' && 'Nieprawidłowe ID użytkownika.'}
            {err === 'invalid_role' && 'Nieprawidłowa rola.'}
            {err === 'cannot_downgrade_self' && 'Nie możesz odebrać sobie roli admin.'}
            {err === 'update_failed' && 'Nie udało się zaktualizować roli.'}
            {!['invalid_id','invalid_role','cannot_downgrade_self','update_failed'].includes(err) &&
              'Wystąpił błąd.'}
          </div>
        )}

        {/* tabela użytkowników */}
        <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/80">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-900/90">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-200">ID</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-200">Email</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-200">Login</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-200">Rola</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-200">Zmień rolę</th>
              </tr>
            </thead>
            <tbody>
              {profiles?.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-slate-700/70 last:border-b last:border-slate-700/70"
                >
                  <td className="px-3 py-2 align-middle text-[11px] text-slate-300 max-w-[160px] truncate">
                    {p.id}
                  </td>
                  <td className="px-3 py-2 align-middle text-xs text-sky-100 truncate max-w-[200px]">
                    {p.email ?? '—'}
                  </td>
                  <td className="px-3 py-2 align-middle text-xs text-slate-200">
                    {p.username ?? <span className="opacity-60">brak</span>}
                  </td>
                  <td className="px-3 py-2 align-middle text-xs">
                    <span
                      className={[
                        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                        p.role === 'admin'
                          ? 'bg-red-600/80 text-white'
                          : p.role === 'organizer'
                          ? 'bg-sky-600/80 text-white'
                          : 'bg-slate-700 text-slate-100',
                      ].join(' ')}
                    >
                      {p.role ?? 'user'}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    {/* formularz zmiany roli */}
                    <form
                      action={`/admin/users/${p.id}/role`}
                      method="post"
                      className="flex items-center gap-2"
                    >
                      <select
                        name="role"
                        defaultValue={p.role ?? 'user'}
                        className="rounded-md border border-slate-600 bg-slate-900/80 px-2 py-1 text-xs text-sky-50 focus:outline-none focus:ring-1 focus:ring-sky-400"
                      >
                        <option value="user">user</option>
                        <option value="organizer">organizer</option>
                        <option value="admin">admin</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-sky-500/90 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-sky-400 transition"
                      >
                        Zapisz
                      </button>
                    </form>
                  </td>
                </tr>
              ))}

              {!profiles?.length && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-xs text-slate-300"
                  >
                    Brak użytkowników.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
