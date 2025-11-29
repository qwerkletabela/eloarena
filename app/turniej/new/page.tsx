// elo-arena/app/turniej/new/page.tsx
'use client'

import { redirect } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase/browser'
import { useEffect, useState } from 'react'
import AutoHide from '@/components/AutoHide'
import AddTurniej from '@/components/AddTurniej'

interface Miejsce {
  id: string
  nazwa: string
  miasto: string
  wojewodztwo: string | null
  adres: string | null
}

interface FormData {
  nazwa: string
  data_turnieju: string
  godzina_turnieju: string
  zakonczenie_turnieju: string
  gsheet_url: string
  arkusz_nazwa: string
  kolumna_nazwisk: string
  pierwszy_wiersz_z_nazwiskiem: number
  limit_graczy: string
  miejsce_id: string
}

export default function NewTurniejPage() {
  const [miejsca, setMiejsca] = useState<Miejsce[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    nazwa: '',
    data_turnieju: '',
    godzina_turnieju: '',
    zakonczenie_turnieju: '',
    gsheet_url: '',
    arkusz_nazwa: '',
    kolumna_nazwisk: '',
    pierwszy_wiersz_z_nazwiskiem: 2,
    limit_graczy: '',
    miejsce_id: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createSupabaseBrowser()

  useEffect(() => {
    // Pobierz miejsca
    const fetchMiejsca = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          redirect('/auth/signin')
          return
        }

        const { data: isAdmin } = await supabase.rpc('is_admin')
        if (!isAdmin) {
          redirect('/')
          return
        }

        const { data: miejscaData, error } = await supabase
          .from('miejsce_turnieju')
          .select('id, nazwa, miasto, wojewodztwo, adres')
          .order('nazwa', { ascending: true })

        if (error) {
          console.error('Error fetching miejsca:', error)
        } else {
          setMiejsca(miejscaData || [])
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMiejsca()
  }, [supabase])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Walidacja pól wymaganych
    if (!formData.nazwa || !formData.data_turnieju || !formData.godzina_turnieju || !formData.miejsce_id) {
      setError('Wypełnij wszystkie wymagane pola')
      return
    }
    
    setError(null)
    setShowConfirmModal(true)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('nazwa', formData.nazwa)
      formDataToSend.append('data_turnieju', formData.data_turnieju)
      formDataToSend.append('godzina_turnieju', formData.godzina_turnieju)
      formDataToSend.append('zakonczenie_turnieju', formData.zakonczenie_turnieju)
      formDataToSend.append('gsheet_url', formData.gsheet_url)
      formDataToSend.append('arkusz_nazwa', formData.arkusz_nazwa)
      formDataToSend.append('kolumna_nazwisk', formData.kolumna_nazwisk)
      formDataToSend.append('pierwszy_wiersz_z_nazwiskiem', formData.pierwszy_wiersz_z_nazwiskiem.toString())
      formDataToSend.append('limit_graczy', formData.limit_graczy)
      formDataToSend.append('miejsce_id', formData.miejsce_id)

      const response = await fetch('/turniej/create', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        // Przekieruj na stronę admina z komunikatem sukcesu
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

  const getErrorMessage = (errorCode: string | null) => {
    const errorMessages: { [key: string]: string } = {
      invalid_input: 'Nieprawidłowe dane formularza.',
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

  const getMiejsceNazwa = () => {
    const miejsce = miejsca.find(m => m.id === formData.miejsce_id)
    return miejsce ? `${miejsce.nazwa} - ${miejsce.miasto}` : ''
  }

  if (isLoading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 bg-slate-900">
        <div className="w-full max-w-2xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 text-center">
          <div className="text-sky-100">Ładowanie...</div>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 bg-slate-900">
        <div className="w-full max-w-2xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-6">
          <h1 className="text-2xl font-semibold text-sky-50">Dodaj turniej</h1>

          {error && (
            <AutoHide>
              <div className="rounded-md border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            </AutoHide>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nazwa turnieju */}
            <div>
              <label className="block text-sm font-medium text-sky-100">Nazwa turnieju *</label>
              <input 
                name="nazwa" 
                required 
                value={formData.nazwa}
                onChange={handleInputChange}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                placeholder="np. ELO Arena Open" 
              />
            </div>

            {/* Data i godziny */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-sky-100">Data turnieju *</label>
                <input 
                  type="date" 
                  name="data_turnieju" 
                  required 
                  value={formData.data_turnieju}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-100">Godzina startu *</label>
                <input 
                  type="time" 
                  name="godzina_turnieju" 
                  required 
                  value={formData.godzina_turnieju}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-100">Godzina zakończenia</label>
                <input 
                  type="time" 
                  name="zakonczenie_turnieju" 
                  value={formData.zakonczenie_turnieju}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                />
              </div>
            </div>

            {/* Miejsce turnieju */}
            <div>
              <label className="block text-sm font-medium text-sky-100">Miejsce turnieju *</label>
              <select 
                name="miejsce_id" 
                required
                value={formData.miejsce_id}
                onChange={handleInputChange}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="">— wybierz miejsce turnieju —</option>
                {miejsca.map((miejsce) => (
                  <option key={miejsce.id} value={miejsce.id}>
                    {miejsce.nazwa} - {miejsce.miasto}
                    {miejsce.wojewodztwo && `, ${miejsce.wojewodztwo}`}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex justify-between items-center">
                <p className="text-xs text-slate-400">
                  Jeśli nie ma odpowiedniego miejsca, dodaj je najpierw w panelu administracyjnym.
                </p>
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

            {/* Arkusz Google */}
            <div>
              <label className="block text-sm font-medium text-sky-100">Link do arkusza Google (opcjonalnie)</label>
              <input 
                name="gsheet_url" 
                value={formData.gsheet_url}
                onChange={handleInputChange}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                placeholder="https://docs.google.com/spreadsheets/d/..." 
              />
              <p className="mt-1 text-xs text-slate-400">ID arkusza wyciągniemy automatycznie.</p>
            </div>

            {/* Szczegóły arkusza */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-sky-100">Nazwa karty (opcjonalnie)</label>
                <input 
                  name="arkusz_nazwa" 
                  value={formData.arkusz_nazwa}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                  placeholder="np. Lista" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-100">Kolumna nazwisk</label>
                <input 
                  name="kolumna_nazwisk" 
                  value={formData.kolumna_nazwisk}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                  placeholder="np. B" 
                  maxLength={2} 
                />
                <p className="mt-1 text-xs text-slate-400">Jedna litera A-Z.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-100">Pierwszy wiersz z nazwiskiem</label>
                <input 
                  type="number" 
                  name="pierwszy_wiersz_z_nazwiskiem" 
                  min={1} 
                  value={formData.pierwszy_wiersz_z_nazwiskiem}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                />
              </div>
            </div>

            {/* Limit graczy */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-sky-100">Limit graczy (opcjonalnie)</label>
                <input 
                  type="number" 
                  name="limit_graczy" 
                  min={1} 
                  value={formData.limit_graczy}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                />
              </div>
            </div>

            {/* Przyciski akcji */}
            <div className="flex gap-2 pt-4">
              <button 
                className="rounded-full bg-sky-600 hover:bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Zapisywanie...' : 'Utwórz turniej'}
              </button>
              <a 
                href="/admin" 
                className="rounded-full border border-slate-600 bg-slate-700 hover:bg-slate-600 px-6 py-2 text-sm font-semibold text-sky-100 transition"
              >
                Anuluj
              </a>
            </div>
          </form>
        </div>
      </main>

      {/* Modal potwierdzenia - pokazuje się PRZED zapisem do bazy */}
      <AddTurniej
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
        nazwa={formData.nazwa}
        data={formData.data_turnieju}
        miejsce={getMiejsceNazwa()}
      />
    </>
  )
}