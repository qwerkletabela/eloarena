import { NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

export async function POST(req: Request) {
  const supabase = await createSupabaseServerMutable()
  const { event, session } = await req.json()

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    // ustawia httpOnly cookies dla SSR
    await supabase.auth.setSession(session)
  }
  if (event === 'SIGNED_OUT') {
    await supabase.auth.signOut()
  }

  return NextResponse.json({ ok: true })
}
