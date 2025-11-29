// elo-arena/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServer()

  // Sprawdzenie czy użytkownik jest zalogowany
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // Sprawdzenie roli admin
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex">
        <AdminSidebar user={user} />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}