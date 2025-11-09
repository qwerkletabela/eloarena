'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const valid = email.trim().length > 5 && password.length >= 6 && password === confirm

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (!valid) { setErr('Sprawdź pola formularza.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password }) // BEZ meta
      if (error) throw error
      setMsg('Konto utworzone. Sprawdź skrzynkę i potwierdź adres e-mail, a następnie zaloguj się.')
    } catch (e:any) {
      setErr(e?.message ?? 'Nie udało się utworzyć konta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Rejestracja</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border px-3 py-2" type="email" placeholder="Email"
               value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full rounded border px-3 py-2" type="password" placeholder="Hasło (min. 6 znaków)"
               value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required />
        <input className="w-full rounded border px-3 py-2" type="password" placeholder="Powtórz hasło"
               value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={6} required />
        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={!valid || loading}>
          {loading ? 'Tworzę…' : 'Załóż konto'}
        </button>
      </form>
    </main>
  )
}
