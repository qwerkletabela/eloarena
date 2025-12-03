'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

// Prosty typ użytkownika przekazywany z serwera do navbaru
type UserLite = { 
  id: string
  email?: string | null 
} | null

// Dostępne role w aplikacji
type Role = 'admin' | 'organizer' | 'user' | null

// Stałe dla ścieżek aplikacji - łatwiejsze zarządzanie
const ROUTES = {
  HOME: '/',
  TOURNAMENTS: '/turniej',
  PROFILE: '/profile',
  ADMIN: '/admin',
  SIGNUP: '/auth/signup',
  SIGNIN: '/auth/signin',
  SIGNOUT: '/auth/signout',
  SIGNIN_SUBMIT: '/auth/signin/submit',
} as const

// Komponent NavLink z memoizacją dla lepszej wydajności
const NavLink = ({ 
  href, 
  children,
  currentPath 
}: { 
  href: string
  children: React.ReactNode
  currentPath: string
}) => {
  const isActive = currentPath === href
  
  return (
    <Link
      href={href}
      className={`
        relative px-3 py-2 text-sm font-medium transition
        text-sky-300/80 hover:text-sky-600
        ${isActive ? 'text-sky-300' : ''}
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
      {isActive && (
        <span 
          className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-sky-600"
          aria-hidden="true"
        />
      )}
    </Link>
  )
}

// Komponent MobileMenu dla lepszej czytelności
const MobileMenu = ({ 
  isOpen, 
  user, 
  role, 
  currentPath 
}: { 
  isOpen: boolean
  user: UserLite
  role: Role
  currentPath: string
}) => {
  if (!isOpen) return null
  
  return (
    <div 
      className="md:hidden border-t border-sky-700 bg-slate-900/95 px-4 py-3 space-y-2"
      role="menu"
      aria-label="Menu mobilne"
    >
      <NavLink href={ROUTES.TOURNAMENTS} currentPath={currentPath}>
        Turnieje
      </NavLink>
      
      {!user && (
        <NavLink href={ROUTES.SIGNUP} currentPath={currentPath}>
          Rejestracja
        </NavLink>
      )}
      
      {user && (
        <NavLink href={ROUTES.PROFILE} currentPath={currentPath}>
          Profil
        </NavLink>
      )}
      
      {role === 'admin' && (
        <NavLink href={ROUTES.ADMIN} currentPath={currentPath}>
          Admin
        </NavLink>
      )}

      <div className="border-t border-sky-700 my-3" aria-hidden="true" />

      {user ? (
        <form action={ROUTES.SIGNOUT} method="post" className="w-full">
          <button 
            type="submit"
            className="auth-button w-full"
            role="menuitem"
          >
            Wyloguj
          </button>
        </form>
      ) : (
        <div className="w-full">
          <Link 
            href={ROUTES.SIGNIN} 
            className="auth-button w-full"
            role="menuitem"
          >
            Zaloguj
          </Link>
        </div>
      )}
    </div>
  )
}

// Główny komponent Navbar
export default function Navbar({ user, role }: { user: UserLite; role: Role }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  // Zamknij menu przy zmianie ścieżki
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Zamknij menu po kliknięciu ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  // Style CSS jako stałe
  const INPUT_STYLE = `
    h-9 rounded-lg border border-slate-600 bg-slate-900/70 
    px-3 text-xs text-sky-50 placeholder:text-slate-400 
    shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-400
    transition-colors duration-200
  `

  const BUTTON_PRIMARY = `
    inline-flex items-center justify-center h-9 rounded-full 
    bg-gradient-to-r from-sky-500 to-sky-600 px-5 text-sm 
    font-semibold text-white shadow-[0_5px_18px_rgba(15,23,42,0.8)] 
    transition-all duration-200 hover:from-sky-400 hover:to-sky-500 
    hover:shadow-[0_7px_22px_rgba(15,23,42,1)] 
    focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  const BUTTON_SECONDARY = `
    h-9 rounded-full bg-slate-900/70 border border-sky-600 
    px-5 text-sm font-semibold text-sky-100 shadow-sm 
    transition-colors duration-200 hover:bg-slate-800 hover:border-sky-400
  `

  // Helper dla klas Tailwind
  const authButton = BUTTON_PRIMARY

  return (
    <header className="sticky top-0 z-50">
      {/* Top accent bar */}
      <div 
        className="h-1 w-full bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500"
        aria-hidden="true"
      />

      <nav
        className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-700 shadow-[0_8px_25px_rgba(0,0,0,0.7)]"
        aria-label="Główne menu"
      >
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and desktop navigation */}
            <div className="flex items-center gap-4">
              <Link 
                href={ROUTES.HOME} 
                className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-sky-400 rounded-lg p-1"
                aria-label="Strona główna"
              >
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-slate-900 font-bold shadow-md"
                  aria-hidden="true"
                >
                  EA
                </span>
                <span className="sr-only">Elo Arena</span>
              </Link>

              {/* Desktop navigation */}
              <div className="hidden md:flex items-center gap-3">
                <NavLink href={ROUTES.TOURNAMENTS} currentPath={pathname}>
                  Turnieje
                </NavLink>
                
                {!user && (
                  <NavLink href={ROUTES.SIGNUP} currentPath={pathname}>
                    Rejestracja
                  </NavLink>
                )}
                
                {user && (
                  <NavLink href={ROUTES.PROFILE} currentPath={pathname}>
                    Profil
                  </NavLink>
                )}
                
                {role === 'admin' && (
                  <NavLink href={ROUTES.ADMIN} currentPath={pathname}>
                    Admin
                  </NavLink>
                )}
              </div>
            </div>

            {/* Right side - Auth/User info (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <span
                    className="inline-flex h-9 items-center truncate rounded-full border border-sky-600 bg-slate-800/70 px-4 text-xs font-medium text-sky-200 max-w-[200px]"
                    title={user.email || ''}
                  >
                    <span className="opacity-70">Zalogowano:</span>&nbsp;
                    <span className="truncate">{user.email}</span>
                  </span>

                  <form action={ROUTES.SIGNOUT} method="post">
                    <button 
                      type="submit"
                      className={authButton}
                      aria-label="Wyloguj się"
                    >
                      Wyloguj
                    </button>
                  </form>
                </>
              ) : (
                <form
                  action={ROUTES.SIGNIN_SUBMIT}
                  method="post"
                  className="flex items-center gap-2"
                  autoComplete="on"
                >
                  {/* Auto-complete trick */}
                  <input type="text" autoComplete="username" className="hidden" aria-hidden="true" />
                  <input type="password" autoComplete="current-password" className="hidden" aria-hidden="true" />

                  <div className="flex flex-col gap-1">
                    <input
                      name="identifier"
                      placeholder="E-mail lub login"
                      autoComplete="email"
                      className={INPUT_STYLE}
                      required
                      aria-label="Email lub login"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <input
                      type="password"
                      name="password"
                      placeholder="Hasło"
                      autoComplete="current-password"
                      className={INPUT_STYLE}
                      required
                      aria-label="Hasło"
                    />
                  </div>

                  <button 
                    type="submit"
                    className={authButton}
                    aria-label="Zaloguj się"
                  >
                    Zaloguj
                  </button>
                </form>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-sky-600 bg-slate-800/70 text-sky-200 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Zamknij menu" : "Otwórz menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg 
                width="22" 
                height="22" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                className="transition-transform duration-200"
                style={{ transform: isMenuOpen ? 'rotate(90deg)' : 'none' }}
                aria-hidden="true"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          <MobileMenu 
            isOpen={isMenuOpen}
            user={user}
            role={role}
            currentPath={pathname}
          />
        </div>
      </nav>
      
      {/* Overlay dla menu mobilnego */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Style dla auth button (aby uniknąć duplikacji w klasach) */}
      <style jsx global>{`
        .auth-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 2.25rem;
          border-radius: 9999px;
          background-image: linear-gradient(to right, #0ea5e9, #0284c7);
          padding-left: 1.25rem;
          padding-right: 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.8);
          transition: all 0.2s;
        }
        
        .auth-button:hover {
          background-image: linear-gradient(to right, #38bdf8, #0ea5e9);
          box-shadow: 0 7px 22px rgba(15, 23, 42, 1);
        }
        
        .auth-button:focus {
          outline: none;
          ring: 2px;
          ring-color: #38bdf8;
          ring-offset: 2px;
          ring-offset-color: #0f172a;
        }
        
        .auth-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </header>
  )
}