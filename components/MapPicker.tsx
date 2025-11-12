'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

type Props = {
  targetLatId: string
  targetLngId: string
  lat?: number | null
  lng?: number | null
  buttonLabel?: string
}

export default function MapPicker({
  targetLatId,
  targetLngId,
  lat,
  lng,
  buttonLabel = 'Ustaw pinezkę',
}: Props) {
  const [open, setOpen] = useState(false)
  const [apiReady, setApiReady] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const mapRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const gmapRef = useRef<google.maps.Map | null>(null)

  const defaultCenter = {
    lat: typeof lat === 'number' ? lat : 52.2297,
    lng: typeof lng === 'number' ? lng : 21.0122,
  }

  useEffect(() => {
    if (!open || !apiReady || !mapRef.current) return

    try {
      const map = new google.maps.Map(mapRef.current, {
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

      map.addListener('click', (e) => {
        const pos = e.latLng
        if (pos) marker.setPosition(pos)
      })
    } catch (e) {
      setApiError('Nie można zainicjować mapy (sprawdź klucz API/Console).')
      console.error(e)
    }

    return () => {
      markerRef.current?.setMap(null)
      markerRef.current = null
      gmapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, apiReady])

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

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const hasKey = Boolean(apiKey)

  return (
    <>
      {hasKey && (
        <Script
          id="google-maps"
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}`}
          strategy="afterInteractive"
          onLoad={() => setApiReady(true)}
          onError={() => setApiError('Nie udało się załadować Google Maps JS API (sprawdź klucz/referrer).')}
        />
      )}

      <button type="button" className="pill pill--secondary" onClick={() => setOpen(true)}>
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold">Wybierz lokalizację</h3>
              <button type="button" className="text-sm underline" onClick={() => setOpen(false)}>Zamknij</button>
            </div>

            {!hasKey && (
              <div className="p-4 text-sm text-red-700">
                Brak zmiennej <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> w środowisku.
              </div>
            )}

            {apiError && (
              <div className="p-4 text-sm text-red-700">{apiError}</div>
            )}

            <div className="h-[60vh] w-full" ref={mapRef} />

            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <button type="button" className="pill pill--secondary" onClick={() => setOpen(false)}>Anuluj</button>
              <button type="button" className="pill pill--primary" onClick={confirmPick} disabled={!apiReady}>
                Ustaw
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
