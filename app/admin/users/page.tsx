import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import Link from 'next/link'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const ok = sp.ok === '1'
  const err = typeof sp.e === 'string' ? sp.e : undefined

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  // twardy guard – tylko admin
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  // pobierz userów (prosto: max 100)
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, username, role, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('profiles list error', error)
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Użytkownicy</h1>
        <Link href="/admin" className="pill pill--secondary">← Panel admina</Link>
      </div>

      {ok && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Zmieniono rolę użytkownika.
        </div>
      )}
      {err && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err === 'invalid_role' ? 'Nieprawidłowa rola.' : 'Nie udało się zmienić roli.'}
        </div>
      )}

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-red-50">
            <tr className="border-b">
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Login</th>
              <th className="px-3 py-2 text-left">Rola</th>
              <th className="px-3 py-2 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.username ?? <span className="opacity-60">—</span>}</td>
                <td className="px-3 py-2">
                  {u.role === 'admin'
                    ? <span className="rounded-full bg-red-600/10 px-2 py-1 text-red-700">admin</span>
                    : <span className="rounded-full bg-slate-500/10 px-2 py-1 text-slate-700">user</span>}
                </td>
                <td className="px-3 py-2 text-right">
                  {u.role === 'admin' ? (
                    <form action={`/admin/users/${u.id}/role`} method="post" className="inline">
                      <input type="hidden" name="role" value="user" />
                      <button className="pill pill--secondary">Usuń admina</button>
                    </form>
                  ) : (
                    <form action={`/admin/users/${u.id}/role`} method="post" className="inline">
                      <input type="hidden" name="role" value="admin" />
                      <button className="pill pill--primary">Nadaj admina</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs opacity-60">
        Pokazano maks. 100 ostatnio utworzonych kont.
      </p>
    </main>
  )
}
