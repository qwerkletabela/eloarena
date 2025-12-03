import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  let identifier = String(formData.get('identifier') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')

  const origin = req.nextUrl.origin

  // 1) Sprawdź czy to email czy username
  if (!identifier.includes('@')) {
    // To jest username - znajdź email
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .single()

      if (error || !data?.email) {
        return NextResponse.redirect(
          new URL('/auth/signin?e=notfound', origin), 
          { status: 303 }
        )
      }
      identifier = data.email.toLowerCase()
    } catch (error) {
      console.error('Błąd konwersji username:', error)
      return NextResponse.redirect(
        new URL('/auth/signin?e=notfound', origin), 
        { status: 303 }
      )
    }
  }

  // 2) Logowanie
  try {
    const supabase = await createSupabaseServer()
    const { error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    })

    if (error) {
      console.error('Błąd logowania:', error)
      return NextResponse.redirect(
        new URL('/auth/signin?e=invalid', origin), 
        { status: 303 }
      )
    }

    // 3) Sukces
    return NextResponse.redirect(new URL('/', origin), { status: 303 })

  } catch (error) {
    console.error('Błąd serwera:', error)
    return NextResponse.redirect(
      new URL('/auth/signin?e=invalid', origin), 
      { status: 303 }
    )
  }
}