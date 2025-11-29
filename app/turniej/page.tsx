// elo-arena/app/turniej/page.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import TournamentList from '@/components/TournamentList.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  const tournaments: TurniejRow[] = rows ? rows.map(row => {
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

  return <TournamentList tournaments={tournaments} />
}