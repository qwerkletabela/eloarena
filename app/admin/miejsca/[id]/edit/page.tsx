// app/admin/miejsca/[id]/edit/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import MiejsceForm from '@/components/MiejsceForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface EditMiejscePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditMiejscePage(props: EditMiejscePageProps) {
  const params = await props.params
  const supabase = await createSupabaseServer()

  // Sprawdź autoryzację
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  // Sprawdź czy params.id istnieje
  if (!params.id) {
    console.error('Brak ID w parametrach')
    redirect('/admin/miejsca')
  }

  // Pobierz istniejące miejsce
  const { data: miejsce, error } = await supabase
    .from('miejsce_turnieju')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !miejsce) {
    console.error('Error fetching miejsce:', error)
    redirect('/admin/miejsca')
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <MiejsceForm mode="edit" initial={miejsce} />
      </div>
    </main>
  )
}