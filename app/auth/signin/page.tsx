// elo-arena/app/auth/signin/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SignIn() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const sp = useSearchParams()
  const err = useMemo(() => {
    const e = sp.get('e')
    if (e === 'notfound') return 'Nie znaleziono użytkownika o takim loginie.'
    if (e === 'invalid') return 'Nieprawidłowy email/login lub hasło.'
    return null
  }, [sp])

  // (opcjonalnie) zresetuj query po 1 renderze, żeby adres był czysty
  useEffect(() => { history.replaceState(null, '', '/auth/signin') }, [])

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Logowanie</h1>
      <form action="/auth/login" method="post" className="space-y-3">
        <input
          className="w-full rounded border px-3 py-2"
          name="identifier"
          placeholder="Email lub login"
          value={identifier}
          onChange={e=>setIdentifier(e.target.value)}
          required
        />
        <input
          className="w-full rounded border px-3 py-2"
          type="password"
          name="password"
          placeholder="Hasło"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          required
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="rounded bg-black px-4 py-2 text-white">Zaloguj</button>
      </form>
    </main>
  )
}
