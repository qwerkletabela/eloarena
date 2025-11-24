// app/admin/miejsca/[id]/edit/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import MiejsceForm from '@/components/MiejsceForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = {
  params: { id: string }
}

export default async function EditMiejscePage({ params }: Params) {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const { data: miejsce, error } = await supabase
    .from('miejsce_turnieju')
    .select('id, nazwa, miasto, wojewodztwo, adres, latitude, longitude')
    .eq('id', params.id)
    .single()

  if (error || !miejsce) {
    redirect('/admin/miejsca')
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <MiejsceForm
          mode="edit"
          initial={miejsce as any}
        />
      </div>
    </main>
  )
}
