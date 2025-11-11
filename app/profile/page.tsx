import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'

type Search = { ok?: string; e?: string }

export default async function ProfilePage({ searchParams }: { searchParams: Search }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, first_name, last_name, birthdate, city, voivodeship, role, email')
    .eq('id', user.id)
    .single()

  const bday = profile?.birthdate ? String(profile.birthdate).slice(0, 10) : ''

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Twój profil</h1>

      {searchParams.ok === '1' && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Zapisano zmiany.
        </div>
      )}
      {searchParams.e && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.e === 'username_taken' ? 'Login zajęty.' : 'Nie udało się zapisać. Spróbuj ponownie.'}
        </div>
      )}

      <form action="/profile/update" method="post" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Login (username)</label>
          <input
            name="username"
            defaultValue={profile?.username ?? ''}
            className="mt-1 w-full rounded border px-3 py-2"
            maxLength={32}
            placeholder="np. m_kowalski"
          />
          <p className="mt-1 text-xs text-slate-500">Musi być unikalny.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Imię</label>
            <input name="first_name" defaultValue={profile?.first_name ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nazwisko</label>
            <input name="last_name" defaultValue={profile?.last_name ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Data urodzenia</label>
          <input type="date" name="birthdate" defaultValue={bday} className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Miasto</label>
            <input name="city" defaultValue={profile?.city ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Województwo</label>
            <input name="voivodeship" defaultValue={profile?.voivodeship ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div className="text-sm text-slate-600">
          <span className="opacity-70">Rola:</span>{' '}
          <span className={profile?.role === 'admin' ? 'font-semibold text-red-700' : ''}>
            {profile?.role ?? 'user'}
          </span>{' '}
          • <span className="opacity-70">Email:</span> {profile?.email ?? user.email}
        </div>

        <div className="flex gap-2 pt-2">
          <button className="pill pill--primary" type="submit">Zapisz zmiany</button>
          <a href="/" className="pill pill--secondary">Anuluj</a>
        </div>
      </form>
    </main>
  )
}
