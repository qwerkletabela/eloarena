// lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function createSupabaseServer() {
  // NEXT 15: cookies() jest async
  const store = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value
        },
        // w RSC nie modyfikujemy cookies
        set(_name: string, _value: string, _options?: CookieOptions) {},
        remove(_name: string, _options?: CookieOptions) {},
      },
    }
  )
}
