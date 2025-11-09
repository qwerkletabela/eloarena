'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const router = useRouter()
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) router.push('/')
    else alert(error.message)
  }
  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Logowanie</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full rounded border px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Hasło" />
        <button className="rounded bg-black px-4 py-2 text-white">Zaloguj</button>
      </form>
    </main>
  )
}
