'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  targetLatId: string
  targetLngId: string
  lat?: number | null
  lng?: number | null
  buttonLabel?: string
}

function mapsReady() {
  return typeof window !== 'undefined' && !!(window as any).google?.maps
}

export default function MapPicker({
  targetLatId,
  targetLngId,
  lat,
  lng,
  buttonLabel = 'Ustaw pinezkę',
}: Props) {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(mapsReady())
  const [failed, setFailed] = useState(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const gmapRef = useRef<google.maps.Map | null>(null)

  const defaultCenter = {
    lat: typeof lat === 'number' ? lat : 52.2297,
    lng: typeof lng === 'number' ? lng : 21.0122,
  }

  // Czekamy aż google.maps będzie dostępne
  useEffect(() => {
    if (!open || ready) return
    let tries = 0
    const t = setInterval(() => {
      tries++
      const ok = mapsReady()
      setReady(ok)
      if (ok || tries > 50) {
        clearInterval(t)
        if (!ok) setFailed(true)
      }
    }, 100)
    return () => clearInterval(t)
  }, [open, ready])

  // Inicjalizacja mapy po otwarciu i ready
  useEffect(() => {
    if (!open || !ready || !mapRef.current) return
    
    const raf = requestAnimationFrame(() => {
      try {
        const map = new google.maps.Map(mapRef.current!, {
          center: defaultCenter,
          zoom: 12,
        })
        gmapRef.current = map

        const marker = new google.maps.Marker({
          position: defaultCenter,
          map,
          draggable: true,
        })
        markerRef.current = marker

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          const pos = e.latLng
          if (pos) marker.setPosition(pos)
        })
      } catch (e) {
        setFailed(true)
        console.error('Map init error', e)
      }
    })
    
    return () => {
      cancelAnimationFrame(raf)
      markerRef.current?.setMap(null)
      markerRef.current = null
      gmapRef.current = null
    }
  }, [open, ready])

  function confirmPick() {
    const pos = markerRef.current?.getPosition()
    if (pos) {
      const latEl = document.getElementById(targetLatId) as HTMLInputElement | null
      const lngEl = document.getElementById(targetLngId) as HTMLInputElement | null
      if (latEl) latEl.value = String(pos.lat())
      if (lngEl) lngEl.value = String(pos.lng())
    }
    setOpen(false)
  }

  return (
    <>
      <button 
        type="button" 
        className="rounded bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-medium text-white transition"
        onClick={() => { setFailed(false); setOpen(true) }}
      >
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Wybierz lokalizację na mapie</h3>
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-500 text-xl"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
              <div className="p-6 text-center text-red-600">
                Brak klucza Google Maps API. Skontaktuj się z administratorem.
              </div>
            )}

            {!ready && !failed && (
              <div className="flex h-96 w-full items-center justify-center text-gray-600">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Ładowanie mapy...</p>
                </div>
              </div>
            )}

            {failed && (
              <div className="flex h-96 w-full flex-col items-center justify-center gap-4 p-6 text-center text-red-600">
                <p>Nie udało się załadować mapy.</p>
                <button
                  type="button"
                  className="rounded bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white text-sm font-medium transition"
                  onClick={() => { setReady(mapsReady()); setFailed(false) }}
                >
                  Spróbuj ponownie
                </button>
              </div>
            )}

            {ready && !failed && (
              <div className="h-96 w-full" ref={mapRef} />
            )}

            <div className="flex justify-between items-center border-t px-6 py-4">
              <div className="text-sm text-gray-500">
                Kliknij na mapie, aby ustawić pinezkę
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  className="rounded border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 text-gray-700 text-sm font-medium transition"
                  onClick={() => setOpen(false)}
                >
                  Anuluj
                </button>
                <button 
                  type="button" 
                  className="rounded bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white text-sm font-medium transition disabled:opacity-50"
                  onClick={confirmPick} 
                  disabled={!ready || failed}
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}