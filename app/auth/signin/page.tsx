// app/auth/signin/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

export default function SignIn() {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const searchParams = useSearchParams()
  
  // Obsługa błędów z query params
  const errorFromParams = useMemo(() => {
    const e = searchParams.get('e')
    if (e === 'notfound') return 'Nie znaleziono użytkownika o takim loginie.'
    if (e === 'invalid') return 'Nieprawidłowy email/login lub hasło.'
    return null
  }, [searchParams])

  // Reset query params po pierwszym renderze
  useEffect(() => { 
    if (errorFromParams && typeof window !== 'undefined') {
      const newUrl = window.location.pathname
      window.history.replaceState(null, '', newUrl)
    }
  }, [errorFromParams])

  const isFormValid = () => {
    return formData.identifier.trim().length > 0 && 
           formData.password.length >= 6
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      return
    }
    
    setLoading(true)
    
    // Tworzymy formularz i wysyłamy go - tak jak to robi navbar
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/auth/signin/submit'
    form.style.display = 'none'
    
    const identifierInput = document.createElement('input')
    identifierInput.name = 'identifier'
    identifierInput.value = formData.identifier
    form.appendChild(identifierInput)
    
    const passwordInput = document.createElement('input')
    passwordInput.name = 'password'
    passwordInput.value = formData.password
    form.appendChild(passwordInput)
    
    document.body.appendChild(form)
    form.submit()
  }

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div className="py-8 px-4">
      <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Karta formularza */}
          <div className="rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-8">
            
            {/* Nagłówek "Logowanie" wewnątrz karty */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-sky-50 mb-2">
                Logowanie
              </h1>
            </div>

            {/* Używamy onSUBMIT z JavaScript, nie action w form */}
            <form 
              onSubmit={handleSubmit}
              className="space-y-6" 
              autoComplete="off"
            >
              {/* Pole Email/Login */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    Email lub nazwa użytkownika
                  </div>
                </label>
                <input
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-4 py-3 text-sky-50 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all"
                  type="text"
                  placeholder="twoj@email.pl lub nazwa użytkownika"
                  value={formData.identifier}
                  onChange={handleChange('identifier')}
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              {/* Pole Hasła */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Lock size={16} />
                    Hasło
                  </div>
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-4 py-3 text-sky-50 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all pr-12"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Wprowadź hasło"
                    value={formData.password}
                    onChange={handleChange('password')}
                    minLength={6}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors p-1"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Komunikat błędu z URL */}
              {errorFromParams && (
                <div className="rounded-lg p-4 bg-red-900/30 border border-red-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={20} />
                    <p className="text-sm text-red-300">
                      {errorFromParams}
                    </p>
                  </div>
                </div>
              )}

              {/* Przycisk submit */}
              <button
                className="w-full rounded-full bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.9)] transition-all hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_14px_35px_rgba(15,23,42,1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-sky-500 disabled:hover:to-sky-600 disabled:hover:shadow-[0_10px_25px_rgba(15,23,42,0.9)]"
                type="submit"
                disabled={!isFormValid() || loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Logowanie...
                  </span>
                ) : (
                  'Zaloguj się'
                )}
              </button>
            </form>

            {/* Linki do rejestracji i resetowania hasła */}
            <div className="mt-8 pt-6 border-t border-slate-700 text-center space-y-3">
              <p className="text-slate-400 text-sm">
                Nie masz jeszcze konta?{' '}
                <Link
                  href="/auth/signup"
                  className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  Zarejestruj się
                </Link>
              </p>
              
              <p className="text-slate-400 text-sm">
                Zapomniałeś hasła?{' '}
                <Link
                  href="/auth/reset-password"
                  className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  Zresetuj hasło
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}