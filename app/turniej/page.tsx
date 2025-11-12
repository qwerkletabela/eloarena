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
  // godzina może być "HH:MM:SS" lub "HH:MM"; bierzemy HH:MM
  const hhmm = (t ?? '00:00').slice(0, 5)
  // traktujemy czas lokalny (Warszawa)
  return new Date(`${d}T${hhmm}`)
}

function formatDatePL(d: Date) {
  return d.toLocaleDateString('pl-PL', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTimeHHMM(raw: string | null) {
  if (!raw) return '00:00'
  const hhmm = raw.slice(0,5)
  return hhmm
}

function statusBadge(start: Date | null) {
  if (!start) return null
  const now = new Date()
  const ms = start.getTime() - now.getTime()
  const sixHours = 6 * 60 * 60 * 1000

  if (ms > 0) {
    // przyszłość
    const days = Math.floor(ms / (24 * 60 * 60 * 1000))
    if (days === 0) return { text: 'dzisiaj', style: 'bg-blue-50 text-blue-700 border-blue-200' }
    if (days === 1) return { text: 'jutro', style: 'bg-blue-50 text-blue-700 border-blue-200' }
    if (days === 2) return { text: 'pojutrze', style: 'bg-blue-50 text-blue-700 border-blue-200' }
    return { text: `za ${days} dni`, style: 'bg-blue-50 text-blue-700 border-blue-200' }
  } else {
    // przeszłość/teraz
    const since = now.getTime() - start.getTime()
    if (since <= sixHours) return { text: 'w trakcie', style: 'bg-amber-50 text-amber-700 border-amber-200' }
    return { text: 'zakończony', style: 'bg-slate-100 text-slate-700 border-slate-200' }
  }
}

export default async function TurniejListPage() {
  const supabase = await createSupabaseServer()
  const { data: rows } = await supabase
    .from('turniej')
    .select('id,nazwa,data_turnieju,godzina_turnieju,gsheet_url,arkusz_nazwa,limit_graczy,lat,lng')
    .order('data_turnieju', { ascending: true })
    .limit(200)

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-5">
      <h1 className="text-2xl font-semibold">Turnieje</h1>

      <div className="space-y-4">
        {rows?.map((r) => {
          const start = joinDateTime(r.data_turnieju, r.godzina_turnieju)
          const badge = statusBadge(start)
          return (
            <details
              key={r.id}
              className="group rounded-xl border border-red-100 bg-white/80 backdrop-blur px-4 py-3 shadow-sm open:shadow transition-shadow"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-red-800">{r.nazwa}</div>
                  <div className="mt-0.5 text-xs text-red-700/80">
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
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${badge.style}`}>
                    {badge.text}
                  </span>
                )}
              </summary>

              {/* rozwijane szczegóły */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">Szczegóły</div>
                  <ul className="text-sm text-slate-700/90 leading-relaxed">
                    <li><span className="opacity-70">Data:</span> {start ? formatDatePL(start) : '—'}</li>
                    <li><span className="opacity-70">Godzina:</span> {formatTimeHHMM(r.godzina_turnieju)}</li>
                    {r.limit_graczy && <li><span className="opacity-70">Limit graczy:</span> {r.limit_graczy}</li>}
                    {r.arkusz_nazwa && <li><span className="opacity-70">Arkusz (karta):</span> {r.arkusz_nazwa}</li>}
                  </ul>

                  {r.gsheet_url && (
                    <div className="pt-2">
                      <a
                        href={r.gsheet_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Arkusz Google
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M14 3h7v7m0-7L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M21 14v7H3V3h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>

                {/* mini mapa (tylko jeśli są współrzędne) */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">Lokalizacja</div>
                  {r.lat !== null && r.lng !== null ? (
                    <div className="overflow-hidden rounded-lg border">
                      <div className="aspect-[16/9]">
                        <iframe
                          title={`Mapa ${r.nazwa}`}
                          src={`https://www.google.com/maps?q=${r.lat},${r.lng}&z=14&output=embed`}
                          className="h-full w-full"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                      <div className="border-t bg-slate-50/50 p-2 text-right">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-red-700 hover:underline"
                        >
                          Otwórz w Mapach Google
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      Brak współrzędnych.
                    </div>
                  )}
                </div>
              </div>
            </details>
          )
        })}

        {!rows?.length && (
          <div className="rounded-md border px-4 py-6 text-sm opacity-70">Brak turniejów.</div>
        )}
      </div>
    </main>
  )
}
