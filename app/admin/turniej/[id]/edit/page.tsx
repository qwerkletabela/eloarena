import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import AutoHide from '@/components/AutoHide' // Zaimportuj komponent AutoHide

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
    .select('id, nazwa, miasto, wojewodztwo, adres, latitude, longitude')
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
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 bg-slate-900">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-sky-50">Edytuj turniej</h1>

        {/* Komunikaty */}
        {error && (
          <div className="rounded-lg border-2 border-red-500 bg-red-500/20 px-4 py-4 text-base font-medium text-red-100">
            ❌ {errorMessages[error] || 'Wystąpił nieznany błąd'}
          </div>
        )}
        
        {success && (
          <AutoHide ms={5000}>
            <div className="rounded-lg border-2 border-green-500 bg-green-500/20 px-4 py-4 text-base font-medium text-green-100 animate-pulse">
              ✅ Turniej został zaktualizowany pomyślnie!
            </div>
          </AutoHide>
        )}

        <form action={`/admin/turniej/${params.id}/update`} method="post" className="space-y-5">
          {/* Nazwa turnieju */}
          <div>
            <label className="block text-sm font-medium text-sky-100">Nazwa turnieju *</label>
            <input 
              name="nazwa" 
              required 
              defaultValue={turniej.nazwa}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              placeholder="np. ELO Arena Open" 
            />
          </div>

          {/* Data i godziny */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-sky-100">Data turnieju *</label>
              <input 
                type="date" 
                name="data_turnieju" 
                required 
                defaultValue={turniej.data_turnieju || ''}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-100">Godzina startu *</label>
              <input 
                type="time" 
                name="godzina_turnieju" 
                required 
                defaultValue={turniej.godzina_turnieju || ''}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-100">Godzina zakończenia</label>
              <input 
                type="time" 
                name="zakonczenie_turnieju" 
                defaultValue={turniej.zakonczenie_turnieju || ''}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              />
            </div>
          </div>

          {/* Miejsce turnieju */}
          <div>
            <label className="block text-sm font-medium text-sky-100">Miejsce turnieju *</label>
            <select 
              name="miejsce_id" 
              required
              defaultValue={turniej.miejsce_id || ''}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">— wybierz miejsce turnieju —</option>
              {miejsca?.map((miejsce) => (
                <option key={miejsce.id} value={miejsce.id}>
                  {miejsce.nazwa} - {miejsce.miasto}
                  {miejsce.wojewodztwo && `, ${miejsce.wojewodztwo}`}
                </option>
              ))}
            </select>
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-slate-400">
                Jeśli nie ma odpowiedniego miejsca, dodaj je najpierw w panelu administracyjnym.
              </p>
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
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              placeholder="https://docs.google.com/spreadsheets/d/..." 
            />
          </div>

          {/* ID arkusza Google */}
          <div>
            <label className="block text-sm font-medium text-sky-100">ID arkusza Google (opcjonalnie)</label>
            <input 
              name="gsheet_id" 
              defaultValue={turniej.gsheet_id || ''}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              placeholder="np. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" 
            />
          </div>

          {/* Szczegóły arkusza */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-sky-100">Nazwa karty (opcjonalnie)</label>
              <input 
                name="arkusz_nazwa" 
                defaultValue={turniej.arkusz_nazwa || ''}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                placeholder="np. Lista" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-100">Kolumna nazwisk</label>
              <input 
                name="kolumna_nazwisk" 
                defaultValue={turniej.kolumna_nazwisk || ''}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                placeholder="np. B" 
                maxLength={2} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-100">Pierwszy wiersz z nazwiskiem</label>
              <input 
                type="number" 
                name="pierwszy_wiersz_z_nazwiskiem" 
                min={1} 
                defaultValue={turniej.pierwszy_wiersz_z_nazwiskiem || 2}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              />
            </div>
          </div>

          {/* Limit graczy */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-sky-100">Limit graczy (opcjonalnie)</label>
              <input 
                type="number" 
                name="limit_graczy" 
                min={1} 
                defaultValue={turniej.limit_graczy || ''}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              />
            </div>
          </div>

          {/* Przyciski akcji */}
          <div className="flex gap-2 pt-4">
            <button 
              className="rounded-full bg-sky-600 hover:bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800" 
              type="submit"
            >
              Zapisz zmiany
            </button>
            <a 
              href="/admin" 
              className="rounded-full border border-slate-600 bg-slate-700 hover:bg-slate-600 px-6 py-2 text-sm font-semibold text-sky-100 transition"
            >
              Anuluj
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}