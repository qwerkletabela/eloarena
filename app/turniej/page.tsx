// elo-arena/app/turniej/page.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import TournamentList from '@/components/TournamentList.client'
import type { TurniejRow } from '@/components/TournamentList.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function safeMiejsceTurnieju(m: any): TurniejRow['miejsce_turnieju'] {
  if (!m || typeof m !== 'object') return null
  return {
    id: String(m.id || ''),
    nazwa: String(m.nazwa || ''),
    miasto: String(m.miasto || ''),
    wojewodztwo: m.wojewodztwo ? String(m.wojewodztwo) : null,
    adres: m.adres ? String(m.adres) : null,
    latitude: typeof m.latitude === 'number' ? m.latitude : null,
    longitude: typeof m.longitude === 'number' ? m.longitude : null,
  }
}

function safeCreator(u: any): TurniejRow['created_by'] {
  if (!u || typeof u !== 'object') return null
  return {
    id: String(u.id || ''),
    email: u.email ? String(u.email) : null,
    username: u.username ? String(u.username) : null,
  }
}

export default async function TurniejListPage() {
  const supabase = await createSupabaseServer()

  const { data: rows, error } = await supabase
    .from('turniej')
    .select(
      `
      id,
      nazwa,
      gra,
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
      ),

      creator:profiles!turniej_created_by_profiles_fkey (
        id,
        email,
        username
      )
    `
    )
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

  const tournaments: TurniejRow[] = (rows ?? []).map((row: any) => ({
    id: String(row.id),
    nazwa: String(row.nazwa || ''),
    gra: String(row.gra || ''), // ✅ DODANE
    data_turnieju: row.data_turnieju ? String(row.data_turnieju) : null,
    godzina_turnieju: row.godzina_turnieju ? String(row.godzina_turnieju) : null,
    zakonczenie_turnieju: row.zakonczenie_turnieju ? String(row.zakonczenie_turnieju) : null,
    gsheet_url: row.gsheet_url ? String(row.gsheet_url) : null,
    limit_graczy: row.limit_graczy != null ? Number(row.limit_graczy) : null,
    miejsce_id: row.miejsce_id ? String(row.miejsce_id) : null,
    miejsce_turnieju: safeMiejsceTurnieju(row.miejsce_turnieju),
    created_by: safeCreator(row.creator),
  }))

  return <TournamentList tournaments={tournaments} />
}
