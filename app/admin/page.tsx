import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
  <main className="mx-auto max-w-5xl p-6 space-y-4">
    <h1 className="mb-4 text-2xl font-semibold">Panel admina</h1>
    <div className="flex gap-3">
      <Link href="/admin/users" className="pill pill--primary">Zarządzaj użytkownikami</Link>
      {/* inne kafelki */}
    </div>
  </main>
)
}
