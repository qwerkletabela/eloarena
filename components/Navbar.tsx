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
      <Link href={href} className={`nav-link ${active ? 'nav-link--active' : ''}`}>
        {children}
      </Link>
    )
  }

  const Arrow = ({ light }: { light?: boolean }) => (
    <span className={`pill__icon ${light ? 'pill__icon--light' : ''}`} aria-hidden>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-red-200 bg-white/80 backdrop-blur">
      <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600" />

      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 rounded bg-red-600" aria-hidden />
          <span className="text-lg font-semibold tracking-tight text-red-700">elo-arena</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/">Strona główna</NavLink>
          <NavLink href="/posts">Posty</NavLink>
          {user && <NavLink href="/profile">Profil</NavLink>}
          {role === 'admin' && <NavLink href="/admin">Admin</NavLink>}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span
  className="pill pill--info max-w-[320px] truncate"
  title={user.email || undefined}
>
  <span className="opacity-70">Zalogowano:</span>&nbsp;{user.email ?? '—'}
</span>
              <form action="/auth/signout" method="post">
                <button className="pill pill--secondary" aria-label="Wyloguj">
                  Wyloguj
                  <Arrow />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="pill pill--secondary">
                ZALOGUJ
                <Arrow />
              </Link>
              <Link href="/auth/signup" className="pill pill--primary">
                ZAŁÓŻ KONTO
                <Arrow light />
              </Link>
            </>
          )}
        </div>

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

      {open && (
        <div className="md:hidden border-t border-red-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
            <NavLink href="/">Strona główna</NavLink>
            {user && <NavLink href="/posts">Posty</NavLink>}
            <NavLink href="/profile">Profil</NavLink>
            {role === 'admin' && <NavLink href="/admin">Admin</NavLink>}

            <div className="my-2 border-t border-red-100" />

            {user ? (
  <div className="flex items-center justify-between">
    <span
  className="pill pill--info max-w-[100%] truncate"
  title={user.email || undefined}
>
  <span className="opacity-70">Zalogowano:</span>&nbsp;{user.email ?? '—'}
</span>

    <form action="/auth/signout" method="post">
      <button className="pill pill--secondary">
        Wyloguj <Arrow />
      </button>
    </form>
  </div>
) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin" className="flex-1 text-center pill pill--secondary">
                  ZALOGUJ <Arrow />
                </Link>
                <Link href="/auth/signup" className="flex-1 text-center pill pill--primary">
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
