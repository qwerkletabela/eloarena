// components/MiejsceForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import MapPicker from '@/components/MapPicker'

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
  latitude: number
  longitude: number
}

type Props = {
  mode: 'new' | 'edit'
  initial: Miejsce | null
}

export default function MiejsceForm({ mode, initial }: Props) {
  const router = useRouter()

  const [nazwa, setNazwa] = useState(initial?.nazwa ?? '')
  const [miasto, setMiasto] = useState(initial?.miasto ?? '')
  const [wojewodztwo, setWojewodztwo] = useState(initial?.wojewodztwo ?? '')
  const [adres, setAdres] = useState(initial?.adres ?? '')
  const [latitude, setLatitude] = useState(
    initial?.latitude ?? 52.0 // domyślnie środek PL
  )
  const [longitude, setLongitude] = useState(
    initial?.longitude ?? 19.0
  )
  const [coordinatesInput, setCoordinatesInput] = useState('') // DODANE: stan dla pola współrzędnych

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Funkcja do aktualizacji współrzędnych z MapPicker
  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
  }

  // DODANE: Funkcja do parsowania wklejonych współrzędnych
  const handleCoordinatesPaste = () => {
    if (!coordinatesInput.trim()) return
    
    try {
      // Usuń wszystkie nawiasy, cudzysłowy i nadmiarowe spacje
      const cleanInput = coordinatesInput
        .replace(/[()"']/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      
      // Podziel na części po przecinku
      const parts = cleanInput.split(',').map(part => part.trim())
      
      if (parts.length !== 2) {
        setError('Proszę podać dokładnie dwie współrzędne oddzielone przecinkiem (szerokość, długość)')
        return
      }
      
      const lat = parseFloat(parts[0])
      const lng = parseFloat(parts[1])
      
      if (isNaN(lat) || isNaN(lng)) {
        setError('Nieprawidłowy format współrzędnych. Upewnij się, że podałeś liczby')
        return
      }
      
      // Sprawdź zakresy współrzędnych (przybliżone dla Polski)
      if (lat < 49.0 || lat > 54.9 || lng < 14.0 || lng > 24.2) {
        setError('Współrzędne znajdują się poza obszarem Polski. Czy na pewno są poprawne?')
        return
      }
      
      setLatitude(lat)
      setLongitude(lng)
      setCoordinatesInput('') // Wyczyść pole po sukcesie
      setError(null)
    } catch (err) {
      setError('Wystąpił błąd podczas przetwarzania współrzędnych')
    }
  }

  function resetForm() {
    setNazwa('')
    setMiasto('')
    setWojewodztwo('')
    setAdres('')
    setLatitude(52.0)
    setLongitude(19.0)
    setCoordinatesInput('') // DODANE: wyczyść też pole współrzędnych
    setError(null)
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const payload = {
      nazwa,
      miasto,
      wojewodztwo: wojewodztwo || null,
      adres: adres || null,
      latitude,
      longitude,
    }

    try {
      const table = supabase.from('miejsce_turnieju')
      let resp
      
      if (mode === 'new') {
        resp = await table.insert(payload)
      } else {
        resp = await table.update(payload).eq('id', initial!.id)
      }

      if (resp.error) {
        console.error(resp.error)
        setError('Nie udało się zapisać miejsca turnieju.')
        setSaving(false)
        return
      }

      // Sukces - różne zachowanie dla trybu new/edit
      if (mode === 'new') {
        setSuccess(true)
        resetForm() // Resetuj formularz dla nowego wpisu
      } else {
        router.push('/admin/miejsca')
      }
    } catch (err: any) {
      console.error(err)
      setError('Wystąpił nieoczekiwany błąd podczas zapisywania.')
    } finally {
      setSaving(false)
    }
  }

  return (
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

      {/* Komunikat sukcesu */}
      {success && (
        <div className="rounded-md border border-green-400/50 bg-green-500/10 px-4 py-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-200">
                Miejsce zostało pomyślnie dodane!
              </p>
              <p className="mt-1 text-sm text-green-300">
                Możesz dodać kolejne miejsce poniżej.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="inline-flex rounded-md bg-green-500/10 p-1.5 text-green-400 hover:bg-green-500/20"
                >
                  <span className="sr-only">Zamknij</span>
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Komunikat błędu */}
      {error && (
        <div className="rounded-md border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Nazwa */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-100">
          Nazwa miejsca
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
            Miasto
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

      {/* Współrzędne + MAPA */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-sky-100">
            Współrzędne geograficzne
          </h2>
          <span className="text-xs text-slate-400">
            kliknij na mapie albo popraw ręcznie
          </span>
        </div>

        {/* DODANE: Pole do wklejania współrzędnych */}
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
              placeholder="np. 50.0655081342395, 19.92542285490674"
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

        {/* MapPicker – klikanie ustawia latitude/longitude */}
        <div className="h-64 w-full overflow-hidden rounded-lg border border-slate-700">
          <div className="h-full w-full flex items-center justify-center bg-slate-800">
            <MapPicker
              targetLatId="latitude-input"
              targetLngId="longitude-input"
              lat={latitude}
              lng={longitude}
              buttonLabel="Wybierz na mapie"
              onLocationChange={handleLocationChange}
            />
          </div>
        </div>

        {/* Inputs liczbowy jako podgląd / ręczna korekta */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Szerokość geograficzna (latitude)
            </label>
            <input
              id="latitude-input"
              type="number"
              step="0.000001"
              className="w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-sky-50"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Długość geograficzna (longitude)
            </label>
            <input
              id="longitude-input"
              type="number"
              step="0.000001"
              className="w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-sky-50"
              value={longitude}
              onChange={(e) => setLongitude(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Kliknięcie na mapie przeniesie pinezkę i zaktualizuje pola ze współrzędnymi.
        </p>
      </div>

      {/* Przyciski */}
      <div className="flex justify-between gap-3 pt-4">
        <div className="flex gap-3">
          {mode === 'new' && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-500 px-5 py-2 text-sm text-slate-100 hover:bg-slate-700/60"
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
          >
            {mode === 'new' ? 'Wróć do listy' : 'Anuluj'}
          </button>
          <button
            type="submit"
            disabled={saving}
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
  )
}