import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'

// Next 15+: searchParams jest Promisem
type SearchParams = Promise<Record<string, string | string[] | undefined>>

// Dokładnie te same wartości, co w ENUM w bazie:
const VOIVODESHIPS = [
  'Dolnośląskie',
  'Kujawsko-Pomorskie',
  'Lubelskie',
  'Lubuskie',
  'Łódzkie',
  'Małopolskie',
  'Mazowieckie',
  'Opolskie',
  'Podkarpackie',
  'Podlaskie',
  'Pomorskie',
  'Śląskie',
  'Świętokrzyskie',
  'Warmińsko-Mazurskie',
  'Wielkopolskie',
  'Zachodniopomorskie',
] as const

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const ok = sp.ok === '1'
  const err = typeof sp.e === 'string' ? sp.e : undefined

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'username, first_name, last_name, birthdate, city, voivodeship, role, email'
    )
    .eq('id', user.id)
    .single()

  const bday = profile?.birthdate ? String(profile.birthdate).slice(0, 10) : ''

  const inputClass =
    'w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 ' +
    'text-sm text-sky-50 placeholder:text-slate-400 ' +
    'focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400'

  const selectClass =
    'w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 ' +
    'text-sm text-sky-50 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400'

  const primaryBtn =
    'inline-flex items-center justify-center rounded-full bg-gradient-to-r ' +
    'from-sky-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white ' +
    'shadow-[0_10px_25px_rgba(15,23,42,0.9)] transition ' +
    'hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_14px_35px_rgba(15,23,42,1)] ' +
    'disabled:opacity-50 disabled:hover:shadow-none'

  const secondaryBtn =
    'inline-flex items-center justify-center rounded-full border border-slate-500 ' +
    'bg-slate-800/80 px-4 py-2 text-sm font-semibold text-sky-100 shadow-sm ' +
    'hover:bg-slate-700 hover:border-sky-400 transition'

  return (
    // Dodano ciemne tło gradientowe do całej strony
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        {/* KARTA PROFILU */}
        <div className="w-full max-w-xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-5">
          <h1 className="text-2xl font-semibold text-sky-50 text-center">
            Twój profil
          </h1>

          {ok && (
            <div className="rounded-md border border-emerald-300/70 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-200">
              Zapisano zmiany.
            </div>
          )}

          {err && (
            <div className="rounded-md border border-red-400/80 bg-red-900/40 px-3 py-2 text-sm text-red-100">
              {err === 'username_taken'
                ? 'Login zajęty.'
                : err === 'voiv_required'
                ? 'Wybierz województwo.'
                : err === 'voiv_invalid'
                ? 'Nieprawidłowa wartość województwa.'
                : 'Nie udało się zapisać. Spróbuj ponownie.'}
            </div>
          )}

          <form action="/profile/update" method="post" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-sky-100">
                Login (username)
              </label>
              <input
                name="username"
                defaultValue={profile?.username ?? ''}
                className={inputClass}
                maxLength={32}
                placeholder="np. m_kowalski"
              />
              <p className="mt-1 text-xs text-slate-300/80">
                Musi być unikalny.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-sky-100">
                  Imię
                </label>
                <input
                  name="first_name"
                  defaultValue={profile?.first_name ?? ''}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-100">
                  Nazwisko
                </label>
                <input
                  name="last_name"
                  defaultValue={profile?.last_name ?? ''}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sky-100">
                Data urodzenia
              </label>
              <input
                type="date"
                name="birthdate"
                defaultValue={bday}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-sky-100">
                  Miasto
                </label>
                <input
                  name="city"
                  defaultValue={profile?.city ?? ''}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sky-100">
                  Województwo
                </label>
                <select
                  name="voivodeship"
                  defaultValue={profile?.voivodeship ?? ''}
                  className={selectClass}
                  required
                >
                  <option value="" disabled>
                    — wybierz —
                  </option>
                  {VOIVODESHIPS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-sm text-sky-100/80">
              <span className="opacity-70">Rola:</span>{' '}
              <span
                className={
                  profile?.role === 'admin'
                    ? 'font-semibold text-red-300'
                    : 'font-medium'
                }
              >
                {profile?.role ?? 'user'}
              </span>{' '}
              • <span className="opacity-70">Email:</span>{' '}
              {profile?.email ?? user.email}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 justify-end">
              <button className={primaryBtn} type="submit">
                Zapisz zmiany
              </button>
              <a href="/" className={secondaryBtn}>
                Anuluj
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}