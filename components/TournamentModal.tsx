'use client'

import { useEffect } from 'react'
import { createGoogleCalendarUrl } from '@/lib/utils'

type MiejsceTurnieju = {
  id: string
  nazwa: string
  miasto: string
  wojewodztwo: string | null
  adres: string | null
  latitude: number | null
  longitude: number | null
}

type TurniejRow = {
  id: string
  nazwa: string
  data_turnieju: string | null
  godzina_turnieju: string | null
  zakonczenie_turnieju: string | null
  gsheet_url: string | null
  limit_graczy: number | null
  miejsce_id: string | null
  miejsce_turnieju: MiejsceTurnieju | null
}

interface TournamentModalProps {
  isOpen: boolean
  onClose: () => void
  tournament: TurniejRow | null
}

function formatDatePL(d: Date) {
  const formatted = d.toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatTimeHHMM(raw: string | null) {
  if (!raw) return '00:00'
  return raw.slice(0, 5)
}

function joinDateTime(d: string | null, t: string | null): Date | null {
  if (!d) return null
  const hhmm = (t ?? '00:00').slice(0, 5)
  return new Date(`${d}T${hhmm}`)
}

export default function TournamentModal({ isOpen, onClose, tournament }: TournamentModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !tournament) return null

  const start = joinDateTime(tournament.data_turnieju, tournament.godzina_turnieju)
  const end = tournament.zakonczenie_turnieju
    ? joinDateTime(tournament.data_turnieju, tournament.zakonczenie_turnieju)
    : null
  const calendarUrl = createGoogleCalendarUrl(tournament)
  const miejsce = tournament.miejsce_turnieju

  const hasValidCoordinates = miejsce?.latitude && miejsce?.longitude

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-600 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nagłówek */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-600 bg-slate-900/95 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-sky-100">{tournament.nazwa}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Zawartość */}
        <div className="p-6 space-y-6">
          {/* Podstawowe informacje */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-sky-100">Szczegóły turnieju</h3>
              <div className="space-y-3 text-sm text-sky-100/90">
                <div className="flex justify-between">
                  <span className="opacity-70">Data:</span>
                  <span>{start ? formatDatePL(start) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Godzina rozpoczęcia:</span>
                  <span>{formatTimeHHMM(tournament.godzina_turnieju)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Godzina zakończenia:</span>
                  <span>{tournament.zakonczenie_turnieju ? formatTimeHHMM(tournament.zakonczenie_turnieju) : 'nieustalona'}</span>
                </div>
                {tournament.limit_graczy && (
                  <div className="flex justify-between">
                    <span className="opacity-70">Limit graczy:</span>
                    <span>{tournament.limit_graczy}</span>
                  </div>
                )}
              </div>

              {/* Miejsce */}
              {miejsce && (
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-sky-100">Miejsce</h4>
                  <div className="space-y-2 text-sm text-sky-100/90">
                    <div className="font-medium">{miejsce.nazwa}</div>
                    <div>{miejsce.miasto}{miejsce.wojewodztwo && `, ${miejsce.wojewodztwo}`}</div>
                    {miejsce.adres && (
                      <div className="text-sky-200/60">{miejsce.adres}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mapa */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-sky-100">Lokalizacja</h3>
              {hasValidCoordinates ? (
                <div className="overflow-hidden rounded-lg border border-slate-600">
                  <div className="aspect-[4/3]">
                    <iframe
                      title={`Mapa ${tournament.nazwa}`}
                      src={`https://maps.google.com/maps?q=${miejsce.latitude},${miejsce.longitude}&z=15&output=embed`}
                      className="h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] rounded-lg border border-slate-600 bg-slate-800/50 flex items-center justify-center">
                  <div className="text-center text-sky-200/50">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>Brak mapy</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Przyciski akcji */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-600">
            {/* Nawigacja */}
            {hasValidCoordinates && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${miejsce.latitude},${miejsce.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-xl bg-green-600 hover:bg-green-500 px-6 py-3 text-white font-medium transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Nawiguj do miejsca
              </a>
            )}

            {/* Kalendarz */}
            {calendarUrl && (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-white font-medium transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Dodaj do kalendarza
              </a>
            )}

            {/* Arkusz Google */}
            {tournament.gsheet_url && (
              <a
                href={tournament.gsheet_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-xl bg-slate-700 hover:bg-slate-600 px-6 py-3 text-sky-100 font-medium transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Arkusz Google
              </a>
            )}

            {/* Otwórz w Mapach Google */}
            {hasValidCoordinates && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${miejsce.latitude},${miejsce.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-xl bg-slate-700 hover:bg-slate-600 px-6 py-3 text-sky-100 font-medium transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Otwórz w Mapach Google
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}