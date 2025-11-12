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

  // Czekamy aż google.maps będzie dostępne (polling do 5s)
  useEffect(() => {
    if (!open || ready) return
    let tries = 0
    const t = setInterval(() => {
      tries++
      const ok = mapsReady()
      setReady(ok)
      if (ok || tries > 50) { // ~5s
        clearInterval(t)
        if (!ok) setFailed(true)
      }
    }, 100)
    return () => clearInterval(t)
  }, [open, ready])

  // Inicjalizacja mapy po otwarciu i ready
  useEffect(() => {
    if (!open || !ready || !mapRef.current) return
    // Poczekaj aż modal wyrenderuje wymiary
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
        // eslint-disable-next-line no-console
        console.error('Map init error', e)
      }
    })
    return () => {
      cancelAnimationFrame(raf)
      markerRef.current?.setMap(null)
      markerRef.current = null
      gmapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <button type="button" className="pill pill--secondary" onClick={() => { setFailed(false); setOpen(true) }}>
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold">Wybierz lokalizację</h3>
              <button type="button" className="text-sm underline" onClick={() => setOpen(false)}>Zamknij</button>
            </div>

            {/* Stan: brak klucza */}
            {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
              <div className="p-4 text-sm text-red-700">
                Brak <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>. Dodaj do .env.local i zrestartuj dev server.
              </div>
            )}

            {/* Stan: ładowanie SDK */}
            {!ready && !failed && (
              <div className="flex h-[60vh] w-full items-center justify-center text-sm text-slate-600">
                Ładowanie mapy…
              </div>
            )}

            {/* Stan: błąd */}
            {failed && (
              <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-red-700">
                Nie udało się załadować mapy. Sprawdź klucz/referrer i wtyczki blokujące.
                <button
                  type="button"
                  className="pill pill--secondary"
                  onClick={() => { setReady(mapsReady()); setFailed(false) }}
                >
                  Spróbuj ponownie
                </button>
              </div>
            )}

            {/* Mapa */}
            {ready && !failed && (
              <div className="h-[60vh] w-full" ref={mapRef} />
            )}

            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <button type="button" className="pill pill--secondary" onClick={() => setOpen(false)}>Anuluj</button>
              <button type="button" className="pill pill--primary" onClick={confirmPick} disabled={!ready || failed}>
                Ustaw
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
