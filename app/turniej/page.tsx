import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Row = {
  id: string
  nazwa: string
  data_turnieju: string | null     // YYYY-MM-DD
  godzina_turnieju: string | null  // HH:MM[:SS]
  gsheet_url: string | null
  arkusz_nazwa: string | null
  limit_graczy: number | null
  lat: number | null
  lng: number | null
}

function joinDateTime(d: string | null, t: string | null): Date | null {
  if (!d) return null
  const hhmm = (t ?? '00:00').slice(0, 5)
  return new Date(`${d}T${hhmm}`)
}

function formatDatePL(d: Date) {
  return d.toLocaleDateString('pl-PL', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTimeHHMM(raw: string | null) {
  if (!raw) return '00:00'
  return raw.slice(0, 5)
}

function statusBadge(start: Date | null) {
  if (!start) return null
  const now = new Date()
  const ms = start.getTime() - now.getTime()
  const sixHours = 6 * 60 * 60 * 1000

  if (ms > 0) {
    // Obliczamy różnicę w dniach (uwzględniając zmianę daty)
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const diffTime = startDate.getTime() - today.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return { text: 'dzisiaj', style: 'bg-sky-500/15 text-white border-sky-400/60' }
    } else if (diffDays === 1) {
      return { text: 'jutro', style: 'bg-sky-500/15 text-white border-sky-400/60' }
    } else if (diffDays === 2) {
      return { text: 'pojutrze', style: 'bg-sky-500/15 text-white border-sky-400/60' }
    } else {
      return { text: `za ${diffDays} dni`, style: 'bg-sky-500/15 text-white border-sky-400/60' }
    }
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

export default async function TurniejListPage() {
  const supabase = await createSupabaseServer()
  const { data: rows } = await supabase
    .from('turniej')
    .select(
      'id,nazwa,data_turnieju,godzina_turnieju,gsheet_url,arkusz_nazwa,limit_graczy,lat,lng'
    )
    .order('data_turnieju', { ascending: true })
    .limit(200)

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      {/* KARTA LISTY TURNIEJÓW */}
      <div className="w-full max-w-5xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-5">
        <h1 className="text-2xl font-semibold text-sky-50 text-center">
          Turnieje
        </h1>

        <div className="space-y-4">
          {rows?.map((r: Row) => {
            const start = joinDateTime(r.data_turnieju, r.godzina_turnieju)
            const badge = statusBadge(start)

            return (
              <details
                key={r.id}
                className="group rounded-xl border border-slate-600/70 bg-slate-900/70 px-4 py-3 shadow-sm open:shadow-md transition-shadow"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-sky-100">
                      {r.nazwa}
                    </div>
                    <div className="mt-0.5 text-xs text-sky-200/80">
                      {start ? (
                        <>
                          {formatDatePL(start)} • {formatTimeHHMM(r.godzina_turnieju)}
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

                {/* rozwijane szczegóły */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-sky-100">
                      Szczegóły
                    </div>
                    <ul className="text-sm text-sky-100/90 leading-relaxed">
                      <li>
                        <span className="opacity-70">Data:</span>{' '}
                        {start ? formatDatePL(start) : '—'}
                      </li>
                      <li>
                        <span className="opacity-70">Godzina:</span>{' '}
                        {formatTimeHHMM(r.godzina_turnieju)}
                      </li>
                      {r.limit_graczy && (
                        <li>
                          <span className="opacity-70">Limit graczy:</span>{' '}
                          {r.limit_graczy}
                        </li>
                      )}
                      {r.arkusz_nazwa && (
                        <li>
                          <span className="opacity-70">Arkusz (karta):</span>{' '}
                          {r.arkusz_nazwa}
                        </li>
                      )}
                    </ul>

                    {r.gsheet_url && (
                      <div className="pt-2">
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
                      </div>
                    )}
                  </div>

                  {/* mini mapa (tylko jeśli są współrzędne) */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-sky-100">
                      Lokalizacja
                    </div>
                    {r.lat !== null && r.lng !== null ? (
                      <div className="overflow-hidden rounded-lg border border-slate-600 bg-slate-900">
                        <div className="aspect-[16/9]">
                          <iframe
                            title={`Mapa ${r.nazwa}`}
                            src={`https://www.google.com/maps?q=${r.lat},${r.lng}&z=14&output=embed`}
                            className="h-full w-full"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                        <div className="border-t border-slate-700 bg-slate-900/90 p-2">
                          <div className="flex justify-between items-center">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-sky-300 hover:text-sky-100 hover:underline"
                            >
                              Otwórz w Mapach Google
                            </a>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`}
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
                                <path d="M12 2L14.09 8.26L21 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L3 9.27L9.91 8.26L12 2Z"/>
                              </svg>
                              Nawiguj
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-sky-100/80">
                        Brak współrzędnych.
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )
          })}

          {!rows?.length && (
            <div className="rounded-md border border-slate-600 bg-slate-900/80 px-4 py-6 text-sm text-sky-100/80 text-center">
              Brak turniejów.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}