import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Panel admina</h1>
        <p className="mt-1 text-sm text-slate-600">Szybkie akcje i zarządzanie.</p>
      </header>

      {/* Sekcja: Zarządzaj użytkownikami */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Zarządzaj użytkownikami</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/users" className="pill pill--secondary">Lista użytkowników</Link>
        </div>
      </section>

      {/* Sekcja: Turnieje */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Turnieje</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/turniej" className="pill pill--secondary">Lista turniejów</Link>
          <Link href="/turniej/new" className="pill pill--primary">Dodaj turniej</Link>

        </div>
      </section>
      
    </main>
  )
}
