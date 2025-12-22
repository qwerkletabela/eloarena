import Link from 'next/link'
import { redirect } from 'next/navigation'
import { 
  Users, 
  Trophy, 
  Calendar, 
  MapPin, 
  Settings,
  Home,
  LogOut,
  Shield
} from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase/server'

async function SignOutButton() {
  const signOut = async () => {
    'use server'
    const supabase = await createSupabaseServer()
    await supabase.auth.signOut()
    redirect('/auth/signin')
  }

  return (
    <form action={signOut}>
      <button 
        type="submit"
        className="flex items-center space-x-3 w-full p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm"
      >
        <LogOut className="h-4 w-4" />
        <span>Wyloguj się</span>
      </button>
    </form>
  )
}

interface AdminSidebarProps {
  user: {
    email?: string
  }
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const navigationItems = [
    { href: '/admin', icon: Home, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Użytkownicy' },
    { href: '/admin/turniej', icon: Trophy, label: 'Turnieje' },
    { href: '/admin/partie', icon: Trophy, label: 'Partie' },
    { href: '/admin/turniej/new', icon: Calendar, label: 'Nowy Turniej' },
    { href: '/admin/miejsca', icon: MapPin, label: 'Miejsca' },
    { href: '/admin/ustawienia', icon: Settings, label: 'Ustawienia' },
  ]

  return (
    <div className="w-64 min-h-screen bg-slate-800/95 border-r border-slate-700 flex flex-col">
      <div className="p-6 flex-1">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-sky-500 rounded-lg p-2">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-sky-200/80">Tournament System</p>
          </div>
        </div>

        {/* User Info */}
        <div className="mb-8 p-4 rounded-lg bg-slate-900/70 border border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {user.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.email}
              </p>
              <p className="text-xs text-sky-300">Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 p-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout Button at bottom */}
      <div className="p-6 border-t border-slate-700">
        <SignOutButton />
      </div>
    </div>
  )
}