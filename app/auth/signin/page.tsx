'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null); setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // po zalogowaniu sprawdź profil
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/signin'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (!profile?.username) router.push('/onboarding')
      else router.push('/')
    } catch (e:any) {
      setErr(e?.message ?? 'Logowanie nieudane.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Logowanie</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border px-3 py-2" type="email" placeholder="Email"
               value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full rounded border px-3 py-2" type="password" placeholder="Hasło"
               value={password} onChange={e=>setPassword(e.target.value)} required />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={loading}>
          {loading ? 'Loguję…' : 'Zaloguj'}
        </button>
      </form>
    </main>
  )
}
