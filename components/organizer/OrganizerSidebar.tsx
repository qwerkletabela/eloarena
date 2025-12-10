// components/organizer/OrganizerSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Trophy, 
  MapPin, 
  Home,
  CalendarPlus,
  List,
  PlusCircle,
  LogOut,
  User,
  BarChart3,
  Settings,
  Shield
} from 'lucide-react'

interface OrganizerSidebarProps {
  user: {
    id: string
    email?: string | null
  }
  role: string
}

export default function OrganizerSidebar({ user, role }: OrganizerSidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/organizer/dashboard',
      icon: <Home className="h-5 w-5" />,
      description: 'Panel organizatora'
    },
    {
      title: 'Moje turnieje',
      href: '/organizer/turnieje',
      icon: <List className="h-5 w-5" />,
      description: 'Zarządzaj turniejami'
    },
    {
      title: 'Nowy turniej',
      href: '/turniej/new',
      icon: <PlusCircle className="h-5 w-5" />,
      description: 'Utwórz nowy turniej'
    },
    {
      title: 'Moje miejsca',
      href: '/organizer/miejsca',
      icon: <MapPin className="h-5 w-5" />,
      description: 'Twoje miejsca turniejów'
    },
    {
      title: 'Dodaj miejsce',
      href: '/miejsce/nowe',
      icon: <PlusCircle className="h-5 w-5" />,
      description: 'Dodaj nowe miejsce'
    },
    {
      title: 'Statystyki',
      href: '/organizer/statystyki',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Statystyki organizatora'
    },
    {
      title: 'Ustawienia',
      href: '/organizer/ustawienia',
      icon: <Settings className="h-5 w-5" />,
      description: 'Ustawienia konta'
    }
  ]

  // Jeśli jest też adminem, dodaj link do panelu admina
  if (role === 'admin') {
    menuItems.push({
      title: 'Panel admina',
      href: '/admin',
      icon: <Shield className="h-5 w-5" />,
      description: 'Przejdź do panelu admina'
    })
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/auth/signout', { method: 'POST' })
      if (response.ok) {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/'
    }
  }

  return (
    <div className="w-64 min-h-screen bg-slate-800/95 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500 rounded-lg p-2">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Panel Organizatora</h1>
            <p className="text-xs text-emerald-200/80">Elo Arena</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.email || 'Organizer'}
            </p>
            <p className="text-xs text-emerald-300">
              {role === 'admin' ? 'Administrator/Organizer' : 'Organizer'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-emerald-900/40 text-emerald-100 border border-emerald-700/50' 
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {item.icon}
              <div className="flex-1">
                <span className="text-sm font-medium">{item.title}</span>
                <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-slate-700 space-y-3">
        <Link
          href="/"
          className="flex items-center space-x-3 p-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>Strona główna</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full p-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Wyloguj się</span>
        </button>
      </div>
    </div>
  )
}