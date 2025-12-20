// app/mapa/page.tsx
'use client'

import 'leaflet/dist/leaflet.css' // ✅ DODAJ TO (statycznie, top-level)

import { useEffect, useState, useRef, useCallback } from 'react'
import { GeoJsonObject } from 'geojson'
import { supabase } from '@/lib/supabase/client'
import {
  MapPin,
  Filter,
  ZoomIn,
  ZoomOut,
  Navigation,
  RefreshCw,
} from 'lucide-react'

// Typy
type Miejsce = {
  id: string
  nazwa: string
  miasto: string
  wojewodztwo: string | null
  adres: string | null
  latitude: number | null
  longitude: number | null
  opis?: string | null
  liczba_turniejow?: number
}

// Proste granice Polski jako fallback
const SIMPLE_POLAND_BORDER: [number, number][] = [
  [54.835, 14.25],
  [54.453, 18.0],
  [54.366, 22.5],
  [52.167, 23.2],
  [50.334, 24.15],
  [49.0, 22.9],
  [49.0, 17.0],
  [49.0, 15.0],
  [51.0, 14.0],
  [54.835, 14.25],
]

export default function MapaPage() {
  const [loading, setLoading] = useState(true)
  const [loadingMiejsca, setLoadingMiejsca] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [miejsca, setMiejsca] = useState<Miejsce[]>([])
  const [selectedWojewodztwo, setSelectedWojewodztwo] = useState<string | null>(
    null
  )

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const geoJsonLayerRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const leafletRef = useRef<any>(null)

  const defaultCenter: [number, number] = [52.0, 19.0]
  const defaultZoom = 6

  // Pobierz miejsca turniejów z Supabase
  const fetchMiejsca = useCallback(async () => {
    try {
      setLoadingMiejsca(true)

      const { data, error } = await supabase
        .from('miejsce_turnieju')
        .select(
          `
          *,
          turniej (id)
        `
        )
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('miasto', { ascending: true })

      if (error) throw error

      const miejscaZTurniejami = (data || []).map((miejsce) => ({
        ...miejsce,
        liczba_turniejow: Array.isArray((miejsce as any).turniej)
          ? (miejsce as any).turniej.length
          : 0,
      }))

      setMiejsca(miejscaZTurniejami)
    } catch (err: any) {
      console.error('❌ Błąd pobierania miejsc:', err)
      setError(
        `Błąd pobierania danych miejsc: ${err.message || 'Nieznany błąd'}`
      )
    } finally {
      setLoadingMiejsca(false)
    }
  }, [])

  // Dodaj markery miejsc do mapy
  const addMarkersToMap = useCallback(
    (miejsca: Miejsce[], map: any, L: any) => {
      if (!map || !L) return

      // Wyczyść stare markery
      markersRef.current.forEach((marker) => {
        marker.remove()
      })
      markersRef.current = []

      if (miejsca.length === 0) return

      miejsca.forEach((miejsce) => {
        if (!miejsce.latitude || !miejsce.longitude) return

        const marker = L.marker([miejsce.latitude, miejsce.longitude], {
          icon: L.icon({
            iconUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconRetinaUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            shadowUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [30, 46],
            iconAnchor: [15, 46],
            popupAnchor: [0, -46],
          }),
          title: `${miejsce.nazwa}`,
        })

        // Treść popupu
        const popupContent = `
        <div class="p-4 min-w-[300px] bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
          <h3 class="font-bold text-lg text-white mb-3">${miejsce.nazwa}</h3>
          <div class="space-y-3">
            <div class="flex items-start">
              <div class="rounded-lg bg-slate-700 p-2 mr-3">
                <svg class="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <div class="font-medium text-sky-100">${miejsce.miasto}</div>
                ${
                  miejsce.wojewodztwo
                    ? `<div class="text-sm text-slate-300">${miejsce.wojewodztwo}</div>`
                    : ''
                }
              </div>
            </div>
            ${
              miejsce.adres
                ? `
              <div class="flex items-start pt-3 border-t border-slate-700">
                <div class="rounded-lg bg-slate-700 p-2 mr-3">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                </div>
                <div class="text-sm text-slate-300">${miejsce.adres}</div>
              </div>
            `
                : ''
            }
            <div class="flex items-center justify-between pt-3 border-t border-slate-700">
              <div class="flex items-center">
                <div class="rounded-lg bg-slate-700 p-2 mr-3">
                  <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                  </svg>
                </div>
                <div>
                  <div class="text-lg font-bold text-amber-300">${
                    miejsce.liczba_turniejow || 0
                  }</div>
                  <div class="text-xs text-slate-400">turniejów</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `

        marker.bindPopup(popupContent)
        marker.addTo(map)
        markersRef.current.push(marker)
      })
    },
    []
  )

  // Załaduj granice Polski
  const loadPolandBorders = useCallback((map: any, L: any) => {
    if (!map || !L) return

    fetch('/data/poland/poland.geojson')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
      .then((data) => {
        const geoJsonData = data as GeoJsonObject

        if (geoJsonLayerRef.current) {
          map.removeLayer(geoJsonLayerRef.current)
        }

        geoJsonLayerRef.current = L.geoJSON(geoJsonData, {
          style: {
            fillColor: 'transparent',
            color: '#0000ff',
            weight: 5,
            opacity: 0.7,
            fillOpacity: 0.1,
          },
        }).addTo(map)
      })
      .catch(() => {
        L.polygon(SIMPLE_POLAND_BORDER, {
          fillColor: 'transparent',
          color: '#38bdf8',
          weight: 5,
          opacity: 0.8,
          fillOpacity: 0.1,
        }).addTo(map)
      })
  }, [])

  // Inicjalizacja mapy - tylko po stronie klienta
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || mapRef.current) {
      return
    }

    const initMap = async () => {
      try {
        setLoading(true)

        // Dynamiczny import Leaflet tylko po stronie klienta
        const L = await import('leaflet')

        // ❌ USUNIĘTE:
        // import('leaflet/dist/leaflet.css')
        //   .catch((err) => console.warn('Błąd ładowania CSS Leaflet:', err))

        leafletRef.current = L

        // Utwórz mapę
        const map = L.map(mapContainerRef.current!).setView(defaultCenter, defaultZoom)
        mapRef.current = map

        // Dodaj warstwę OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        // Załaduj granice Polski
        loadPolandBorders(map, L)

        // Pobierz miejsca turniejów
        await fetchMiejsca()

        setLoading(false)
      } catch (err: any) {
        console.error('❌ Błąd inicjalizacji mapy:', err)
        setError(`Błąd tworzenia mapy: ${err.message || 'Nieznany błąd'}`)
        setLoading(false)
      }
    }

    initMap()

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        geoJsonLayerRef.current = null
        markersRef.current = []
        leafletRef.current = null
      }
    }
  }, [fetchMiejsca, loadPolandBorders])

  // Dodaj markery gdy zostaną załadowane miejsca i mapa jest gotowa
  useEffect(() => {
    if (mapRef.current && leafletRef.current && miejsca.length > 0) {
      addMarkersToMap(miejsca, mapRef.current, leafletRef.current)
    }
  }, [miejsca, addMarkersToMap])

  // Filtruj miejsca po województwie
  const wojewodztwa = Array.from(
    new Set(miejsca.map((m) => m.wojewodztwo).filter(Boolean))
  )
  const filteredMiejsca = selectedWojewodztwo
    ? miejsca.filter((m) => m.wojewodztwo === selectedWojewodztwo)
    : miejsca

  // Kontrolki mapy
  const resetMapView = () => {
    if (mapRef.current) {
      mapRef.current.setView(defaultCenter, defaultZoom)
      setSelectedWojewodztwo(null)

      markersRef.current.forEach((marker) => {
        marker.closePopup()
      })
    }
  }

  const showAllPlaces = () => {
    if (mapRef.current && miejsca.length > 0) {
      const bounds = leafletRef.current?.latLngBounds(
        miejsca
          .filter((m) => m.latitude && m.longitude)
          .map((m) => [m.latitude!, m.longitude!] as [number, number])
      )

      if (bounds && bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }

  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn()
    }
  }

  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut()
    }
  }

  const handleWojewodztwoSelect = (wojewodztwo: string | null) => {
    setSelectedWojewodztwo(wojewodztwo)

    if (!mapRef.current || !leafletRef.current) return

    const L = leafletRef.current

    if (wojewodztwo) {
      const miejscaWoj = miejsca.filter((m) => m.wojewodztwo === wojewodztwo)

      // Zaktualizuj widoczność markerów
      markersRef.current.forEach((marker) => {
        const latLng = marker.getLatLng()
        const isVisible = miejscaWoj.some(
          (m) => m.latitude === latLng.lat && m.longitude === latLng.lng
        )

        if (isVisible) {
          marker.setOpacity(1)
          marker.setZIndexOffset(1000)
        } else {
          marker.setOpacity(0.3)
          marker.setZIndexOffset(0)
        }
      })

      if (miejscaWoj.length > 0) {
        const bounds = L.latLngBounds(
          miejscaWoj
            .filter((m) => m.latitude && m.longitude)
            .map((m) => [m.latitude!, m.longitude!] as [number, number])
        )

        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
      }
    } else {
      // Pokaż wszystkie markery
      markersRef.current.forEach((marker) => {
        marker.setOpacity(1)
        marker.setZIndexOffset(0)
      })
    }
  }

  return (
    <div className="py-8 px-4">
      <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 py-4">
        <div className="w-full max-w-7xl">
          <div className="rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-8">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-sky-50 mb-2 flex items-center justify-center gap-3">
                <MapPin className="h-8 w-8" />
                Mapa miejsc turniejów
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-slate-900/70 rounded-xl border border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Filter className="h-5 w-5 text-sky-400" />
                    Filtruj województwa
                  </h3>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    <button
                      onClick={() => handleWojewodztwoSelect(null)}
                      className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                        !selectedWojewodztwo
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>Wszystkie województwa</span>
                        <span className="text-xs bg-slate-700/50 px-2 py-1 rounded-full">
                          {wojewodztwa.length}
                        </span>
                      </div>
                    </button>

                    {wojewodztwa.sort().map((woj) => (
                      <button
                        key={woj as string}
                        onClick={() => handleWojewodztwoSelect(woj as string)}
                        className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                          selectedWojewodztwo === woj
                            ? 'bg-sky-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{woj}</span>
                          <span className="text-xs bg-slate-700/50 px-2 py-1 rounded-full">
                            {miejsca.filter((m) => m.wojewodztwo === woj).length}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {loadingMiejsca && (
                    <div className="mt-4 text-center">
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-sky-500 border-r-transparent mr-2"></div>
                      <span className="text-slate-300 text-sm">
                        Ładowanie miejsc...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="rounded-xl border border-slate-700 overflow-hidden h-[600px] relative bg-slate-900/70">
                  <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                    <button
                      onClick={zoomIn}
                      className="bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg p-3 shadow-lg hover:shadow-xl transition-all border border-slate-600"
                      title="Przybliż"
                    >
                      <ZoomIn className="h-5 w-5" />
                    </button>

                    <button
                      onClick={zoomOut}
                      className="bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg p-3 shadow-lg hover:shadow-xl transition-all border border-slate-600"
                      title="Oddal"
                    >
                      <ZoomOut className="h-5 w-5" />
                    </button>

                    <button
                      onClick={resetMapView}
                      className="bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg p-3 shadow-lg hover:shadow-xl transition-all border border-slate-600"
                      title="Resetuj widok"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>

                    <button
                      onClick={showAllPlaces}
                      className="bg-sky-600 hover:bg-sky-700 text-white rounded-lg p-3 shadow-lg hover:shadow-xl transition-all"
                      title="Pokaż wszystkie miejsca"
                    >
                      <Navigation className="h-5 w-5" />
                    </button>
                  </div>

                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-[1000]">
                      <div className="text-center p-8">
                        <div className="inline-block h-14 w-14 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent mb-4"></div>
                        <p className="text-slate-300 text-lg">Ładowanie mapy...</p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-[1000]">
                      <div className="bg-red-900/50 border border-red-700 rounded-xl p-6 max-w-md">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-red-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-red-300">
                            Błąd ładowania mapy
                          </h3>
                        </div>
                        <p className="text-red-400 mb-4">{error}</p>
                        <button
                          onClick={() =>
                            typeof window !== 'undefined' && window.location.reload()
                          }
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                        >
                          Odśwież stronę
                        </button>
                      </div>
                    </div>
                  )}

                  <div ref={mapContainerRef} className="w-full h-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .leaflet-popup-content {
          margin: 0 !important;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          overflow: hidden !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
          border: 1px solid #475569 !important;
        }

        .leaflet-popup-tip {
          background: #1e293b !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
        }

        .leaflet-popup-close-button {
          color: #94a3b8 !important;
          padding: 10px !important;
          font-size: 18px !important;
        }

        .leaflet-popup-close-button:hover {
          color: #f8fafc !important;
          background: transparent !important;
        }

        .leaflet-control-attribution {
          background: rgba(15, 23, 42, 0.8) !important;
          color: #94a3b8 !important;
          font-size: 11px !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
        }

        .leaflet-control-attribution a {
          color: #60a5fa !important;
        }
      `}</style>
    </div>
  )
}
