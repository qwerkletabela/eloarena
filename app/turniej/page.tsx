import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TurniejListPage() {
  // Uwaga: żadnego pobierania usera i żadnych redirectów!
  const supabase = await createSupabaseServer()

  const { data: rows, error } = await supabase
    .from('turniej')
    .select('id, nazwa, data_turnieju, godzina_turnieju, gsheet_url, limit_graczy')
    .order('data_turnieju', { ascending: true })
    .limit(100)

  if (error) {
    // pokaż łagodny komunikat zamiast przekierowania do logowania
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Turnieje</h1>
        <p className="text-sm text-red-700">Nie udało się pobrać listy turniejów.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Turnieje</h1>
      <ul className="divide-y rounded border">
        {rows?.map(r => (
          <li key={r.id} className="px-4 py-3">
            <div className="font-medium">{r.nazwa}</div>
            <div className="text-xs opacity-70">
              {r.data_turnieju ?? '—'}
              {r.godzina_turnieju ? ` • ${r.godzina_turnieju}` : ''}
              {r.limit_graczy ? ` • limit: ${r.limit_graczy}` : ''}
            </div>
            {r.gsheet_url && (
              <div className="mt-2">
                <a href={r.gsheet_url} target="_blank" rel="noreferrer" className="pill pill--secondary">
                  Arkusz Google
                </a>
              </div>
            )}
          </li>
        ))}
        {!rows?.length && <li className="px-4 py-6 text-sm opacity-60">Brak turniejów.</li>}
      </ul>
    </main>
  )
}
