import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsernameForm from './username-form'

export default async function OnboardingPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (profile?.username) redirect('/')

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Ustaw swój login</h1>
      <UsernameForm />
    </main>
  )
}
