'use client'

import { useState, useMemo } from 'react'
import TournamentModal from './TournamentModal'
import { formatDatePL, formatTimeHHMM, joinDateTime, statusBadge } from '@/lib/utils'

type MiejsceTurnieju = {
  id: string
  nazwa: string
  miasto: string
  wojewodztwo: string | null
  adres: string | null
  latitude: number | null
  longitude: number | null
}

type AutorTurnieju = {
  id: string
  email: string | null
  username: string | null
}

export type TurniejRow = {
  id: string
  nazwa: string
  gra: string // ⭐ DODANE (np. 'qwirkle', 'rummikub_standard')
  data_turnieju: string | null
  godzina_turnieju: string | null
  zakonczenie_turnieju: string | null
  gsheet_url: string | null
  limit_graczy: number | null
  miejsce_id: string | null
  miejsce_turnieju: MiejsceTurnieju | null
  created_by: AutorTurnieju | null
}

// Klasy stylów z profilu
const inputClass =
  'w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 ' +
  'text-sm text-sky-50 placeholder:text-slate-400 ' +
  'focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400'

const primaryBtn =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-r ' +
  'from-sky-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white ' +
  'shadow-[0_10px_25px_rgba(15,23,42,0.9)] transition ' +
  'hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_14px_35px_rgba(15,23,42,1)] ' +
  'disabled:opacity-50 disabled:hover:shadow-none'

const secondaryBtn =
  'inline-flex items-center justify-center rounded-full border border-slate-500 ' +
  'bg-slate-800/80 px-4 py-2 text-sm font-semibold text-sky-100 shadow-sm ' +
  'hover:bg-slate-700 hover:border-sky-400 transition'

// ⭐ DODANE – mapowanie gry → watermark
function gameWatermark(gra: string) {
  if (gra === 'qwirkle') {
    return { src: '/brand/games/qwirkle.svg', alt: 'Qwirkle' }
  }
  if (gra.startsWith('rummikub')) {
    return { src: '/brand/games/rummikub.svg', alt: 'Rummikub' }
  }
  return null
}

// Funkcja pomocnicza do określania stylu na podstawie tekstu badge
function getBadgeStyle(text: string): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    padding: '0.5rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    letterSpacing: '0.025em',
    transition: 'all 200ms',
    borderWidth: '1px',
    borderStyle: 'solid',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
  }

  if (text === 'w trakcie') {
    return {
      ...baseStyle,
      backgroundColor: 'rgba(16, 185, 129, 0.25)',
      borderColor: 'rgba(52, 211, 153, 0.4)',
      color: '#ffffff',
      boxShadow: `
        0 4px 20px rgba(0, 0, 0, 0.4),
        0 2px 8px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        inset 0 -1px 0 rgba(0, 0, 0, 0.2)
      `,
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
    }
  } else if (text === 'zakończony') {
    return {
      ...baseStyle,
      backgroundColor: 'rgba(239, 68, 68, 0.25)',
      borderColor: 'rgba(248, 113, 113, 0.4)',
      color: '#ffffff',
      boxShadow: `
        0 4px 20px rgba(0, 0, 0, 0.4),
        0 2px 8px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        inset 0 -1px 0 rgba(0, 0, 0, 0.2)
      `,
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
    }
  } else {
    return {
      ...baseStyle,
      backgroundColor: 'rgba(59, 130, 246, 0.25)',
      borderColor: 'rgba(96, 165, 250, 0.4)',
      color: '#ffffff',
      boxShadow: `
        0 4px 20px rgba(0, 0, 0, 0.4),
        0 2px 8px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        inset 0 -1px 0 rgba(0, 0, 0, 0.2)
      `,
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
    }
  }
}

const badgeHoverClass =
  'hover:scale-[1.02] hover:shadow-[0_6px_24px_rgba(0,0,0,0.5)] transition-all duration-200'

function formatCreatorLabel(r: TurniejRow) {
  const u = r.created_by
  if (!u) return '—'
  return u.username || u.email || '—'
}

