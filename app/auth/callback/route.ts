import { NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

export async function POST(req: Request) {
  const supabase = await createSupabaseServerMutable()
  const { event, session } = await req.json()

  if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
    // WAŻNE: setSession wymaga access_token + refresh_token
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
  }

  if (event === 'SIGNED_OUT') {
    await supabase.auth.signOut()
  }

  return NextResponse.json({ ok: true })
}
