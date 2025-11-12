// app/admin/turniej/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminTurniejList() {
  const supabase = await createSupabaseServer()

  // wymagane logowanie
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  // wymagany admin
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  // lista turniejów (dowolne pola z Twojej tabeli)
  const { data: rows, error } = await supabase
    .from('turniej')
    .select('id, nazwa, data_turnieju, godzina_turnieju, limit_graczy, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Turnieje (admin)</h1>
        <p className="text-sm text-red-700">Nie udało się pobrać danych.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Turnieje (admin)</h1>
        <Link href="/turniej/new" className="pill pill--primary">Dodaj turniej</Link>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-red-50">
            <tr className="border-b">
              <th className="px-3 py-2 text-left">Nazwa</th>
              <th className="px-3 py-2 text-left">Data</th>
              <th className="px-3 py-2 text-left">Limit</th>
              <th className="px-3 py-2 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <Link href={`/admin/turniej/${r.id}/edit`} className="underline">
                    {r.nazwa}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  {r.data_turnieju ?? '—'}{r.godzina_turnieju ? ` • ${r.godzina_turnieju}` : ''}
                </td>
                <td className="px-3 py-2">{r.limit_graczy ?? '—'}</td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/turniej/${r.id}/edit`} className="pill pill--secondary">
                    Edytuj
                  </Link>
                </td>
              </tr>
            ))}
            {!rows?.length && (
              <tr>
                <td className="px-3 py-6 text-sm opacity-60" colSpan={4}>
                  Brak rekordów.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
