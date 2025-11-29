// elo-arena/app/admin/turniej/[id]/partie/nowa/page.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NowaPartiaForm from '@/components/admin/NowaPartiaForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NowaPartiaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  // Pobranie danych turnieju
  const { data: turniej } = await supabase
    .from('turniej')
    .select('*')
    .eq('id', id)
    .single()

  if (!turniej) {
    redirect('/admin/turniej')
  }

  // Pobranie WSZYSTKICH graczy z tabeli gracz
  const { data: gracze } = await supabase
    .from('gracz')
    .select('*')
    .order('nazwisko')

  // Pobranie kolejnego numeru partii
  const { data: ostatniaPartia } = await supabase
    .from('wyniki_partii')
    .select('numer_partii')
    .eq('turniej_id', id)
    .order('numer_partii', { ascending: false })
    .limit(1)
    .single()

  const kolejnyNumer = (ostatniaPartia?.numer_partii || 0) + 1

  return (
    <NowaPartiaForm 
      turniej={turniej}
      gracze={gracze || []}
      kolejnyNumer={kolejnyNumer}
      turniejId={id}
    />
  )
}