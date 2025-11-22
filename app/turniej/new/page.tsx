import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import MapPicker from '@/components/MapPicker'
import AutoHide from '@/components/AutoHide'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewTurniejPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const ok = sp.ok === '1'
  const err = typeof sp.e === 'string' ? sp.e : undefined

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 bg-slate-900">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-sky-50">Dodaj turniej</h1>

        {ok && (
          <AutoHide>
            <div className="rounded-md border border-green-400/50 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              Turniej został utworzony.
            </div>
          </AutoHide>
        )}
        {err && (
          <AutoHide>
            <div className="rounded-md border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {{
                invalid_input: 'Nieprawidłowe dane formularza.',
                date_time_required: 'Podaj datę i godzinę wydarzenia.',
                sheet_col_invalid: 'Kolumna nazwisk musi być literą (A–Z).',
                number_invalid: 'Nieprawidłowa wartość liczbowa.',
                url_invalid: 'Link musi zaczynać się od http(s)://',
              }[err] ?? 'Nie udało się zapisać.'}
            </div>
          </AutoHide>
        )}

        <form action="/turniej/create" method="post" className="space-y-5">
          {/* Nazwa turnieju */}
          <div>
            <label className="block text-sm font-medium text-sky-100">Nazwa turnieju *</label>
            <input 
              name="nazwa" 
              required 
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
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-100">Godzina startu *</label>
              <input 
                type="time" 
                name="godzina_turnieju" 
                required 
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-100">Godzina zakończenia</label>
              <input 
                type="time" 
                name="zakonczenie_turnieju" 
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              />
            </div>
          </div>

          {/* Arkusz Google */}
          <div>
            <label className="block text-sm font-medium text-sky-100">Link do arkusza Google (opcjonalnie)</label>
            <input 
              name="gsheet_url" 
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              placeholder="https://docs.google.com/spreadsheets/d/..." 
            />
            <p className="mt-1 text-xs text-slate-400">ID arkusza wyciągniemy automatycznie.</p>
          </div>

          {/* Szczegóły arkusza */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-sky-100">Nazwa karty (opcjonalnie)</label>
              <input 
                name="arkusz_nazwa" 
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                placeholder="np. Lista" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-100">Kolumna nazwisk</label>
              <input 
                name="kolumna_nazwisk" 
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                placeholder="np. B" 
                maxLength={2} 
              />
              <p className="mt-1 text-xs text-slate-400">Jedna litera A-Z.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-100">Pierwszy wiersz z nazwiskiem</label>
              <input 
                type="number" 
                name="pierwszy_wiersz_z_nazwiskiem" 
                min={1} 
                defaultValue={2} 
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
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sky-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
              />
            </div>
          </div>

          {/* Lokalizacja - współrzędne i mapa */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-sky-100">Lokalizacja turnieju</label>
            <div className="rounded-lg border border-slate-600 bg-slate-900/80 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                <div>
                  <label className="block text-xs font-medium text-sky-200 mb-1">Szerokość (lat)</label>
                  <input 
                    id="lat" 
                    name="lat" 
                    className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                    placeholder="52.2297" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sky-200 mb-1">Długość (lng)</label>
                  <input 
                    id="lng" 
                    name="lng" 
                    className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-sky-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                    placeholder="21.0122" 
                  />
                </div>
              </div>
              
              {/* Przycisk do otwarcia mapy */}
              <MapPicker
                targetLatId="lat"
                targetLngId="lng"
                lat={null}
                lng={null}
                buttonLabel="Ustaw pinezkę na mapie"
              />
            </div>
          </div>

          {/* Przyciski akcji */}
          <div className="flex gap-2 pt-4">
            <button 
              className="rounded-full bg-sky-600 hover:bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800" 
              type="submit"
            >
              Utwórz turniej
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