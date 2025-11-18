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
          'relative px-3 py-2 text-sm font-medium transition',
          'text-sky-50/80 hover:text-white',
          active ? 'text-white' : '',
        ].join(' ')}
      >
        <span>{children}</span>
        {active && (
          <span className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-sky-400" />
        )}
      </Link>
    )
  }

  const Arrow = () => (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-sky-300/70 bg-sky-900/40 text-sky-100 ml-1">
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

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* cienki pasek akcentu */}
      <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500" />

      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-sky-900 text-sky-50/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          {/* brand */}
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 shadow-sm">
              <span className="text-xs font-bold text-white">EA</span>
            </span>
            <span className="text-lg font-semibold tracking-tight text-sky-50">
              elo-arena
            </span>
          </Link>

          {/* desktop links */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink href="/turniej">Turnieje</NavLink>
            {user && <NavLink href="/profile">Profil</NavLink>}
            {role === 'admin' && <NavLink href="/admin">Admin</NavLink>}
          </div>

          {/* desktop right side */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span
                  className="max-w-xs truncate rounded-full border border-sky-600 bg-sky-800/60 px-4 py-1.5 text-xs font-medium text-sky-50 shadow-sm"
                  title={user.email || undefined}
                >
                  <span className="opacity-70">Zalogowano:</span>&nbsp;{user.email ?? '—'}
                </span>
                <form action="/auth/signout" method="post">
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-sky-400 bg-sky-700/70 px-4 py-1.5 text-xs font-semibold text-sky-50 shadow-sm transition hover:bg-sky-600 hover:border-sky-300"
                    aria-label="Wyloguj"
                  >
                    Wyloguj
                    <Arrow />
                  </button>
                </form>
              </>
            ) : (
              // MINI-FORMULARZ LOGOWANIA (desktop)
              <div className="flex flex-col items-end gap-1">
                <form
                  action="/auth/signin/submit"
                  method="post"
                  className="flex items-center gap-2"
                >
                  <input
                    name="identifier"
                    placeholder="E-mail lub login"
                    autoComplete="username"
                    className="h-9 rounded-md border border-sky-500/60 bg-sky-900/40 px-3 text-xs text-sky-50 placeholder-sky-300/70 outline-none ring-0 focus:border-sky-300"
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Hasło"
                    autoComplete="current-password"
                    className="h-9 rounded-md border border-sky-500/60 bg-sky-900/40 px-3 text-xs text-sky-50 placeholder-sky-300/70 outline-none ring-0 focus:border-sky-300"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-sky-500 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-400"
                  >
                    Zaloguj
                    <Arrow />
                  </button>
                </form>
                <Link
                  href="/auth/signup"
                  className="text-[11px] leading-none text-sky-200 hover:text-white"
                >
                  rejestracja
                </Link>
              </div>
            )}
          </div>

          {/* mobile burger */}
          <button
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-sky-500/60 bg-sky-900/40 text-sky-50 hover:bg-sky-800/80"
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
        </nav>

        {/* mobile menu */}
        {open && (
          <div className="md:hidden border-t border-sky-700/70 bg-sky-950/95">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
              <NavLink href="/turniej">Turnieje</NavLink>
              {user && <NavLink href="/profile">Profil</NavLink>}
              {role === 'admin' && <NavLink href="/admin">Admin</NavLink>}

              <div className="my-3 border-t border-sky-800" />

              {user ? (
                <div className="space-y-2">
                  <span
                    className="block rounded-full border border-sky-600 bg-sky-900/70 px-3 py-1.5 text-xs text-sky-50"
                    title={user.email || undefined}
                  >
                    <span className="opacity-70">Zalogowano:</span>&nbsp;{user.email ?? '—'}
                  </span>
                  <form action="/auth/signout" method="post">
                    <button className="w-full rounded-full border border-sky-500 bg-sky-700 px-4 py-2 text-sm font-semibold text-sky-50 hover:bg-sky-600">
                      Wyloguj
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/auth/signin"
                    className="block rounded-full border border-sky-500 bg-sky-800 px-4 py-2 text-center text-sm font-semibold text-sky-50 hover:bg-sky-700"
                  >
                    Zaloguj się
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block rounded-full border border-sky-400 bg-transparent px-4 py-2 text-center text-sm font-semibold text-sky-200 hover:bg-sky-900/70"
                  >
                    Rejestracja
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
