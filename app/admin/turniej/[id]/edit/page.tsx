// elo-arena/app/admin/turniej/[id]/edit/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import AutoHide from '@/components/AutoHide'
import { MapPin, Clock, CalendarDays, Trophy } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface EditTurniejPageProps {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EditTurniejPage(props: EditTurniejPageProps) {
  const params = await props.params
  const searchParams = await props.searchParams
  const supabase = await createSupabaseServer()

  // Sprawdź autoryzację
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  // Pobierz istniejące miejsca turnieju
  const { data: miejsca } = await supabase
    .from('miejsce_turnieju')
    .select('id, nazwa, miasto, wojewodztwo, adres')
    .order('nazwa', { ascending: true })

  // Pobierz turniej do edycji
  const { data: turniej } = await supabase
    .from('turniej')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!turniej) {
    redirect('/admin?error=turniej_not_found')
  }

  // Obsługa komunikatów
  const errorMessages: Record<string, string> = {
    invalid_input: 'Wypełnij wszystkie wymagane pola',
    miejsce_required: 'Wybierz miejsce turnieju',
    sheet_col_invalid: 'Kolumna nazwisk musi być pojedynczą literą (A-Z)',
    number_invalid: 'Wprowadź poprawną liczbę',
    url_invalid: 'Wprowadź poprawny URL',
    save_failed: 'Zapis nie powiódł się. Spróbuj ponownie.',
    place_not_found: 'Wybrane miejsce nie istnieje',
  }

  const error = searchParams?.e as string
  const success = searchParams?.ok as string

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-8 py-16">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-6">
        <h1 className="text-4xl font-bold text-sky-50 mb-2 text-center">Edytuj turniej</h1>

        {/* Komunikaty */}
        {error && (
          <div className="rounded-md border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            ❌ {errorMessages[error] || 'Wystąpił nieznany błąd'}
          </div>
        )}
        
        {success && (
          <AutoHide ms={5000}>
            <div className="rounded-md border border-green-400/50 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              ✅ Turniej został zaktualizowany pomyślnie!
            </div>
          </AutoHide>
        )}

        <form action={`/admin/turniej/${params.id}/update`} method="post" className="space-y-5">
          {/* Nazwa turnieju */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-sky-100">
              <Trophy size={18} /><span>Nazwa turnieju:</span>
            </label>
            <input 
              name="nazwa" 
              required 
              defaultValue={turniej.nazwa}
              className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              placeholder="np. ELO Arena Open" 
            />
          </div>

          {/* Data i godziny */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-sky-100">
                <CalendarDays size={18} /><span>Data turnieju:</span>
              </label>
              <input 
                type="date" 
                name="data_turnieju" 
                required 
                defaultValue={turniej.data_turnieju || ''}
                className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-sky-100">
                <Clock size={18} /><span>Godzina rozpoczęcia:</span>
              </label>
              <input 
                type="time" 
                name="godzina_turnieju" 
                required 
                defaultValue={turniej.godzina_turnieju || ''}
                className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-sky-100">
                <Clock size={18} /><span>Godzina zakończenia: *</span>
              </label>
              <input 
                type="time" 
                name="zakonczenie_turnieju" 
                defaultValue={turniej.zakonczenie_turnieju || ''}
                className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              />
            </div>
          </div>

          {/* Miejsce turnieju */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-sky-100">
              <MapPin size={18} /><span>Miejsce turnieju *</span>
            </label>
            <select 
              name="miejsce_id" 
              required
              defaultValue={turniej.miejsce_id || ''}
              className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">— wybierz z listy —</option>
              {miejsca?.map((miejsce) => (
                <option key={miejsce.id} value={miejsce.id}>
                  {miejsce.nazwa} - {miejsce.miasto}
                  {miejsce.wojewodztwo && `, ${miejsce.wojewodztwo}`}
                </option>
              ))}
            </select>
            <div className="mt-2 flex justify-end items-center">
              <a 
                href="/admin/miejsca/new" 
                className="text-xs text-sky-400 hover:text-sky-300 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Dodaj nowe miejsce →
              </a>
            </div>
          </div>

          {/* Arkusz Google */}
          <div>
            <label className="block text-sm font-medium text-sky-100">Link do arkusza Google (opcjonalnie)</label>
            <input 
              name="gsheet_url" 
              defaultValue={turniej.gsheet_url || ''}
              className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              placeholder="https://..." 
            />
          </div>

          {/* Szczegóły arkusza */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-sky-100">Nazwa karty (opcjonalnie)</label>
              <input 
                name="arkusz_nazwa" 
                defaultValue={turniej.arkusz_nazwa || ''}
                className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                placeholder="" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-100">Kolumna z nazwiskami</label>
              <input 
                name="kolumna_nazwisk" 
                defaultValue={turniej.kolumna_nazwisk || ''}
                className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                placeholder="" 
                maxLength={2} 
              />
              <p className="mt-1 text-xs text-slate-400">Jedna litera A-Z.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-100">Pierwszy wiersz z nazwiskiem</label>
              <input 
                //type="number" 
                name="pierwszy_wiersz_z_nazwiskiem" 
                min={1} 
                defaultValue={turniej.pierwszy_wiersz_z_nazwiskiem || ''}
                className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                placeholder=""
              />
            </div>
          </div>

          {/* Limit graczy */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-sky-100">Limit graczy (opcjonalnie)</label>
              <input 
                //type="number" 
                name="limit_graczy" 
                min={1} 
                defaultValue={turniej.limit_graczy || ''}
                className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                placeholder="Bez limitu"
              />
            </div>
          </div>

          {/* Przyciski akcji */}
          <div className="flex gap-2 pt-4">
            <button 
              className="w-full rounded-full bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.9)] transition-all hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_14px_35px_rgba(15,23,42,1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-sky-500 disabled:hover:to-sky-600 disabled:hover:shadow-[0_10px_25px_rgba(15,23,42,0.9)]" 
              type="submit"
            >
              Zapisz zmiany
            </button>
            <a 
              href="/admin" 
              className="w-full rounded-full bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.9)] transition-all hover:from-red-400 hover:to-red-500 hover:shadow-[0_14px_35px_rgba(15,23,42,1)] active:scale-[0.98] text-center"
            >
              Anuluj
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}