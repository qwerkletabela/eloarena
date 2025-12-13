// components/MiejsceForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

const WOJEWODZTWA = [
  'dolnośląskie',
  'kujawsko-pomorskie',
  'lubelskie',
  'lubuskie',
  'łódzkie',
  'małopolskie',
  'mazowieckie',
  'opolskie',
  'podkarpackie',
  'podlaskie',
  'pomorskie',
  'śląskie',
  'świętokrzyskie',
  'warmińsko-mazurskie',
  'wielkopolskie',
  'zachodniopomorskie',
]

type Miejsce = {
  id?: string
  nazwa: string
  miasto: string
  wojewodztwo: string | null
  adres: string | null
  latitude: number | null
  longitude: number | null
  created_by?: string | null
  updated_by?: string | null
}

type Props = {
  mode: 'new' | 'edit'
  initial: Miejsce | null
}

// Modal błędu dla formularza
const ErrorModal = ({ 
  isOpen, 
  title, 
  message, 
  onClose 
}: { 
  isOpen: boolean; 
  title: string; 
  message: string; 
  onClose: () => void 
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-red-600 shadow-2xl transform transition-all">
        {/* Nagłówek */}
        <div className="flex items-center gap-3 border-b border-red-600 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-100">{title}</h3>
            <p className="text-sm text-red-300">Wystąpił błąd</p>
          </div>
        </div>

        {/* Treść */}
        <div className="px-6 py-4">
          <p className="text-slate-200 whitespace-pre-line">{message}</p>
        </div>

        {/* Przycisk */}
        <div className="flex justify-end border-t border-red-600 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-full bg-red-600 hover:bg-red-500 px-6 py-2 text-sm font-medium text-white transition"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MiejsceForm({ mode, initial }: Props) {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [nazwa, setNazwa] = useState(initial?.nazwa ?? '')
  const [miasto, setMiasto] = useState(initial?.miasto ?? '')
  const [wojewodztwo, setWojewodztwo] = useState(initial?.wojewodztwo ?? '')
  const [adres, setAdres] = useState(initial?.adres ?? '')
  const [latitude, setLatitude] = useState<number | null>(initial?.latitude ?? null)
  const [longitude, setLongitude] = useState<number | null>(initial?.longitude ?? null)
  const [coordinatesInput, setCoordinatesInput] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorModalDetails, setErrorModalDetails] = useState({
    title: '',
    message: ''
  })

  // Pobierz aktualnego użytkownika (UUID)
  useEffect(() => {
    async function getCurrentUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
        } else {
          router.push('/auth/signin')
        }
      } catch (err) {
        console.error('Błąd podczas pobierania użytkownika:', err)
        setErrorModalDetails({
          title: 'Błąd autoryzacji',
          message: 'Nie udało się pobrać informacji o użytkowniku'
        })
        setShowErrorModal(true)
      }
    }
    
    getCurrentUser()
  }, [router])

  // Funkcja do parsowania wklejonych współrzędnych
  const handleCoordinatesPaste = () => {
    if (!coordinatesInput.trim()) return
    
    try {
      const cleanInput = coordinatesInput
        .replace(/[()"']/g, '') // usuń nawiasy i cudzysłowy
        .replace(/\s+/g, ' ') // zamień wiele spacji na jedną
        .trim()
      
      // Spróbuj rozpoznać różne formaty separatorów
      const separators = /[,;\s\t]+/
      const parts = cleanInput.split(separators).filter(part => part.trim() !== '')
      
      if (parts.length !== 2) {
        setErrorModalDetails({
          title: 'Błąd współrzędnych',
          message: 'Proszę podać dokładnie dwie współrzędne oddzielone przecinkiem, spacją lub średnikiem'
        })
        setShowErrorModal(true)
        return
      }
      
      // Zamień przecinki na kropki dla poprawnego parsowania
      const lat = parseFloat(parts[0].replace(',', '.'))
      const lng = parseFloat(parts[1].replace(',', '.'))
      
      if (isNaN(lat) || isNaN(lng)) {
        setErrorModalDetails({
          title: 'Błąd współrzędnych',
          message: 'Nieprawidłowy format współrzędnych. Upewnij się, że podałeś liczby'
        })
        setShowErrorModal(true)
        return
      }
      
      // Sprawdź tylko jeśli obie współrzędne są podane
      if (lat !== null && lng !== null) {
        if (lat < 49.0 || lat > 54.9 || lng < 14.0 || lng > 24.2) {
          setErrorModalDetails({
            title: 'Błąd współrzędnych',
            message: 'Współrzędne znajdują się poza obszarem Polski. Czy na pewno są poprawne?'
          })
          setShowErrorModal(true)
          return
        }
      }
      
      setLatitude(lat)
      setLongitude(lng)
      setCoordinatesInput('')
      setError(null)
    } catch (err) {
      setErrorModalDetails({
        title: 'Błąd przetwarzania',
        message: 'Wystąpił błąd podczas przetwarzania współrzędnych'
      })
      setShowErrorModal(true)
    }
  }

  function resetForm() {
    setNazwa('')
    setMiasto('')
    setWojewodztwo('')
    setAdres('')
    setLatitude(null)
    setLongitude(null)
    setCoordinatesInput('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!currentUserId) {
      setErrorModalDetails({
        title: 'Błąd autoryzacji',
        message: 'Musisz być zalogowany, aby zapisać miejsce'
      })
      setShowErrorModal(true)
      return
    }
    
    // Walidacja podstawowych pól
    if (!nazwa.trim() || !miasto.trim()) {
      setErrorModalDetails({
        title: 'Błąd walidacji',
        message: 'Wypełnij wszystkie wymagane pola (nazwa i miasto)'
      })
      setShowErrorModal(true)
      return
    }
    
    // Walidacja współrzędnych - tylko jeśli są podane
    if ((latitude !== null && longitude === null) || (latitude === null && longitude !== null)) {
      setErrorModalDetails({
        title: 'Błąd współrzędnych',
        message: 'Proszę podać obie współrzędne geograficzne lub pozostawić oba pola puste'
      })
      setShowErrorModal(true)
      return
    }
    
    // Walidacja wartości współrzędnych, jeśli obie są podane
    if (latitude !== null && longitude !== null) {
      if (isNaN(latitude) || isNaN(longitude)) {
        setErrorModalDetails({
          title: 'Błąd współrzędnych',
          message: 'Współrzędne muszą być prawidłowymi liczbami'
        })
        setShowErrorModal(true)
        return
      }
      
      // Sprawdź czy współrzędne są w Polsce (tylko jeśli obie są podane)
      if (latitude < 49.0 || latitude > 54.9 || longitude < 14.0 || longitude > 24.2) {
        setErrorModalDetails({
          title: 'Błąd współrzędnych',
          message: 'Współrzędne znajdują się poza obszarem Polski. Czy na pewno są poprawne?'
        })
        setShowErrorModal(true)
        return
      }
    }
    
    setSaving(true)
    setError(null)

    const payload: any = {
      nazwa: nazwa.trim(),
      miasto: miasto.trim(),
      wojewodztwo: wojewodztwo?.trim() || null,
      adres: adres?.trim() || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    }

    try {
      // Dla nowego miejsca dodaj UUID użytkownika
      if (mode === 'new') {
        payload.created_by = currentUserId
      } 
      // Dla edycji dodaj UUID użytkownika
      else {
        payload.updated_by = currentUserId
        payload.updated_at = new Date().toISOString()
      }

      const table = supabase.from('miejsce_turnieju')
      let resp
      
      if (mode === 'new') {
        resp = await table.insert(payload)
      } else {
        resp = await table.update(payload).eq('id', initial!.id)
      }

      if (resp.error) {
        console.error('Błąd zapisu:', resp.error)
        setErrorModalDetails({
          title: 'Błąd zapisu',
          message: resp.error.message || 'Nie udało się zapisać miejsca turnieju.'
        })
        setShowErrorModal(true)
        setSaving(false)
        return
      }

      // Sukces - różne zachowanie dla trybu new/edit
      if (mode === 'new') {
        // Najpierw resetuj formularz
        resetForm()
        // Potem pokaż modal sukcesu
        setShowSuccessModal(true)
      } else {
        // Dla edycji przekieruj na listę
        router.push('/admin/miejsca')
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      setErrorModalDetails({
        title: 'Nieoczekiwany błąd',
        message: 'Wystąpił nieoczekiwany błąd podczas zapisywania.'
      })
      setShowErrorModal(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-700 bg-slate-800/95 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.8)]"
      >
        <h1 className="mb-2 text-2xl font-semibold text-sky-50">
          {mode === 'new' ? 'Dodaj miejsce turnieju' : 'Edytuj miejsce turnieju'}
        </h1>
        <p className="text-sm text-slate-400">
          Zdefiniuj lokalizację, która może być wykorzystywana przez wiele turniejów.
        </p>

        {/* Komunikat błędu inline (jeśli nie użyjemy modala) */}
        {error && (
          <div className="rounded-md border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Nazwa */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-100">
            Nazwa miejsca *
          </label>
          <input
            className="w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-sky-50"
            value={nazwa}
            onChange={(e) => setNazwa(e.target.value)}
            placeholder="np. SP 5 w Poznaniu, Klub X"
            required
          />
        </div>

        {/* Miasto + województwo */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-100">
              Miasto *
            </label>
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-sky-50"
              value={miasto}
              onChange={(e) => setMiasto(e.target.value)}
              placeholder="np. Poznań"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-100">
              Województwo
            </label>
            <select
              className="w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-sky-50"
              value={wojewodztwo ?? ''}
              onChange={(e) => setWojewodztwo(e.target.value)}
            >
              <option value="">— wybierz województwo (opcjonalne) —</option>
              {WOJEWODZTWA.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Adres */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-100">
            Adres (opcjonalnie)
          </label>
          <textarea
            className="w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-sky-50"
            rows={2}
            value={adres ?? ''}
            onChange={(e) => setAdres(e.target.value)}
            placeholder="np. ul. Szkolna 10, 60-123 Poznań"
          />
        </div>

        {/* Współrzędne - OPcjonalne */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-sky-100">
              Współrzędne geograficzne (opcjonalnie)
            </h2>
            <span className="text-xs text-slate-400">
              wprowadź ręcznie lub wklej współrzędne
            </span>
          </div>

          {/* Pole do wklejania współrzędnych */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">
              Wklej współrzędne (szerokość, długość)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-sky-50"
                value={coordinatesInput}
                onChange={(e) => setCoordinatesInput(e.target.value)}
                placeholder="np. 52.2297, 21.0122"
              />
              <button
                type="button"
                onClick={handleCoordinatesPaste}
                className="rounded bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-medium text-white transition"
              >
                Zastosuj
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Wklej współrzędne w formacie "szerokość, długość" - automatycznie zostaną przypisane do pól poniżej
            </p>
          </div>

          {/* Inputy tekstowe do ręcznego wprowadzania współrzędnych */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">
                Szerokość geograficzna (latitude)
              </label>
              <input
                id="latitude-input"
                type="text"
                inputMode="decimal"
                pattern="-?\d*\.?\d*"
                className="w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-sky-50"
                value={latitude ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Walidacja: tylko liczby, kropka, minus
                  if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                    setLatitude(value ? parseFloat(value) : null);
                  }
                }}
                placeholder="np. 52.2297"
              />
              {latitude !== null && (latitude < 49.0 || latitude > 54.9) && (
                <p className="text-xs text-red-400 mt-1">
                  Szerokość geograficzna Polski: 49° - 54.9°
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">
                Długość geograficzna (longitude)
              </label>
              <input
                id="longitude-input"
                type="text"
                inputMode="decimal"
                pattern="-?\d*\.?\d*"
                className="w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-sky-50"
                value={longitude ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Walidacja: tylko liczby, kropka, minus
                  if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                    setLongitude(value ? parseFloat(value) : null);
                  }
                }}
                placeholder="np. 21.0122"
              />
              {longitude !== null && (longitude < 14.0 || longitude > 24.2) && (
                <p className="text-xs text-red-400 mt-1">
                  Długość geograficzna Polski: 14° - 24.2°
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-400 space-y-1">
            <p>Wprowadź współrzędne ręcznie lub wklej je w powyższym polu.</p>
            <p className="text-amber-300">
              * Współrzędne są opcjonalne. Jeśli podajesz obie, muszą znajdować się w granicach Polski (49°-54.9°N, 14°-24.2°E)
            </p>
            <p className="text-slate-400">
              Uwaga: Aby współrzędne były zapisane, muszą być podane obie wartości lub żadna.
            </p>
          </div>
        </div>

        {/* Przyciski */}
        <div className="flex justify-between gap-3 pt-4">
          <div className="flex gap-3">
            {mode === 'new' && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-full border border-slate-500 px-5 py-2 text-sm text-slate-100 hover:bg-slate-700/60 disabled:opacity-50"
              >
                Wyczyść formularz
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              className="rounded-full border border-slate-500 px-5 py-2 text-sm text-slate-100 hover:bg-slate-700/60"
              onClick={() => router.push('/admin/miejsca')}
              disabled={saving}
            >
              {mode === 'new' ? 'Wróć do listy' : 'Anuluj'}
            </button>
            <button
              type="submit"
              disabled={saving || !currentUserId}
              className="rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
            >
              {saving
                ? 'Zapisywanie...'
                : mode === 'new'
                ? 'Dodaj miejsce'
                : 'Zapisz zmiany'}
            </button>
          </div>
        </div>
      </form>

      {/* Modal sukcesu dla dodania miejsca */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-green-600 shadow-2xl transform transition-all">
            {/* Nagłówek */}
            <div className="flex items-center gap-3 border-b border-green-600 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-100">Sukces!</h3>
                <p className="text-sm text-green-300">Miejsce zostało dodane</p>
              </div>
            </div>

            {/* Treść */}
            <div className="px-6 py-4">
              <p className="text-slate-200 mb-4">Miejsce zostało pomyślnie dodane do bazy danych.</p>
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-700/50 rounded-lg px-3 py-2">
                <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Możesz teraz dodać kolejne miejsce lub wrócić do listy</span>
              </div>
            </div>

            {/* Przyciski */}
            <div className="flex justify-end gap-3 border-t border-green-600 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false)
                  router.push('/admin/miejsca')
                }}
                className="rounded-full border border-slate-500 bg-slate-700 hover:bg-slate-600 px-6 py-2 text-sm font-medium text-sky-100 transition"
              >
                Wróć do listy
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="rounded-full bg-green-600 hover:bg-green-500 px-6 py-2 text-sm font-medium text-white transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal błędu dla formularza */}
      {showErrorModal && (
        <ErrorModal
          isOpen={showErrorModal}
          title={errorModalDetails.title}
          message={errorModalDetails.message}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </>
  )
}