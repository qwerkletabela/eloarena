'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validation, setValidation] = useState({
    email: { valid: true, message: '' },
    password: { valid: true, message: '' },
    confirmPassword: { valid: true, message: '' }
  })
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailExists, setEmailExists] = useState(false)

  // Debounce dla sprawdzania emaila
  useEffect(() => {
    const checkEmailExists = async () => {
      const email = formData.email.trim()
      
      if (!email || !isValidEmail(email)) {
        setEmailExists(false)
        setValidation(prev => ({
          ...prev,
          email: { valid: true, message: '' }
        }))
        return
      }

      setCheckingEmail(true)
      
      try {
        const response = await fetch('/api/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.exists) {
            setEmailExists(true)
            setValidation(prev => ({
              ...prev,
              email: {
                valid: false,
                message: 'Ten email jest już zarejestrowany'
              }
            }))
          } else {
            setEmailExists(false)
            setValidation(prev => ({
              ...prev,
              email: { valid: true, message: '' }
            }))
          }
        } else {
          // Jeśli endpoint zwróci błąd, nie zmieniamy stanu - uznajemy, że nie wiemy
          console.error('Błąd z endpointu check-email:', await response.text())
        }
      } catch (error: any) {
        console.error('Błąd podczas sprawdzania emaila:', error)
        // W przypadku błędu sieciowego, nie zmieniamy statusu
      } finally {
        setCheckingEmail(false)
      }
    }

    // Debounce 800ms
    const timer = setTimeout(checkEmailExists, 800)
    
    return () => clearTimeout(timer)
  }, [formData.email])

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const newValidation = { ...validation }

    // Walidacja email
    if (!formData.email) {
      newValidation.email = { valid: false, message: 'Email jest wymagany' }
    } else if (!isValidEmail(formData.email)) {
      newValidation.email = { valid: false, message: 'Nieprawidłowy format email' }
    } else if (emailExists) {
      newValidation.email = { valid: false, message: 'Ten email jest już zarejestrowany' }
    } else {
      newValidation.email = { valid: true, message: '' }
    }

    // Walidacja hasła
    if (!formData.password) {
      newValidation.password = { valid: false, message: 'Hasło jest wymagane' }
    } else if (formData.password.length < 6) {
      newValidation.password = { valid: false, message: 'Hasło musi mieć co najmniej 6 znaków' }
    } else {
      newValidation.password = { valid: true, message: '' }
    }

    // Walidacja potwierdzenia hasła
    if (!formData.confirmPassword) {
      newValidation.confirmPassword = { valid: false, message: 'Potwierdzenie hasła jest wymagane' }
    } else if (formData.password !== formData.confirmPassword) {
      newValidation.confirmPassword = { valid: false, message: 'Hasła nie są identyczne' }
    } else {
      newValidation.confirmPassword = { valid: true, message: '' }
    }

    setValidation(newValidation)
  }

  const isFormValid = () => {
    return validation.email.valid && 
           validation.password.valid && 
           validation.confirmPassword.valid &&
           formData.email && 
           formData.password && 
           formData.confirmPassword &&
           !emailExists
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Walidacja przed wysłaniem
    validateForm()

    if (!isFormValid()) {
      setMessage({ 
        type: 'error', 
        text: 'Popraw błędy w formularzu przed wysłaniem' 
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            created_at: new Date().toISOString()
          }
        }
      })

      if (error) {
        // Sprawdź specyficzne błędy
        if (error.message.includes('User already registered') || 
            error.message.includes('already exists') ||
            error.message.toLowerCase().includes('already') ||
            error.message.includes('user_exists')) {
          setEmailExists(true)
          setValidation(prev => ({
            ...prev,
            email: {
              valid: false,
              message: 'Ten email jest już zarejestrowany'
            }
          }))
          throw new Error('EMAIL_EXISTS')
        }
        throw error
      }

      // Udało się - wyczyść formularz
      setMessage({
        type: 'success',
        text: 'Konto zostało utworzone! Sprawdź swoją skrzynkę pocztową i kliknij link aktywacyjny. Sprawdź też folder spam.'
      })

      // Reset formularza
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      })
      setEmailExists(false)

      // Auto-hide message after 15 seconds
      setTimeout(() => setMessage(null), 15000)

    } catch (error: any) {
      console.error('Błąd rejestracji:', error)
      
      let errorMessage = 'Nie udało się utworzyć konta'
      
      if (error.message === 'EMAIL_EXISTS') {
        errorMessage = 'Ten adres email jest już zarejestrowany. Użyj innego emaila lub skorzystaj z opcji resetowania hasła.'
      } else if (error.message.includes('password')) {
        errorMessage = 'Hasło jest zbyt słabe. Użyj co najmniej 6 znaków'
      } else if (error.message.includes('email')) {
        errorMessage = 'Nieprawidłowy adres email'
      } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
        errorMessage = 'Zbyt wiele prób rejestracji. Spróbuj za chwilę.'
      }

      setMessage({ 
        type: 'error', 
        text: errorMessage 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Resetuj stan istniejącego emaila przy zmianie
    if (field === 'email') {
      setEmailExists(false)
      setValidation(prev => ({
        ...prev,
        email: { valid: true, message: '' }
      }))
    }
  }

  return (
    <div className="py-8 px-4">
      <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 py-4">
        <div className="w-full max-w-md">
          {/* Karta formularza - teraz zawiera nagłówek wewnątrz */}
          <div className="rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-8">
            
            {/* Nagłówek "Rejestracja" wewnątrz karty */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-sky-50 mb-2">
                Rejestracja
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              {/* Pole Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    Adres email
                    {checkingEmail && (
                      <Loader2 className="ml-2 animate-spin text-slate-400" size={14} />
                    )}
                    {emailExists && !checkingEmail && (
                      <span className="ml-2 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Zajęty
                      </span>
                    )}
                    {formData.email && isValidEmail(formData.email) && !checkingEmail && !emailExists && (
                      <span className="ml-2 text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Dostępny
                      </span>
                    )}
                  </div>
                </label>
                <input
                  className={`w-full rounded-lg border px-4 py-3 text-sky-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    emailExists
                      ? 'border-red-500 bg-red-900/20 focus:border-red-400 focus:ring-red-400/20'
                      : checkingEmail
                      ? 'border-slate-600 bg-slate-900/70 focus:border-sky-400 focus:ring-sky-400/20'
                      : formData.email && isValidEmail(formData.email)
                      ? 'border-emerald-500/50 bg-slate-900/70 focus:border-emerald-400 focus:ring-emerald-400/20'
                      : 'border-slate-600 bg-slate-900/70 focus:border-sky-400 focus:ring-sky-400/20'
                  }`}
                  type="email"
                  placeholder=""
                  value={formData.email}
                  onChange={handleChange('email')}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
                {validation.email.message && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {validation.email.message}
                  </p>
                )}
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
                    className={`w-full rounded-lg border px-4 py-3 text-sky-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all pr-12 ${
                      validation.password.valid || !formData.password
                        ? 'border-slate-600 bg-slate-900/70 focus:border-sky-400 focus:ring-sky-400/20'
                        : 'border-red-500 bg-red-900/20 focus:border-red-400 focus:ring-red-400/20'
                    }`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder=""
                    value={formData.password}
                    onChange={handleChange('password')}
                    minLength={6}
                    required
                    disabled={loading}
                    autoComplete="new-password"
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
                
                {validation.password.message && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {validation.password.message}
                  </p>
                )}
              </div>

              {/* Pole Potwierdzenia Hasła */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Lock size={16} />
                    Hasło
                  </div>
                </label>
                <div className="relative">
                  <input
                    className={`w-full rounded-lg border px-4 py-3 text-sky-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all pr-12 ${
                      validation.confirmPassword.valid || !formData.confirmPassword
                        ? 'border-slate-600 bg-slate-900/70 focus:border-sky-400 focus:ring-sky-400/20'
                        : 'border-red-500 bg-red-900/20 focus:border-red-400 focus:ring-red-400/20'
                    }`}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder=""
                    value={formData.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    minLength={6}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors p-1"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {validation.confirmPassword.message && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {validation.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Komunikaty */}
              {message && (
                <div className={`rounded-lg p-4 ${message.type === 'success' ? 'bg-emerald-900/30 border border-emerald-800' : 'bg-red-900/30 border border-red-800'}`}>
                  <div className="flex items-start gap-3">
                    {message.type === 'success' ? (
                      <CheckCircle className="text-emerald-400 mt-0.5 flex-shrink-0" size={20} />
                    ) : (
                      <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={20} />
                    )}
                    <p className={`text-sm ${message.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                      {message.text}
                    </p>
                  </div>
                </div>
              )}

              {/* Przycisk submit */}
              <button
                className="w-full rounded-full bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.9)] transition-all hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_14px_35px_rgba(15,23,42,1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-sky-500 disabled:hover:to-sky-600 disabled:hover:shadow-[0_10px_25px_rgba(15,23,42,0.9)]"
                type="submit"
                disabled={!isFormValid() || loading || checkingEmail}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Tworzenie konta...
                  </span>
                ) : (
                  'Załóż konto'
                )}
              </button>
            </form>

            {/* Link do logowania */}
            <div className="mt-8 pt-6 border-t border-slate-700 text-center">
              <p className="text-slate-400 text-sm">
                Masz już konto?{' '}
                <Link
                  href="/auth/signin"
                  className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  Zaloguj się
                </Link>
              </p>
              {emailExists && (
                <p className="text-slate-400 text-sm mt-1">
                  Zapomniałeś hasła?{' '}
                  <Link
                    href="/auth/reset-password"
                    className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
                  >
                    Zresetuj hasło
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}