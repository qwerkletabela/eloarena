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
  MAP: '/mapa',
  PROFILE: '/profile',
  ADMIN: '/admin',
  ORGANIZER: '/organizer/dashboard',
  SIGNUP: '/auth/signup',
  SIGNIN: '/auth/signin',
  SIGNOUT: '/auth/signout',
  SIGNIN_SUBMIT: '/auth/signin/submit',
} as const

// Komponent NavLink z memoizacją dla lepszej wydajności
const NavLink = ({ 
  href, 
  children,
  currentPath,
  className = ''
}: { 
  href: string
  children: React.ReactNode
  currentPath: string
  className?: string
}) => {
  const isActive = currentPath === href
  
  return (
    <Link
      href={href}
      className={`
        relative px-3 py-1 text-sm font-medium transition
        text-sky-300/80 hover:text-sky-600
        ${isActive ? 'text-sky-300' : ''}
        ${className}
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
  currentPath,
  onClose
}: { 
  isOpen: boolean
  user: UserLite
  role: Role
  currentPath: string
  onClose: () => void
}) => {
  if (!isOpen) return null
  
  return (
    <>
      {/* Overlay - kliknięcie zamyka menu */}
      <div 
        className="md:hidden fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu mobilne - wyższy z-index niż overlay */}
      <div 
        className="md:hidden border-t border-sky-700 bg-slate-900 px-4 py-3 space-y-2 relative z-50"
        role="menu"
        aria-label="Menu mobilne"
      >
        <NavLink href={ROUTES.TOURNAMENTS} currentPath={currentPath}>
          Turnieje
        </NavLink>
        
        <NavLink href={ROUTES.MAP} currentPath={currentPath}>
          Mapa
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
        
        {/* Dla ADMINA */}
        {role === 'admin' && (
          <NavLink 
            href={ROUTES.ADMIN} 
            currentPath={currentPath}
            className="text-red-300 hover:text-red-100"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin
            </span>
          </NavLink>
        )}
        
        {/* Dla ORGANIZATORA */}
        {role === 'organizer' && (
          <NavLink 
            href={ROUTES.ORGANIZER} 
            currentPath={currentPath}
            className="text-emerald-300 hover:text-emerald-100"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Panel
            </span>
          </NavLink>
        )}

        <div className="border-t border-sky-700 my-3" aria-hidden="true" />

        {user ? (
          <form action={ROUTES.SIGNOUT} method="post" className="w-full">
            <button 
              type="submit"
              className="w-full inline-flex items-center justify-center h-9 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 px-5 text-sm font-semibold text-white shadow-[0_5px_18px_rgba(15,23,42,0.8)] transition-all duration-200 hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_7px_22px_rgba(15,23,42,1)] focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              role="menuitem"
              onClick={onClose}
            >
              Wyloguj
            </button>
          </form>
        ) : (
          <div className="w-full">
            <Link 
              href={ROUTES.SIGNIN} 
              className="w-full inline-flex items-center justify-center h-9 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 px-5 text-sm font-semibold text-white shadow-[0_5px_18px_rgba(15,23,42,0.8)] transition-all duration-200 hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_7px_22px_rgba(15,23,42,1)] focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              role="menuitem"
              onClick={onClose}
            >
              Zaloguj
            </Link>
          </div>
        )}
      </div>
    </>
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
        className="w-full bg-slate-900 border-b border-slate-700 shadow-[0_8px_25px_rgba(0,0,0,0.7)]"
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
                
                <NavLink href={ROUTES.MAP} currentPath={pathname}>
                  Mapa
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
                
                {/* Dla ADMINA */}
                {role === 'admin' && (
                  <NavLink 
                    href={ROUTES.ADMIN} 
                    currentPath={pathname}
                    className="text-red-300 hover:text-red-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin
                  </NavLink>
                )}
                
                {/* Dla ORGANIZATORA */}
                {role === 'organizer' && (
                  <NavLink 
                    href={ROUTES.ORGANIZER} 
                    currentPath={pathname}
                    className="text-emerald-300 hover:text-emerald-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Panel
                  </NavLink>
                )}
              </div>
            </div>

            {/* Right side - Auth/User info (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {/* Badge z rolą */}
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    role === 'admin' 
                      ? 'bg-red-900/20 text-red-300 border-red-700/30' 
                      : role === 'organizer'
                      ? 'bg-emerald-900/20 text-emerald-300 border-emerald-700/30'
                      : 'bg-slate-800/40 text-sky-300 border-slate-700'
                  }`}>
                    {role === 'admin' ? 'Admin' : 
                     role === 'organizer' ? 'Organizator' : 
                     'Użytkownik'}
                  </div>
                  
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
        </div>
      </nav>
      
      {/* Menu mobilne z overlay - poza głównym nav */}
      <MobileMenu 
        isOpen={isMenuOpen}
        user={user}
        role={role}
        currentPath={pathname}
        onClose={() => setIsMenuOpen(false)}
      />
    </header>
  )
}