// elo-arena/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Role = 'admin' | 'organizer' | string

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServer()

  // ✅ zalogowany?
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // ✅ rola: profiles.role (fallback: users.ranga)
  let role: Role | null = null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role) role = profile.role

  if (!role) {
    const { data: urow } = await supabase
      .from('users')
      .select('ranga')
      .eq('id', user.id)
      .maybeSingle()

    if (urow?.ranga) role = urow.ranga
  }

  // ✅ admin OR organizer
  const allowed = role === 'admin' || role === 'organizer'
  if (!allowed) {
    redirect('/')
  }

  // ✅ UI: AdminSidebar tylko dla admina (żeby organizer nie widział admin menu)
  if (role === 'admin') {
    return (
      <div className="min-h-screen">
        <div className="flex">
          <AdminSidebar user={user} />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    )
  }

  // organizer: bez adminowego sidebara
  return (
    <div className="min-h-screen">
      <div className="flex">
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
