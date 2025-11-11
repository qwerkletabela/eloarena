import './globals.css'
import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'elo-arena',
  description: 'Next.js + Supabase',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let role: 'admin' | 'user' | null = null

  if (user) {
    // 1) najpewniejsze: rpc('is_admin')
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin')

    if (!rpcError && typeof isAdmin === 'boolean') {
      role = isAdmin ? 'admin' : 'user'
    } else {
      // 2) fallback: czytaj role bezpośrednio z profiles
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profError) {
        console.error('[auth] profiles select error:', profError)
      }
      role = profile?.role === 'admin' ? 'admin' : 'user'
    }
  }

  // Tymczasowy log diagnostyczny – usuń po potwierdzeniu
  console.log('[auth]', { id: user?.id, email: user?.email, role })

  return (
    <html lang="pl">
      <body className="min-h-dvh antialiased">
        <Navbar user={user ? { id: user.id, email: user.email } : null} role={role} />
        {children}
      </body>
    </html>
  )
}
