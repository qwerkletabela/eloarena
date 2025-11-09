'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const valid =
    email.trim().length > 5 &&
    username.trim().length >= 3 &&
    password.length >= 6 &&
    password === confirm

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!valid) { setError('Uzupełnij poprawnie wszystkie pola.'); return }
    setLoading(true)
    try {
      // 1) rejestracja + przekazanie username w metadanych (wykorzysta to trigger)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      })
      if (error) throw error

      // 2) awaryjnie: dopisz username do profiles, gdyby trigger nie ustawił
      if (data.user) {
        const { error: uerr } = await supabase
          .from('profiles')
          .update({ username })
          .eq('id', data.user.id)

        // kolizja loginu (unikalny indeks) → kod Postgresa 23505
        // @ts-ignore (typy błędu mogą nieść code)
        if (uerr && (uerr.code === '23505' || (uerr.message || '').includes('duplicate'))) {
          throw new Error('Ten login jest już zajęty. Wybierz inny.')
        }
        if (uerr) throw uerr
      }

      // sukces
      router.push('/')
    } catch (err: any) {
      setError(err?.message ?? 'Coś poszło nie tak przy rejestracji.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Rejestracja</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded border px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Login (min. 3 znaki)"
          value={username}
          onChange={e=>setUsername(e.target.value.replace(/\s+/g,'').toLowerCase())}
          minLength={3}
          required
        />
        <input
          className="w-full rounded border px-3 py-2"
          type="password"
          placeholder="Hasło (min. 6 znaków)"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          minLength={6}
          required
        />
        <input
          className="w-full rounded border px-3 py-2"
          type="password"
          placeholder="Powtórz hasło"
          value={confirm}
          onChange={e=>setConfirm(e.target.value)}
          minLength={6}
          required
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={!valid || loading}
        >
          {loading ? 'Tworzenie konta…' : 'Załóż konto'}
        </button>
      </form>
    </main>
  )
}
