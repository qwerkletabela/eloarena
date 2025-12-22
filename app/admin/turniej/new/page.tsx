'use client'

import { redirect } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase/browser'
import { useEffect, useState } from 'react'
import {
  MapPin,
  Clock,
  CalendarDays,
  Trophy,
  Dices,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import AutoHide from '@/components/AutoHide'
import AddTurniej from '@/components/AddTurniej'

interface Miejsce {
  id: string
  nazwa: string
  miasto: string
  wojewodztwo: string | null
  adres: string | null
}

interface FormDataState {
  nazwa: string
  gra: string
  data_turnieju: string
  godzina_turnieju: string
  zakonczenie_turnieju: string
  gsheet_url: string
  arkusz_nazwa: string
  kolumna_nazwisk: string
  pierwszy_wiersz_z_nazwiskiem: string
  limit_graczy: string
  miejsce_id: string
}

type Role = 'admin' | 'organizer' | string

export default function NewTurniejPage() {
  const [miejsca, setMiejsca] = useState<Miejsce[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [formData, setFormData] = useState<FormDataState>({
    nazwa: '',
    gra: '',
    data_turnieju: '',
    godzina_turnieju: '',
    zakonczenie_turnieju: '',
    gsheet_url: '',
    arkusz_nazwa: '',
    kolumna_nazwisk: '',
    pierwszy_wiersz_z_nazwiskiem: '',
    limit_graczy: '',
    miejsce_id: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createSupabaseBrowser()

  useEffect(() => {
    const fetchMiejsca = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          redirect('/auth/signin')
          return
        }

        // ✅ 1) Spróbuj pobrać rolę z profiles.role
        let role: Role | null = null

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (!profileError && profile?.role) {
          role = profile.role
        }

        // ✅ 2) Fallback: jeśli nie ma profiles albo nie ma roli, spróbuj users.ranga
        if (!role) {
          const { data: urow, error: uerr } = await supabase
            .from('users')
            .select('ranga')
            .eq('id', user.id)
            .maybeSingle()

          if (!uerr && urow?.ranga) {
            role = urow.ranga
          }
        }

        // ✅ 3) Autoryzacja: admin lub organizer
        const allowed = role === 'admin' || role === 'organizer'
        if (!allowed) {
          // jak chcesz debug:
          // console.log('Access denied. role=', role, 'user=', user.id)
          redirect('/')
          return
        }

        const { data: miejscaData, error: miejscaError } = await supabase
          .from('miejsce_turnieju')
          .select('id, nazwa, miasto, wojewodztwo, adres')
          .order('nazwa', { ascending: true })

        if (miejscaError) {
          console.error('Error fetching miejsca:', miejscaError)
          setError('Nie udało się pobrać listy miejsc.')
        } else {
          setMiejsca(miejscaData || [])
        }
      } catch (err) {
        console.error('Error:', err)
        setError('Wystąpił błąd podczas ładowania danych.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMiejsca()
  }, [supabase])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.nazwa ||
      !formData.gra ||
      !formData.data_turnieju ||
      !formData.godzina_turnieju ||
      !formData.miejsce_id
    ) {
      setError('Wypełnij wszystkie wymagane pola')
      return
    }

    setError(null)
    setShowConfirmModal(true)
  }

  const getErrorMessage = (errorCode: string | null) => {
    const errorMessages: { [key: string]: string } = {
      invalid_input: 'Nieprawidłowe dane formularza.',
      game_required: 'Wybierz grę / wariant.',
      date_time_required: 'Podaj datę i godzinę wydarzenia.',
      sheet_col_invalid: 'Kolumna nazwisk musi być literą (A–Z).',
      number_invalid: 'Nieprawidłowa wartość liczbowa.',
      url_invalid: 'Link musi zaczynać się od http(s)://',
      location_required: 'Wybierz miejsce turnieju.',
      invalid_location_id: 'Nieprawidłowy identyfikator miejsca.',
      location_not_found: 'Wybrane miejsce nie istnieje.',
      database_error: 'Błąd bazy danych podczas zapisywania.',
    }
    return errorMessages[errorCode || ''] || 'Nie udało się zapisać.'
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('nazwa', formData.nazwa)
      fd.append('gra', formData.gra)
      fd.append('data_turnieju', formData.data_turnieju)
      fd.append('godzina_turnieju', formData.godzina_turnieju)
      fd.append('zakonczenie_turnieju', formData.zakonczenie_turnieju)
      fd.append('gsheet_url', formData.gsheet_url)
      fd.append('arkusz_nazwa', formData.arkusz_nazwa)
      fd.append('kolumna_nazwisk', formData.kolumna_nazwisk)
      fd.append('pierwszy_wiersz_z_nazwiskiem', formData.pierwszy_wiersz_z_nazwiskiem)
      fd.append('limit_graczy', formData.limit_graczy)
      fd.append('miejsce_id', formData.miejsce_id)

      const response = await fetch('/admin/turniej/create', {
        method: 'POST',
        body: fd,
      })

      if (response.ok) {
        window.location.href = '/admin?ok=1'
      } else {
        const url = new URL(response.url)
        const errorParam = url.searchParams.get('e')
        setError(getErrorMessage(errorParam))
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Wystąpił błąd podczas zapisywania turnieju')
    } finally {
      setIsSubmitting(false)
      setShowConfirmModal(false)
    }
  }

  const getMiejsceNazwa = () => {
    const miejsce = miejsca.find((m) => m.id === formData.miejsce_id)
    return miejsce ? `${miejsce.nazwa} - ${miejsce.miasto}` : ''
  }

  if (isLoading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 text-center">
          <div className="text-sky-100">Ładowanie...</div>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-8 py-16">
        <div className="w-full max-w-2xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-6">
          <h1 className="text-4xl font-bold text-sky-50 mb-2 text-center">
            Dodaj turniej
          </h1>

          {error && (
            <AutoHide>
              <div className="rounded-md border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            </AutoHide>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-sky-100">
                <Trophy size={18} />
                <span>Nazwa turnieju:</span>
              </label>
              <input
                name="nazwa"
                required
                value={formData.nazwa}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder=""
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-sky-100">
                <Dices size={18} />
                <span>Gra / wariant</span>
              </label>

              <select
                name="gra"
                required
                value={formData.gra}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="">— wybierz z listy —</option>
                <option value="rummikub_standard">Rummikub – Standard</option>
                <option value="rummikub_twist">Rummikub – Twist</option>
                <option value="rummikub_duel">Rummikub – Pojedynek</option>
                <option value="rummikub_expert">Rummikub – Expert</option>
                <option value="qwirkle">Qwirkle</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-sky-100">
                  <CalendarDays size={18} />
                  <span>Data turnieju:</span>
                </label>
                <input
                  type="date"
                  name="data_turnieju"
                  required
                  value={formData.data_turnieju}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-sky-100">
                  <Clock size={18} />
                  <span>Godzina rozpoczęcia:</span>
                </label>
                <input
                  type="time"
                  name="godzina_turnieju"
                  required
                  value={formData.godzina_turnieju}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-sky-100">
                  <Clock size={18} />
                  <span>Godzina zakończenia: *</span>
                </label>

                <input
                  type="time"
                  name="zakonczenie_turnieju"
                  value={formData.zakonczenie_turnieju}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-sky-100">
                <MapPin size={18} />
                <span>Miejsce turnieju *</span>
              </label>

              <select
                name="miejsce_id"
                required
                value={formData.miejsce_id}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="">— wybierz z listy —</option>
                {miejsca.map((miejsce) => (
                  <option key={miejsce.id} value={miejsce.id}>
                    {miejsce.nazwa} - {miejsce.miasto}
                    {miejsce.wojewodztwo && `, ${miejsce.wojewodztwo}`}
                  </option>
                ))}
              </select>

              <div className="mt-2 flex justify-end items-center">
                <a
                  href="/admin/miejsca/new"
                  className="text-xs text-sky-400 hover:text-sky-300 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Dodaj nowe miejsce →
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowMoreDetails((v) => !v)}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sky-100 hover:bg-slate-900/70 transition"
              >
                <span className="text-sm font-semibold">Więcej szczegółów</span>
                {showMoreDetails ? (
                  <ChevronUp className="h-5 w-5 text-slate-300" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-300" />
                )}
              </button>

              {showMoreDetails && (
                <div className="mt-3 space-y-5 rounded-2xl border border-slate-700 bg-slate-900/30 p-4">
                  <div>
                    <label className="block text-sm font-medium text-sky-100">
                      Link do arkusza Google (opcjonalnie)
                    </label>
                    <input
                      name="gsheet_url"
                      value={formData.gsheet_url}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-sky-100">
                        Nazwa karty (opcjonalnie)
                      </label>
                      <input
                        name="arkusz_nazwa"
                        value={formData.arkusz_nazwa}
                        onChange={handleInputChange}
                        className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        placeholder=""
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-sky-100">
                        Kolumna z nazwiskami
                      </label>
                      <input
                        name="kolumna_nazwisk"
                        value={formData.kolumna_nazwisk}
                        onChange={handleInputChange}
                        className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        placeholder=""
                        maxLength={2}
                      />
                      <p className="mt-1 text-xs text-slate-400">Jedna litera A-Z.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-sky-100">
                        Pierwszy wiersz z nazwiskiem
                      </label>
                      <input
                        name="pierwszy_wiersz_z_nazwiskiem"
                        min={1}
                        value={formData.pierwszy_wiersz_z_nazwiskiem}
                        onChange={handleInputChange}
                        className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-sky-100">
                        Limit graczy (opcjonalnie)
                      </label>
                      <input
                        name="limit_graczy"
                        min={1}
                        value={formData.limit_graczy}
                        onChange={handleInputChange}
                        className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                className="w-full rounded-full bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.9)] transition-all hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_14px_35px_rgba(15,23,42,1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Zapisywanie...' : 'Utwórz turniej'}
              </button>

              <a
                href="/admin"
                className="w-full rounded-full bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.9)] transition-all hover:from-red-400 hover:to-red-500 hover:shadow-[0_14px_35px_rgba(15,23,42,1)] active:scale-[0.98] text-center"
              >
                Anuluj
              </a>
            </div>
          </form>
        </div>
      </main>

      <AddTurniej
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
        nazwa={formData.nazwa}
        gra={formData.gra}
        data={formData.data_turnieju}
        miejsce={getMiejsceNazwa()}
      />
    </>
  )
}
