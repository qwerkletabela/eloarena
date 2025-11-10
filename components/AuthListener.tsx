'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthListener() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // wyślij event do backendu, aby zsynchronizować cookies SSR
      await fetch('/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, session }),
      })
      // odśwież Server Components po zmianie auth
      router.refresh()
    })
    return () => subscription.unsubscribe()
  }, [router])

  return null
}