function TournamentCard({
  r,
  onCardClick,
}: {
  r: TurniejRow
  onCardClick: (tournament: TurniejRow) => void
}) {
  const start = joinDateTime(r.data_turnieju, r.godzina_turnieju)
  const end = r.zakonczenie_turnieju
    ? joinDateTime(r.data_turnieju, r.zakonczenie_turnieju)
    : null
  const badge = statusBadge(start, end)

  const miejsce = r.miejsce_turnieju
  const creatorLabel = formatCreatorLabel(r)
  const wm = gameWatermark(r.gra) // ⭐ DODANE

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/95 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.8)] hover:shadow-[0_18px_50px_rgba(0,0,0,0.9)] transition-all duration-300 cursor-pointer group"
      onClick={() => onCardClick(r)}
    >
      {/* ⭐ DODANE – watermark gry */}
      {wm && (
        <div className="pointer-events-none absolute inset-0">
          <img
            src={wm.src}
            alt={wm.alt}
            className="absolute top-[8px] right-[8px] w-[30%] max-w-[260px] min-w-[120px] opacity-[0.9] select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/95 via-slate-800/90 to-slate-800/60" />
        </div>
      )}

      {/* oryginalna zawartość */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-sky-50 mb-3 group-hover:text-sky-100 transition-colors">
            {r.nazwa}
          </h3>

          {start && (
            <div className="flex items-center gap-2 text-sm text-sky-200/80 mb-2 group-hover:text-sky-200 transition-colors">
              <span>
                {formatDatePL(start)} • {formatTimeHHMM(r.godzina_turnieju)}
                {end && ` - ${formatTimeHHMM(r.zakonczenie_turnieju)}`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-sky-200/60 mb-3">
            Utworzył: <span className="text-sky-100/90">{creatorLabel}</span>
          </div>

          {miejsce && (
            <div className="text-sm text-sky-200/80">
              <div className="font-medium text-sky-100">
                {miejsce.nazwa}, {miejsce.miasto}
              </div>
              {miejsce.adres && (
                <div className="text-sky-200/60 text-xs">{miejsce.adres}</div>
              )}
            </div>
          )}
        </div>

        {badge && (
        <div className={`absolute bottom-[5px] right-[5px] ${badgeHoverClass}`}>
        <span style={getBadgeStyle(badge.text)}>{badge.text}</span>
        </div>
                  )}

      </div>
    </div>
  )
}

export default function TournamentList({ tournaments }: { tournaments: TurniejRow[] }) {
  const [selectedTournament, setSelectedTournament] = useState<TurniejRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleCardClick = (tournament: TurniejRow) => {
    setSelectedTournament(tournament)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTournament(null)
  }

  const filteredTournaments = useMemo(() => {
    if (!searchTerm.trim()) return tournaments

    const lowercasedSearch = searchTerm.toLowerCase().trim()
    return tournaments.filter(
      (tournament) =>
        tournament.nazwa.toLowerCase().includes(lowercasedSearch) ||
        tournament.miejsce_turnieju?.nazwa.toLowerCase().includes(lowercasedSearch) ||
        tournament.miejsce_turnieju?.miasto.toLowerCase().includes(lowercasedSearch)
    )
  }, [tournaments, searchTerm])

  return (
    <>
      <div className="min-h-screen">
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
          <div className="w-full max-w-4xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-6">
            <h1 className="text-2xl font-semibold text-sky-50 text-center">Lista Turniejów</h1>

            {filteredTournaments.length > 0 ? (
              <div className="space-y-4">
                {filteredTournaments.map((r) => (
                  <TournamentCard key={r.id} r={r} onCardClick={handleCardClick} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-800/95 p-8 text-center">
                Brak turniejów
              </div>
            )}
          </div>
        </main>
      </div>

      <TournamentModal isOpen={isModalOpen} onClose={handleCloseModal} tournament={selectedTournament} />
    </>
  )
}
