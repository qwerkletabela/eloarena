import './globals.css'
import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import './globals.css'



// ważne: wyłącz cache dla layoutu
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'elo-arena',
  description: 'Next.js + Supabase'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let role: 'admin' | 'user' | null = null
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    role = (profile?.role as 'admin'|'user') ?? 'user'
  }

  return (
    <html lang="pl">
      <body className="min-h-dvh antialiased">
        <Navbar user={user ? { id: user.id, email: user.email } : null} role={role} />
        {children}
      </body>
    </html>
  )
}
