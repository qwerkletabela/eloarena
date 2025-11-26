import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Row = {
  id: string
  nazwa: string
  data_turnieju: string | null
  godzina_turnieju: string | null
  zakonczenie_turnieju: string | null
  gsheet_url: string | null
  limit_graczy: number | null
  miejsce_id: string | null
  // UJEDNOLICONE: miejsce_turnieju jako pojedynczy obiekt (nie tablica)
  miejsce_turnieju: {
    id: string
    nazwa: string
    miasto: string
    wojewodztwo: string | null
    adres: string | null
    latitude: number | null
    longitude: number | null
  } | null
}

function joinDateTime(d: string | null, t: string | null): Date | null {
  if (!d) return null
  const hhmm = (t ?? '00:00').slice(0, 5)
  return new Date(`${d}T${hhmm}`)
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatDatePL(d: Date) {
  const formatted = d.toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
  })
  return capitalizeFirst(formatted)
}

function formatTimeHHMM(raw: string | null) {
  if (!raw) return '00:00'
  return raw.slice(0, 5)
}

function isPastTournament(start: Date | null, end: Date | null): boolean {
  if (!start) return false
  const now = new Date()
  const sixHours = 6 * 60 * 60 * 1000

  if (end) {
    return now.getTime() > end.getTime()
  }

  if (now.getTime() - start.getTime() > sixHours) {
    return true
  }
  return false
}

function statusBadge(start: Date | null, end: Date | null) {
  if (!start) return null
  const now = new Date()
  const sixHours = 6 * 60 * 60 * 1000

  if (end) {
    if (now.getTime() < start.getTime()) {
      const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const diffTime = startDate.getTime() - today.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return { text: 'dzisiaj', style: 'bg-sky-500/15 text-white border-sky-400/60' }
      if (diffDays === 1) return { text: 'jutro', style: 'bg-sky-500/15 text-white border-sky-400/60' }
      if (diffDays === 2) return { text: 'pojutrze', style: 'bg-sky-500/15 text-white border-sky-400/60' }
      return { text: `za ${diffDays} dni`, style: 'bg-sky-500/15 text-white border-sky-400/60' }
    }

    if (now.getTime() >= start.getTime() && now.getTime() <= end.getTime()) {
      return {
        text: 'w trakcie',
        style: 'bg-green-500/15 text-green-100 border-green-400/70',
      }
    }

    return {
      text: 'zakończony',
      style: 'bg-red-500/15 text-red-100 border-red-400/70',
    }
  }

  const ms = start.getTime() - now.getTime()
  if (ms > 0) {
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffTime = startDate.getTime() - today.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return { text: 'dzisiaj', style: 'bg-sky-500/15 text-white border-sky-400/60' }
    if (diffDays === 1) return { text: 'jutro', style: 'bg-sky-500/15 text-white border-sky-400/60' }
    if (diffDays === 2) return { text: 'pojutrze', style: 'bg-sky-500/15 text-white border-sky-400/60' }
    return { text: `za ${diffDays} dni`, style: 'bg-sky-500/15 text-white border-sky-400/60' }
  } else {
    const since = now.getTime() - start.getTime()
    if (since <= sixHours) {
      return {
        text: 'w trakcie',
        style: 'bg-green-500/15 text-green-100 border-green-400/70',
      }
    }
    return {
      text: 'zakończony',
      style: 'bg-red-500/15 text-red-100 border-red-400/70',
    }
  }
}

