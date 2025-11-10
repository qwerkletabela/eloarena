import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  let identifier = String(form.get('identifier') || '').trim().toLowerCase()
  const password = String(form.get('password') || '')

  // 1) username -> email (jeśli trzeba)
  if (!identifier.includes('@')) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .single()

    if (error || !data?.email) {
      return NextResponse.redirect(new URL('/auth/signin?e=notfound', req.url))
    }
    identifier = data.email.toLowerCase()
  }

  // 2) Logowanie – cookies ustawi się po stronie serwera
  const supabase = await createSupabaseServerMutable()
  const { error } = await supabase.auth.signInWithPassword({
    email: identifier,
    password,
  })

  if (error) {
    return NextResponse.redirect(new URL('/auth/signin?e=invalid', req.url))
  }

  // 3) Sukces: redirect – SSR od razu widzi sesję
  const site = process.env.NEXT_PUBLIC_SITE_URL
  return NextResponse.redirect(new URL('/', site || req.url))
}
