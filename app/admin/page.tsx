import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Panel admina</h1>
      <p>Tu wrzucisz widoki tylko dla admina.</p>
    </main>
  )
}
