import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email jest wymagany' },
        { status: 400 }
      )
    }

    // Walidacja formatu emaila
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy format email' },
        { status: 400 }
      )
    }

    // Sprawdź czy klucz serwisowy jest ustawiony
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      console.error('Brak klucza serwisowego lub URL Supabase')
      return NextResponse.json(
        { error: 'Konfiguracja serwera niekompletna' },
        { status: 500 }
      )
    }

    // Utwórz klienta z kluczem serwisowym
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Metoda 1: Spróbuj użyć admin API
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      })

      if (error) {
        console.error('Błąd listUsers:', error)
        throw error
      }

      const userExists = data.users?.some(
        user => user.email?.toLowerCase() === email.toLowerCase()
      ) || false

      return NextResponse.json({ exists: userExists })
    } catch (adminError) {
      console.error('Admin API nie działa, używam fallback:', adminError)
      
      // Metoda 2: Fallback - sprawdź przez próbę resetowania hasła
      // (bez klucza serwisowego nie możemy bezpośrednio sprawdzić)
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`
      })

      // Jeśli nie ma błędu lub błąd jest związany z ratelimit, to znaczy że użytkownik może istnieć
      // To jest przybliżona metoda - dokładna wymaga klucza serwisowego
      return NextResponse.json({ 
        exists: !resetError || resetError.message?.includes('rate limit') 
      })
    }

  } catch (error: any) {
    console.error('Błąd w endpointcie check-email:', error)
    return NextResponse.json(
      { error: 'Wewnętrzny błąd serwera' },
      { status: 500 }
    )
  }
}