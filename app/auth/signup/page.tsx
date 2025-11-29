// elo-arena/app/auth/signup/page.tsx
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

  const valid =
    email.trim().length > 5 &&
    password.length >= 6 &&
    password === confirm

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setMsg(null)

    if (!valid) {
      setErr('Sprawdź pola formularza.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      setMsg(
        'Konto utworzone. Sprawdź skrzynkę i potwierdź adres e-mail, a następnie zaloguj się.'
      )
    } catch (e: any) {
      setErr(e?.message ?? 'Nie udało się utworzyć konta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Dodano ciemne tło gradientowe do całej strony
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        {/* KARTA – prostokąt z zaokrąglonymi rogami, szarym tłem i ciemnym cieniem */}
        <div className="w-full max-w-md rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6">
          <h1 className="mb-4 text-2xl font-semibold text-sky-50 text-center">
            Rejestracja
          </h1>

          <form
            onSubmit={onSubmit}
            className="space-y-3"
            autoComplete="off"
          >
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-sky-50 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              name="signup_email"
              autoComplete="off"
            />

            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-sky-50 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              type="password"
              placeholder="Hasło (min. 6 znaków)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              name="signup_password"
              autoComplete="new-password"
            />

            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-sky-50 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              type="password"
              placeholder="Powtórz hasło"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
              name="signup_password_confirm"
              autoComplete="new-password"
            />

            {err && (
              <p className="text-sm text-red-400">
                {err}
              </p>
            )}
            {msg && (
              <p className="text-sm text-emerald-300">
                {msg}
              </p>
            )}

            <button
              className="mt-2 w-full rounded-full bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.9)] transition hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_14px_35px_rgba(15,23,42,1)] disabled:opacity-50 disabled:hover:shadow-none"
              disabled={!valid || loading}
            >
              {loading ? 'Tworzę…' : 'Załóż konto'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}