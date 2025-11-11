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
          'px-3 py-2 rounded-md text-sm font-medium transition',
          active ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-50 hover:text-red-800'
        ].join(' ')}
      >
        {children}
      </Link>
    )
  }

  // klasy dla „pill” przycisków
  const pillBase =
    'inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold ' +
    'transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ' +
    'transition-shadow transform-gpu hover:-translate-y-0.5 active:translate-y-0'

  const pillPrimary =
    // czerwony gradient + miękki czerwony cień
    'text-white bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 ' +
    'shadow-[0_6px_14px_rgba(220,38,38,0.25)] hover:shadow-[0_9px_20px_rgba(220,38,38,0.35)] active:shadow-[0_4px_10px_rgba(220,38,38,0.25)]'

  const pillSecondary =
    // jasny wariant z subtelnym cieniem
    'text-red-700 border border-red-200 bg-white hover:bg-red-50 active:bg-red-100 ' +
    'shadow-[0_4px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_14px_rgba(0,0,0,0.10)] active:shadow-[0_3px_8px_rgba(0,0,0,0.08)]'

  const Arrow = ({ light }: { light?: boolean }) => (
    <span
      className={
        'inline-flex h-6 w-6 items-center justify-center rounded-full border ' +
        (light ? 'border-white/80 text-white' : 'border-red-300 text-red-700')
      }
      aria-hidden
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-red-200 bg-white/80 backdrop-blur">
      {/* akcent na górze */}
      <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600" />

      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 rounded bg-red-600" aria-hidden />
          <span className="text-lg font-semibold tracking-tight text-red-700">elo-arena</span>
        </Link>

        {/* desktop links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/">Strona główna</NavLink>
          <NavLink href="/posts">Posty</NavLink>
          {role === 'admin' && <NavLink href="/admin">Admin</NavLink>}
        </div>

        {/* desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                {user.email ? `Zalogowano: ${user.email}` : 'Zalogowano'}
              </span>
              <form action="/auth/signout" method="post">
                <button className={`${pillBase} ${pillSecondary}`} aria-label="Wyloguj">
                  Wyloguj
                  <Arrow />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className={`${pillBase} ${pillSecondary}`}>
                ZALOGUJ
                <Arrow />
              </Link>
              <Link href="/auth/signup" className={`${pillBase} ${pillPrimary}`}>
                ZAŁÓŻ KONTO
                <Arrow light />
              </Link>
            </>
          )}
        </div>

        {/* mobile burger */}
        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => setOpen(v => !v)}
          aria-label="Otwórz menu"
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </nav>

      {/* mobile menu */}
      {open && (
        <div className="md:hidden border-t border-red-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
            <NavLink href="/">Strona główna</NavLink>
            <NavLink href="/posts">Posty</NavLink>
            {role === 'admin' && <NavLink href="/admin">Admin</NavLink>}

            <div className="my-2 border-t border-red-100" />

            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700">{user.email}</span>
                <form action="/auth/signout" method="post">
                  <button className={`${pillBase} ${pillSecondary}`}>Wyloguj <Arrow /></button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin" className={`flex-1 text-center ${pillBase} ${pillSecondary}`}>
                  ZALOGUJ <Arrow />
                </Link>
                <Link href="/auth/signup" className={`flex-1 text-center ${pillBase} ${pillPrimary}`}>
                  ZAŁÓŻ KONTO <Arrow light />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
