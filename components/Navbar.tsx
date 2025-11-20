'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type UserLite = { id: string; email?: string | null } | null
type Role = 'admin' | 'user' | null

export default function Navbar({ user, role }: { user: UserLite; role: Role }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={[
          'relative px-3 py-2 text-sm font-medium transition-colors',
          'text-sky-100/80 hover:text-white',
          active ? 'text-white' : '',
        ].join(' ')}
      >
        <span>{children}</span>
        {active && (
          <span className="pointer-events-none absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-sky-400" />
        )}
      </Link>
    )
  }

  const Arrow = () => (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/80 text-[10px]"
      aria-hidden
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path
          d="M8 5l8 7-8 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )

  const primaryBtn =
    'inline-flex items-center gap-2 rounded-full px-5 h-9 text-sm font-semibold text-white ' +
    'bg-gradient-to-b from-sky-400 to-sky-600 shadow-md ' +
    'transition transform duration-150 ' +
    'hover:from-sky-300 hover:to-sky-500 hover:-translate-y-0.5 ' +
    'active:translate-y-0 active:shadow-sm ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'

  const secondaryBtn =
    'inline-flex items-center gap-2 rounded-full px-5 h-9 text-sm font-semibold ' +
    'text-sky-100 bg-slate-900/60 border border-sky-500/70 shadow-md ' +
    'transition transform duration-150 ' +
    'hover:bg-slate-800/80 hover:border-sky-300 hover:-translate-y-0.5 ' +
    'active:translate-y-0 active:shadow-sm ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'

  const inputNav =
    'h-9 rounded-full border border-white/40 bg-white/10 px-4 text-xs text-sky-50 ' +
    'placeholder:text-sky-100/60 shadow-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent'

  return (
    <header className="sticky top-0 z-50">
      {/* cienki pasek akcentu na górze */}
      <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500" />

      <nav className="w-full bg-gradient-to-r from-red-700 via-red-800 to-red-900 text-sky-50/90 backdrop-blur border-b border-blue-800/60 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          {/* LEWA STRONA: logo EA + linki (desktop) */}
          <div className="flex items-center gap-4">
            {/* logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 shadow-sm">
                <span className="text-xs font-bold text-white">EA</span>
              </span>
            </Link>

            {/* linki desktop */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink href="/turniej">Turnieje</NavLink>
              {user && <NavLink href="/profile">Profil</NavLink>}
              {role === 'admin' && <NavLink href="/admin">Admin</NavLink>}
            </div>
          </div>

          {/* PRAWA STRONA: logowanie / info (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {/* INFO: Zalogowano — pigułka */}
                <span
                  className="inline-flex h-9 max-w-xs items-center truncate rounded-full border border-sky-600 bg-slate-900/70 px-4 text-xs font-medium text-sky-50 shadow-sm"
                  title={user.email || undefined}
                >
                  <span className="opacity-70">Zalogowano:</span>&nbsp;{user.email ?? '—'}
                </span>
                <form action="/auth/signout" method="post">
                  <button
                    className={secondaryBtn}
                    aria-label="Wyloguj"
                  >
                    Wyloguj
                    <Arrow />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <form
                  action="/auth/signin/submit"
                  method="post"
                  className="flex items-center gap-2"
                >
                  <input
                    name="identifier"
                    placeholder="E-mail lub login"
                    autoComplete="off"
                    className={inputNav}
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Hasło"
                    autoComplete="off"
                    className={inputNav}
                  />
                  <button
                    type="submit"
                    className={primaryBtn}
                  >
                    Zaloguj
                    <Arrow />
                  </button>
                </form>
                <Link
                  href="/auth/signup"
                  className="text-[11px] leading-none text-sky-100 hover:text-white"
                >
                  rejestracja
                </Link>
              </div>
            )}
          </div>

          {/* burger mobile */}
          <button
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-sky-600 bg-slate-900/70 text-sky-50 hover:bg-slate-800"
            onClick={() => setOpen(v => !v)}
            aria-label="Otwórz menu"
            aria-expanded={open}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* menu mobile */}
        {open && (
          <div className="md:hidden border-t border-sky-800 bg-slate-950/95">
            <div className="flex flex-col gap-2 px-4 py-3">
              <NavLink href="/turniej">Turnieje</NavLink>
              {user && <NavLink href="/profile">Profil</NavLink>}
              {role === 'admin' && <NavLink href="/admin">Admin</NavLink>}

              <div className="my-3 border-t border-sky-800" />

              {user ? (
                <div className="space-y-2">
                  <span
                    className="block rounded-full border border-sky-700 bg-slate-900/80 px-3 py-1.5 text-xs text-sky-50"
                    title={user.email || undefined}
                  >
                    <span className="opacity-70">Zalogowano:</span>&nbsp;{user.email ?? '—'}
                  </span>
                  <form action="/auth/signout" method="post">
                    <button className={`${primaryBtn} w-full justify-center`}>
                      Wyloguj
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/auth/signin"
                    className={`${primaryBtn} w-full justify-center`}
                  >
                    Zaloguj się
                  </Link>
                  <Link
                    href="/auth/signup"
                    className={`${secondaryBtn} w-full justify-center`}
                  >
                    Rejestracja
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
