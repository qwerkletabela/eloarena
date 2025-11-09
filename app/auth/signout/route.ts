import { NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'

export async function POST() {
  const supabase = await createSupabaseServerMutable(); // <-- DODAJ await
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}
