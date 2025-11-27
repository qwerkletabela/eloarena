// app/admin/partie/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { 
  ArrowLeft,
  Calendar,
  Users,
  Trophy,
  Eye,
  Trash2
} from 'lucide-react'
import PartieClient from '@/components/PartieClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Gracz {
  id: string
  imie: string
  nazwisko: string
}

interface PartiaZGraczami {
  id: string
  numer_partii: number
  data_rozgrywki: string
  liczba_graczy: number
  duzy_punkt_gracz_id: string
  turniej_id: string
  turniej: {
    id: string
    nazwa: string
  }
  gracze: Gracz[]
}

export default async function AdminPartiePage() {
  const supabase = await createSupabaseServer()

  // WYMAGANE LOGOWANIE
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  // WYMAGANY ADMIN
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  try {
    // Pobierz wszystkie partie z informacjami o turnieju
    const { data: partie, error } = await supabase
      .from('wyniki_partii')
      .select(`
        *,
        turniej:turniej_id(id, nazwa)
      `)
      .order('data_rozgrywki', { ascending: false })

    if (error) {
      console.error('Błąd pobierania partii:', error)
      throw error
    }

    // Dla każdej partii pobierz graczy
    const partieZGraczami: PartiaZGraczami[] = await Promise.all(
      (partie || []).map(async (partia) => {
        const graczeIds: string[] = []
        for (let i = 1; i <= partia.liczba_graczy; i++) {
          const graczId = partia[`gracz${i}_id`]
          if (graczId) graczeIds.push(graczId)
        }

        const { data: gracze } = await supabase
          .from('gracz')
          .select('id, imie, nazwisko')
          .in('id', graczeIds)

        return {
          ...partia,
          gracze: gracze || []
        }
      })
    )

    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-6">
          {/* Nagłówek */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="inline-flex items-center text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Powrót do panelu
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-sky-50">Wszystkie partie</h1>
                <p className="mt-1 text-sm text-slate-400">Zarządzanie partiami w systemie</p>
              </div>
            </div>
          </div>

          {/* Komponent kliencki z partiami */}
          <PartieClient partie={partieZGraczami} />
        </div>
      </main>
    )

  } catch (error) {
    console.error('Błąd:', error)
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6">
          <h1 className="text-2xl font-semibold text-sky-50 mb-4">Wszystkie partie - Panel admina</h1>
          <div className="rounded-md border border-red-400/50 bg-red-500/10 px-4 py-3 text-red-200">
            Nie udało się pobrać danych partii.
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center text-sky-400 hover:text-sky-300 mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do panelu admina
          </Link>
        </div>
      </main>
    )
  }
}