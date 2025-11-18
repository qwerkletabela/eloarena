import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerMutable } from '@/lib/supabase/server-mutable'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin
  const form = await req.formData()
  let identifier = String(form.get('identifier') || '').trim().toLowerCase()
  const password = String(form.get('password') || '')

  if (identifier && !identifier.includes('@')) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .maybeSingle()

    if (error || !data?.email) {
      return NextResponse.redirect(new URL('/auth/signin?e=notfound', origin), { status: 303 })
    }
    identifier = data.email.toLowerCase()
  }

  const supabase = await createSupabaseServerMutable()
  const { error } = await supabase.auth.signInWithPassword({ email: identifier, password })

  if (error) {
    return NextResponse.redirect(new URL('/auth/signin?e=invalid', origin), { status: 303 })
  }

  return NextResponse.redirect(new URL('/', origin), { status: 303 })
}
