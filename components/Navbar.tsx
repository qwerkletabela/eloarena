'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type UserLite = { id: string; email?: string | null } | null
type Role = 'admin' | 'user' | null

export default function Navbar({ user, role }: { user: UserLite; role: Role }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={[
          'relative px-3 py-2 text-sm font-medium transition',
          'text-sky-200/80 hover:text-sky-300',
          active ? 'text-sky-300' : '',
        ].join(' ')}
      >
        {children}
        {active && (
          <span className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-sky-400" />
        )}
      </Link>
    )
  }

  const inputStyle =
    'h-9 rounded-lg border border-slate-600 bg-slate-900/70 px-3 text-xs text-sky-50 ' +
    'placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-400'

  const buttonPrimary =
    'h-9 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 px-5 text-sm font-semibold text-white ' +
    'shadow-[0_5px_18px_rgba(15,23,42,0.8)] transition ' +
    'hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_7px_22px_rgba(15,23,42,1)]'

  const buttonSecondary =
    'h-9 rounded-full bg-slate-900/70 border border-sky-600 px-5 text-sm font-semibold text-sky-100 ' +
    'shadow-sm hover:bg-slate-800 hover:border-sky-400 transition'

  return (
    <header className="sticky top-0 z-50">
      {/* Pasek akcentu */}
      <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500" />

      <nav className="
        w-full 
        bg-slate-900/95
        backdrop-blur-md
        border-b border-slate-700
        shadow-[0_8px_25px_rgba(0,0,0,0.7)]
      ">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">

          {/* LEWA STRONA */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg 
                bg-sky-500 text-slate-900 font-bold shadow-md">
                EA
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-3">
              <NavLink href="/turniej">Turnieje</NavLink>

              {!user && <NavLink href="/auth/signup">Rejestracja</NavLink>}

              {user && <NavLink href="/profile">Profil</NavLink>}
              {role === 'admin' && <NavLink href="/admin">Admin</NavLink>}
            </div>
          </div>

          {/* PRAWA STRONA */}
          <div className="hidden md:flex items-center gap-3">

            {user ? (
              <>
                <span className="inline-flex h-9 items-center truncate rounded-full 
                  border border-sky-600 bg-slate-800/70 px-4 text-xs font-medium text-sky-200">
                  <span className="opacity-70">Zalogowano:</span>&nbsp;{user.email}
                </span>

                <form action="/auth/signout" method="post">
                  <button className={buttonSecondary}>
                    Wyloguj
                  </button>
                </form>
              </>
            ) : (
              <form
  action="/auth/signin/submit"
  method="post"
  className="flex items-center gap-2"
  autoComplete="off"
>

  {/* Fake input – przechwytuje autouzupełnianie */}
  <input type="text" autoComplete="username" className="hidden" />
  <input type="password" autoComplete="current-password" className="hidden" />

  <input
    name="identifier"
    placeholder="E-mail lub login"
    autoComplete="email"
    className={inputStyle}
  />

  <input
    type="password"
    name="password"
    placeholder="Hasło"
    autoComplete="new-password"
    className={inputStyle}
  />

  <button className={buttonPrimary}>Zaloguj</button>
</form>

            )}

          </div>

          {/* BURGER MOBILE */}
          <button
            className="md:hidden inline-flex h-10 w-10 items-center justify-center 
            rounded-md border border-sky-600 bg-slate-800/70 text-sky-200"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* MENU MOBILE */}
        {open && (
          <div className="md:hidden border-t border-sky-700 bg-slate-900/95 px-4 py-3 space-y-2">

            <NavLink href="/turniej">Turnieje</NavLink>
            {!user && <NavLink href="/auth/signup">Rejestracja</NavLink>}
            {user && <NavLink href="/profile">Profil</NavLink>}
            {role === 'admin' && <NavLink href="/admin">Admin</NavLink>}

            <div className="border-t border-sky-700 my-3" />

            {user ? (
              <form action="/auth/signout" method="post">
                <button className={`${buttonPrimary} w-full justify-center`}>
                  Wyloguj
                </button>
              </form>
            ) : (
              <Link href="/auth/signin" className={`${buttonPrimary} w-full justify-center`}>
                Zaloguj
              </Link>
            )}

          </div>
        )}

      </nav>
    </header>
  )
}
