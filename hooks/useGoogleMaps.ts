// hooks/useGoogleMaps.ts
import { useState, useEffect, useCallback } from 'react'

declare global {
  interface Window {
    _googleMapsLoading?: Promise<void>
    _googleMapsLoaded?: boolean
  }
}

export const useGoogleMaps = (apiKey: string) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadGoogleMaps = useCallback(async (): Promise<void> => {
    // Jeśli już załadowany, zwróć
    if (window.google && window.google.maps) {
      setIsLoaded(true)
      return
    }

    // Jeśli już ładowany, poczekaj
    if (window._googleMapsLoading) {
      await window._googleMapsLoading
      setIsLoaded(true)
      return
    }

    // Oznacz jako już załadowany globalnie
    if (window._googleMapsLoaded) {
      setIsLoaded(true)
      return
    }

    // Utwórz promise dla ładowania
    window._googleMapsLoading = new Promise(async (resolve, reject) => {
      try {
        // Usuń WSZYSTKIE istniejące skrypty Google Maps
        const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
        existingScripts.forEach(script => {
          script.remove()
        })

        // Usuń stare style i elementy Google Maps
        const gmpElements = document.querySelectorAll('[class*="gmp-"], [id*="gmp-"]')
        gmpElements.forEach(el => el.remove())

        // Dodaj nowy skrypt
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
        script.async = true
        script.defer = true
        script.id = 'google-maps-script-global'

        script.onload = () => {
          console.log('✅ Google Maps API załadowane globalnie')
          window._googleMapsLoaded = true
          setIsLoaded(true)
          resolve()
        }

        script.onerror = () => {
          console.error('❌ Błąd ładowania Google Maps API')
          setError('Nie udało się załadować Google Maps API')
          reject()
        }

        document.head.appendChild(script)
      } catch (err) {
        console.error('❌ Błąd w loadGoogleMaps:', err)
        setError('Błąd podczas ładowania Google Maps')
        reject(err)
      }
    })

    await window._googleMapsLoading
  }, [apiKey])

  useEffect(() => {
    if (apiKey && !isLoaded && !error) {
      loadGoogleMaps()
    }
  }, [apiKey, isLoaded, error, loadGoogleMaps])

  return { isLoaded, error, loadGoogleMaps }
}