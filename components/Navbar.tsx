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
          'text-sky-100/80 hover:text-white',
          active ? 'text-white' : ''
        ].join(' ')}
      >
        <span>{children}</span>
        {active && (
          <span className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-sky-400" />
        )}
      </Link>
    )
  }

  const Arrow = ({ light }: { light?: boolean }) => (
    <span
      className={[
        'inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ml-1',
        light
          ? 'border-sky-100/80 text-sky-50 bg-sky-900/40'
          : 'border-sky-400/70 text-sky-100 bg-sky-900/40'
      ].join(' ')}
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

  return (
    <header className="sticky top-0 z-50">
      {/* cienki pasek akcentu na górze */}
      <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500" />

      <nav className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-sky-50/90 backdrop-blur border-b border-sky-800/60 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
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
                {/* INFO: Zalogowano — ten sam wymiar co inputy/przycisk */}
                <span
                  className="inline-flex h-9 max-w-xs items-center truncate rounded-full border border-sky-700 bg-slate-900/70 px-4 text-xs font-medium text-sky-50 shadow-sm"
                  title={user.email || undefined}
                >
                  <span className="opacity-70">Zalogowano:</span>&nbsp;{user.email ?? '—'}
                </span>
                <form action="/auth/signout" method="post">
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-sky-500 bg-sky-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500 hover:border-sky-300"
                    aria-label="Wyloguj"
                  >
                    Wyloguj
                    <Arrow />
                  </button>
                </form>
              </>
            ) : (
              // mini formularz logowania (tej samej wysokości)
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
                    className="h-9 rounded-full border border-sky-600 bg-slate-900/70 px-4 text-xs text-sky-50 placeholder-sky-300/80 outline-none focus:border-sky-300"
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Hasło"
                    autoComplete="current-password"
                    className="h-9 rounded-full border border-sky-600 bg-slate-900/70 px-4 text-xs text-sky-50 placeholder-sky-300/80 outline-none focus:border-sky-300"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-sky-500 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-400"
                  >
                    Zaloguj
                    <Arrow light />
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
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
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
                    <button className="w-full rounded-full border border-sky-500 bg-sky-600 px-4 py-2 text-sm font-semibold text-sky-50 hover:bg-sky-500">
                      Wyloguj
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/auth/signin"
                    className="block rounded-full border border-sky-500 bg-sky-700 px-4 py-2 text-center text-sm font-semibold text-sky-50 hover:bg-sky-600"
                  >
                    Zaloguj się
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block rounded-full border border-sky-400 bg-transparent px-4 py-2 text-center text-sm font-semibold text-sky-200 hover:bg-slate-900"
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
