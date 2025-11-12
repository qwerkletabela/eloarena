import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import MapPicker from '@/components/MapPicker'   // <— NOWE
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
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dodaj turniej</h1>

      {ok && (
        <AutoHide>
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Turniej został utworzony.
        </div>
        </AutoHide>
      )}
      {err && (
        <AutoHide>
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
        <div>
          <label className="block text-sm font-medium">Nazwa turnieju *</label>
          <input name="nazwa" required className="mt-1 w-full rounded border px-3 py-2" placeholder="np. ELO Arena Open" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Data turnieju *</label>
            <input type="date" name="data_turnieju" required className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Godzina startu *</label>
            <input type="time" name="godzina_turnieju" required className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Link do arkusza Google (opcjonalnie)</label>
          <input name="gsheet_url" className="mt-1 w-full rounded border px-3 py-2" placeholder="https://docs.google.com/spreadsheets/d/..." />
          <p className="mt-1 text-xs text-slate-500">ID arkusza wyciągniemy automatycznie (lub podaj poniżej).</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">ID arkusza (opcjonalnie)</label>
            <input name="gsheet_id" className="mt-1 w-full rounded border px-3 py-2" placeholder="np. 1AbCDeFg..." />
          </div>
          <div>
            <label className="block text-sm font-medium">Nazwa karty (opcjonalnie)</label>
            <input name="arkusz_nazwa" className="mt-1 w-full rounded border px-3 py-2" placeholder="np. Lista" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Kolumna nazwisk</label>
            <input name="kolumna_nazwisk" className="mt-1 w-full rounded border px-3 py-2" placeholder="np. B" maxLength={2} />
            <p className="mt-1 text-xs text-slate-500">Jedna litera A–Z.</p>
          </div>
          <div>
            <label className="block text-sm font-medium">Pierwszy wiersz z nazwiskiem</label>
            <input type="number" name="pierwszy_wiersz_z_nazwiskiem" min={1} defaultValue={2} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Limit graczy (opcjonalnie)</label>
            <input type="number" name="limit_graczy" min={1} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        {/* NOWE: LAT/LNG + guzik „Dodaj pinezkę” */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Lat</label>
            <input id="lat" name="lat" className="mt-1 w-full rounded border px-3 py-2" placeholder="np. 52.2297" />
          </div>
          <div>
            <label className="block text-sm font-medium">Lng</label>
            <input id="lng" name="lng" className="mt-1 w-full rounded border px-3 py-2" placeholder="np. 21.0122" />
          </div>
          <div className="flex items-end">
            <MapPicker
              targetLatId="lat"
              targetLngId="lng"
              lat={null}
              lng={null}
              buttonLabel="Dodaj pinezkę"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button className="pill pill--primary" type="submit">Utwórz</button>
          <a href="/admin" className="pill pill--secondary">Anuluj</a>
        </div>
      </form>
    </main>
  )
}
