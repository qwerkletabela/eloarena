// elo-arena/app/onboarding/username-form.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UsernameForm() {
  const [username, setUsername] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const save = async () => {
    setErr(null); setSaving(true)
    try {
      const clean = username.replace(/\s+/g,'').toLowerCase()
      if (clean.length < 3) { setErr('Login musi mieć co najmniej 3 znaki.'); setSaving(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setErr('Brak sesji. Zaloguj się.'); setSaving(false); return }

      const { error } = await supabase
        .from('profiles')
        .update({ username: clean })
        .eq('id', user.id)

      // 23505 = duplicate key
      if (error && ((error as any).code === '23505' || (error.message||'').includes('duplicate'))) {
        setErr('Ten login jest już zajęty.'); setSaving(false); return
      }
      if (error) { setErr(error.message); setSaving(false); return }

      router.push('/')
    } catch (e:any) {
      setErr(e?.message ?? 'Nie udało się zapisać loginu.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        className="w-full rounded border px-3 py-2"
        placeholder="np. michal123"
        value={username}
        onChange={e=>setUsername(e.target.value)}
      />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button onClick={save} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={saving}>
        {saving ? 'Zapisuję…' : 'Zapisz login'}
      </button>
    </div>
  )
}
