// app/admin/miejsca/new/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import MiejsceForm from '@/components/MiejsceForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewMiejscePage() {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <MiejsceForm mode="new" initial={null} />
      </div>
    </main>
  )
}