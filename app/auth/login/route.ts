// elo-arena/app/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  let identifier = String(form.get('identifier') || '').trim().toLowerCase()
  const password = String(form.get('password') || '')

  // Zawsze bierz origin z requestu (działa na localhost i na Vercel)
  const origin = req.nextUrl.origin

  // 1) username -> email (jeśli trzeba)
  if (!identifier.includes('@')) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .single()

    if (error || !data?.email) {
      return NextResponse.redirect(new URL('/auth/signin?e=notfound', origin), { status: 303 })
    }
    identifier = data.email.toLowerCase()
  }

  // 2) Logowanie
  const supabase = await createSupabaseServerMutable()
  const { error } = await supabase.auth.signInWithPassword({
    email: identifier,
    password,
  })

  if (error) {
    return NextResponse.redirect(new URL('/auth/signin?e=invalid', origin), { status: 303 })
  }

  // 3) Sukces
  return NextResponse.redirect(new URL('/', origin), { status: 303 })
}
