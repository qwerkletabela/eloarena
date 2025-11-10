'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type UserLite = { id: string; email?: string | null } | null
type Role = 'admin' | 'user' | null

export default function Navbar({ user, role }: { user: UserLite; role: Role }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // zamknij mobilne menu przy zmianie ścieżki
  useEffect(() => { setOpen(false) }, [pathname])

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={[
          'px-3 py-2 rounded-md text-sm font-medium transition',
          active
            ? 'bg-red-600 text-white'
            : 'text-red-700 hover:bg-red-50 hover:text-red-800'
        ].join(' ')}
      >
        {children}
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-red-200 bg-white/80 backdrop-blur">
      {/* górny pasek akcentu */}
      <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600" />

      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo / brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 rounded bg-red-600" aria-hidden />
          <span className="text-lg font-semibold tracking-tight text-red-700">elo-arena</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/">Strona główna</NavLink>
          <NavLink href="/posts">Posty</NavLink>
          {role === 'admin' && <NavLink href="/admin">Admin</NavLink>}
        </div>

        {/* Prawa strona: user / auth */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                {user.email ? `Zalogowano: ${user.email}` : 'Zalogowano'}
              </span>
              <form action="/auth/signout" method="post">
                <button
                  className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 active:bg-red-100"
                  aria-label="Wyloguj"
                >
                  Wyloguj
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 active:bg-red-100"
              >
                Zaloguj
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800"
              >
                Załóż konto
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => setOpen((v) => !v)}
          aria-label="Otwórz menu"
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-red-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            <NavLink href="/">Strona główna</NavLink>
            <NavLink href="/posts">Posty</NavLink>
            {role === 'admin' && <NavLink href="/admin">Admin</NavLink>}

            <div className="my-2 border-t border-red-100" />

            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700">{user.email}</span>
                <form action="/auth/signout" method="post">
                  <button className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50">
                    Wyloguj
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin"
                  className="flex-1 rounded-md border border-red-200 bg-white px-3 py-2 text-center text-sm text-red-700 hover:bg-red-50"
                >
                  Zaloguj
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex-1 rounded-md bg-red-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-red-700"
                >
                  Załóż konto
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
