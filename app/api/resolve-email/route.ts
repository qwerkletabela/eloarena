import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const { identifier } = await req.json() as { identifier: string }
  const input = identifier.trim().toLowerCase()

  // jeśli to e-mail, nie ma co rozwiązywać
  if (input.includes('@')) {
    return NextResponse.json({ email: input })
  }

  // login -> email (tylko na serwerze, przez Service Role)
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('username', input)
    .single()

  if (error || !data?.email) {
    return NextResponse.json({ error: 'Nie znaleziono użytkownika o takim loginie.' }, { status: 404 })
  }

  return NextResponse.json({ email: data.email.toLowerCase() })
}
