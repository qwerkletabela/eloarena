import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Typy
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

// Funkcja pomocnicza do bezpiecznego rzutowania miejsca
function safeMiejsceTurnieju(miejsce: any): MiejsceTurnieju | null {
  if (!miejsce || typeof miejsce !== 'object') return null
  
  return {
    id: String(miejsce.id || ''),
    nazwa: String(miejsce.nazwa || ''),
    miasto: String(miejsce.miasto || ''),
    wojewodztwo: miejsce.wojewodztwo ? String(miejsce.wojewodztwo) : null,
    adres: miejsce.adres ? String(miejsce.adres) : null,
    latitude: typeof miejsce.latitude === 'number' ? miejsce.latitude : null,
    longitude: typeof miejsce.longitude === 'number' ? miejsce.longitude : null
  }
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

function TournamentCard({ r }: { r: TurniejRow }) {
  const start = joinDateTime(r.data_turnieju, r.godzina_turnieju)
  const end = r.zakonczenie_turnieju
    ? joinDateTime(r.data_turnieju, r.zakonczenie_turnieju)
    : null
  const badge = statusBadge(start, end)
  
  const miejsce = r.miejsce_turnieju

  return (
    <div className="rounded-lg border border-slate-600/50 bg-slate-800/50 p-4 hover:bg-slate-800/70 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Lewa strona - Informacje o turnieju */}
        <div className="flex-1 min-w-0">
          {/* Nazwa turnieju */}
          <h3 className="text-lg font-semibold text-sky-100 mb-2">
            {r.nazwa}
          </h3>
          
          {/* Data i godzina */}
          {start && (
            <div className="flex items-center gap-2 text-sm text-sky-200/80 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {formatDatePL(start)} • {formatTimeHHMM(r.godzina_turnieju)}
                {end && ` - ${formatTimeHHMM(r.zakonczenie_turnieju)}`}
              </span>
            </div>
          )}

          {/* Miejsce i adres */}
          {miejsce ? (
            <div className="flex items-start gap-2 text-sm text-sky-200/80">
              <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <div className="font-medium">{miejsce.nazwa}, {miejsce.miasto}</div>
                {miejsce.adres && (
                  <div className="text-sky-200/60 text-xs mt-0.5">
                    {miejsce.adres}
                  </div>
                )}
                {miejsce.wojewodztwo && (
                  <div className="text-sky-200/60 text-xs mt-0.5">
                    Województwo: {miejsce.wojewodztwo}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm text-red-400/80">
              <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <div>Brak danych miejsca</div>
                <div className="text-xs text-red-300/60 mt-0.5">
                  Miejsce ID w turnieju: {r.miejsce_id || 'NULL'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prawa strona - Status */}
        {badge && (
          <div className="shrink-0">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${badge.style}`}
            >
              {badge.text}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default async function TurniejListPage() {
  const supabase = await createSupabaseServer()
  
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
    .order('data_turnieju', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Błąd pobierania danych:', error)
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl bg-slate-800/95 border border-slate-700 p-6">
            <div className="text-red-400 text-center">
              Błąd podczas ładowania turniejów: {error.message}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // BEZPIECZNE PRZEKSZTAŁCENIE DANYCH - bez type assertion
  const tournaments: TurniejRow[] = rows ? rows.map(row => {
    // Używamy funkcji safeMiejsceTurnieju zamiast bezpośredniego rzutowania
    const miejsce = safeMiejsceTurnieju(row.miejsce_turnieju)
    
    return {
      id: String(row.id),
      nazwa: String(row.nazwa || ''),
      data_turnieju: row.data_turnieju ? String(row.data_turnieju) : null,
      godzina_turnieju: row.godzina_turnieju ? String(row.godzina_turnieju) : null,
      zakonczenie_turnieju: row.zakonczenie_turnieju ? String(row.zakonczenie_turnieju) : null,
      gsheet_url: row.gsheet_url ? String(row.gsheet_url) : null,
      limit_graczy: row.limit_graczy ? Number(row.limit_graczy) : null,
      miejsce_id: row.miejsce_id ? String(row.miejsce_id) : null,
      miejsce_turnieju: miejsce
    }
  }) : []

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sky-50 mb-2">
            Lista Turniejów
          </h1>
        </div>

        {tournaments.length > 0 ? (
          <div className="space-y-3">
            {tournaments.map((r) => (
              <TournamentCard key={r.id} r={r} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-800/95 border border-slate-700 p-8 text-center">
            <div className="text-sky-100/80 text-lg mb-2">Brak turniejów</div>
          </div>
        )}
      </div>
    </main>
  )
}