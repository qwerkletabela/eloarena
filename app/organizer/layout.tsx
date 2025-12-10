// app/organizer/layout.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrganizerSidebar from '@/components/organizer/OrganizerSidebar'

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Pobierz rolę użytkownika
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Sprawdź uprawnienia - tylko organizer i admin
  if (profile?.role !== 'organizer' && profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      <OrganizerSidebar 
        user={{ id: user.id, email: user.email }} 
        role={profile?.role} 
      />
      
      {/* Główna zawartość z marginesem dla sidebaru */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}