function createGoogleCalendarUrl(r: Row): string | null {
  if (!r.data_turnieju) return null

  const start = joinDateTime(r.data_turnieju, r.godzina_turnieju)
  if (!start) return null

  const formatDateForGoogle = (date: Date) =>
    date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z'

  const startTime = formatDateForGoogle(start)

  let end: Date
  if (r.zakonczenie_turnieju) {
    const e = joinDateTime(r.data_turnieju, r.zakonczenie_turnieju)
    end = e ?? new Date(start.getTime() + 3 * 60 * 60 * 1000)
  } else {
    end = new Date(start.getTime() + 3 * 60 * 60 * 1000)
  }
  const endTime = formatDateForGoogle(end)

  const details: string[] = []
  if (r.limit_graczy) details.push(`Limit graczy: ${r.limit_graczy}`)
  if (r.gsheet_url) details.push(`Arkusz Google: ${r.gsheet_url}`)
  if (r.zakonczenie_turnieju) details.push(`Zakończenie: ${formatTimeHHMM(r.zakonczenie_turnieju)}`)
  
  // UJEDNOLICONE: dostęp do pojedynczego obiektu
  if (r.miejsce_turnieju) {
    details.push(`Miejsce: ${r.miejsce_turnieju.nazwa}, ${r.miejsce_turnieju.miasto}`)
  }

  const location = r.miejsce_turnieju?.latitude && r.miejsce_turnieju?.longitude 
    ? `https://maps.google.com/?q=${r.miejsce_turnieju.latitude},${r.miejsce_turnieju.longitude}`
    : r.miejsce_turnieju?.adres || ''

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: r.nazwa,
    dates: `${startTime}/${endTime}`,
    details: details.join('\n'),
    location: location,
    ctz: 'Europe/Warsaw',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function TournamentCard({ r }: { r: Row }) {
  const start = joinDateTime(r.data_turnieju, r.godzina_turnieju)
  const end = r.zakonczenie_turnieju
    ? joinDateTime(r.data_turnieju, r.zakonczenie_turnieju)
    : null
  const badge = statusBadge(start, end)
  const calendarUrl = createGoogleCalendarUrl(r)

  // UJEDNOLICONE: dostęp do pojedynczego obiektu
  const miejsce = r.miejsce_turnieju

  // Sprawdzanie czy mamy poprawne współrzędne
  const hasValidCoordinates = () => {
    if (!miejsce) return false
    if (miejsce.latitude === null || miejsce.longitude === null) return false
    
    const lat = Number(miejsce.latitude)
    const lng = Number(miejsce.longitude)
    
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180
  }

  const hasCoords = hasValidCoordinates()
  const lat = hasCoords ? Number(miejsce!.latitude) : null
  const lng = hasCoords ? Number(miejsce!.longitude) : null

  return (
    <details className="group rounded-xl border border-slate-600/70 bg-slate-900/70 px-4 py-3 shadow-sm open:shadow-md transition-shadow">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-sky-100">
            {r.nazwa}
          </div>
          <div className="mt-0.5 text-xs text-sky-200/80">
            {start ? (
              <>
                {formatDatePL(start)} •{' '}
                {formatTimeHHMM(r.godzina_turnieju)}
                {end && ` - ${formatTimeHHMM(r.zakonczenie_turnieju)}`}
                {miejsce && <> • {miejsce.nazwa}, {miejsce.miasto}</>}
                {r.limit_graczy ? <> • limit: {r.limit_graczy}</> : null}
              </>
            ) : (
              <>—</>
            )}
          </div>
        </div>
        {badge && (
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${badge.style}`}
          >
            {badge.text}
          </span>
        )}
      </summary>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium text-sky-100">Szczegóły</div>
          <ul className="text-sm text-sky-100/90 leading-relaxed">
            <li>
              <span className="opacity-70">Data:</span>{' '}
              {start ? formatDatePL(start) : '—'}
            </li>
            <li>
              <span className="opacity-70">Godzina rozpoczęcia:</span>{' '}
              {formatTimeHHMM(r.godzina_turnieju)}
            </li>
            <li>
              <span className="opacity-70">Godzina zakończenia:</span>{' '}
              {r.zakonczenie_turnieju
                ? formatTimeHHMM(r.zakonczenie_turnieju)
                : 'nieustalona'}
            </li>
            {miejsce && (
              <li>
                <span className="opacity-70">Miejsce:</span>{' '}
                {miejsce.nazwa}, {miejsce.miasto}
                {miejsce.wojewodztwo && `, ${miejsce.wojewodztwo}`}
                {miejsce.adres && ` (${miejsce.adres})`}
                {hasCoords && (
                  <span className="text-green-400 ml-2">
                    ✓ Współrzędne dostępne
                  </span>
                )}
              </li>
            )}
            {r.limit_graczy && (
              <li>
                <span className="opacity-70">Limit graczy:</span>{' '}
                {r.limit_graczy}
              </li>
            )}
          </ul>

          <div className="flex flex-wrap gap-2 pt-2">
            {r.gsheet_url && (
              <a
                href={r.gsheet_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-sky-500/70 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-slate-800 hover:border-sky-300 transition"
              >
                Arkusz Google
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M14 3h7v7m0-7L10 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 14v7H3V3h7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            )}

            {calendarUrl && (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-blue-500/70 bg-blue-600/20 px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-500/30 hover:border-blue-400 transition"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Dodaj do kalendarza
              </a>
            )}
          </div>
        </div>

        {/* Sekcja z mapą */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-sky-100">Lokalizacja</div>
          {hasCoords && miejsce ? (
            <div className="overflow-hidden rounded-lg border border-slate-600 bg-slate-900">
              <div className="aspect-[16/9]">
                <iframe
                  title={`Mapa ${r.nazwa}`}
                  src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <div className="border-t border-slate-700 bg-slate-900/90 p-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-sky-300 hover:text-sky-100 hover:underline"
                  >
                    Otwórz w Mapach Google
                  </a>
                  <div className="flex gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-green-600 hover:bg-green-500 px-3 py-1 text-xs font-medium text-white transition"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2L14.09 8.26L21 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L3 9.27L9.91 8.26L12 2Z" />
                      </svg>
                      Nawiguj
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : miejsce ? (
            <div className="rounded-md border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-sky-100/80">
              Brak współrzędnych dla miejsca: {miejsce.nazwa}
              {miejsce.adres && (
                <div className="mt-1 text-xs opacity-70">
                  Adres: {miejsce.adres}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-sky-100/80">
              Brak przypisanego miejsca.
            </div>
          )}
        </div>
      </div>
    </details>
  )
}

export default async function TurniejListPage() {
  const supabase = await createSupabaseServer()
  
  // Pobieramy dane z obu tabel przez relację
  const { data: rows, error } = await supabase
    .from('turniej')
    .select(`
      id,
      nazwa,
      data_turnieju,
      godzina_turnieju,
      zakonczenie_turnieju,
      gsheet_url,
      limit_graczy,
      miejsce_id,
      miejsce_turnieju (
        id,
        nazwa,
        miasto,
        wojewodztwo,
        adres,
        latitude,
        longitude
      )
    `)
    .order('data_turnieju', { ascending: true })
    .limit(200)

  if (error) {
    console.error('Błąd pobierania danych:', error)
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl rounded-2xl bg-slate-800/95 border border-slate-700 p-6">
          <div className="text-red-400 text-center">
            Błąd podczas ładowania turniejów: {error.message}
          </div>
        </div>
      </main>
    )
  }

  // Diagnostyka - sprawdź czy dane są pobierane poprawnie
  if (rows && process.env.NODE_ENV === 'development') {
    console.log('Liczba turniejów:', rows.length)
    rows.forEach((row, index) => {
      const miejsce = row.miejsce_turnieju
      console.log(`Turniej ${index + 1}:`, {
        nazwa: row.nazwa,
        data: row.data_turnieju,
        miejsce_id: row.miejsce_id,
        miejsce: miejsce ? {
          nazwa: miejsce.nazwa,
          latitude: miejsce.latitude,
          longitude: miejsce.longitude
        } : 'BRAK MIEJSCA'
      })
    })
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-8">
        <h1 className="text-2xl font-semibold text-sky-50 text-center">
          Wszystkie turnieje
        </h1>

        {rows && rows.length > 0 ? (
          <div className="space-y-4">
            {rows.map((r) => (
              <TournamentCard key={r.id} r={r} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-slate-600 bg-slate-900/80 px-4 py-6 text-sm text-sky-100/80 text-center">
            Brak turniejów.
          </div>
        )}
      </div>
    </main>
  )
}