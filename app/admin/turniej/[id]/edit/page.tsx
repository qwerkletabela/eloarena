// app/admin/turniej/[id]/edit/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import Link from 'next/link'
import MapPicker from '@/components/MapPicker'
import AutoHide from '@/components/AutoHide'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = Promise<{ id: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

type TurniejRow = {
  id: string
  nazwa: string | null
  data_turnieju: string | null
  godzina_turnieju: string | null
  gsheet_url: string | null
  gsheet_id: string | null
  arkusz_nazwa: string | null
  kolumna_nazwisk: string | null
  pierwszy_wiersz_z_nazwiskiem: number | null
  limit_graczy: number | null
  lat: number | null
  lng: number | null
}

type WynikRow = {
  id: string
  gracz_id: string
  full_name: string | null
  club: string | null
  status: string | null
  seed: number | null
  miejsce: number | null
  punkty: number | null
}

export default async function EditTurniejPage({ params, searchParams }: { params: Params, searchParams: SearchParams }) {
  const { id } = await params
  const sp = await searchParams
  const ok = sp.ok === '1'
  const err = typeof sp.e === 'string' ? sp.e : undefined

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const { data: t } = await supabase
    .from('turniej')
    .select('*')
    .eq('id', id)
    .maybeSingle<TurniejRow>()

  if (!t) redirect('/admin/turniej')

  // (opcjonalnie) lista uczestników z widoku v_wyniki – podgląd poniżej
  const { data: uczestnicy } = await supabase
    .from('v_wyniki')
    .select('id, gracz_id, full_name, club, status, seed, miejsce, punkty')
    .eq('turniej_id', id)
    .order('miejsce', { ascending: true, nullsFirst: false })
    .order('seed', { ascending: true, nullsFirst: false })
    .returns<WynikRow[]>()

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edytuj: {t.nazwa}</h1>
        <Link href="/admin/turniej" className="pill pill--secondary">← Lista</Link>
      </div>

      {ok && (
        <AutoHide>
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Zapisano.
          </div>
        </AutoHide>
      )}
      {err && (
        <AutoHide>
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err === 'no_tournament' && 'Nie znaleziono turnieju.'}
            {err === 'missing_sheet_cfg' && 'Uzupełnij link arkusza, kolumnę i pierwszy wiersz.'}
            {err === 'bad_sheet_url' && 'Nieprawidłowy link do arkusza Google.'}
            {err === 'fetch_failed' && 'Nie udało się pobrać CSV z arkusza (sprawdź udostępnienie).'}
            {err === 'col_invalid' && 'Nieprawidłowa kolumna (wpisz literę, np. B).'}
            {err === 'empty_after_parse' && 'Po parsowaniu arkusza nie znaleziono żadnych nazwisk.'}
            {err === 'gracz_upsert_failed' && 'Błąd podczas zapisu graczy.'}
            {!['no_tournament','missing_sheet_cfg','bad_sheet_url','fetch_failed','col_invalid','empty_after_parse','gracz_upsert_failed'].includes(err) && 'Nie udało się zapisać.'}
          </div>
        </AutoHide>
      )}

      {/* Formularz podstawowych danych turnieju */}
      <form action={`/admin/turniej/${t.id}/update`} method="post" className="space-y-5">
        <div>
          <label className="block text-sm font-medium">Nazwa *</label>
          <input name="nazwa" defaultValue={t.nazwa ?? ''} required className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Data *</label>
            <input type="date" name="data_turnieju" defaultValue={t.data_turnieju ?? ''} required className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Godzina *</label>
            <input type="time" name="godzina_turnieju" defaultValue={t.godzina_turnieju ?? ''} required className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Link do arkusza Google</label>
          <input name="gsheet_url" defaultValue={t.gsheet_url ?? ''} className="mt-1 w-full rounded border px-3 py-2" placeholder="https://docs.google.com/..." />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">ID arkusza</label>
            <input name="gsheet_id" defaultValue={t.gsheet_id ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Nazwa karty</label>
            <input name="arkusz_nazwa" defaultValue={t.arkusz_nazwa ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Kolumna nazwisk</label>
            <input name="kolumna_nazwisk" defaultValue={t.kolumna_nazwisk ?? ''} className="mt-1 w-full rounded border px-3 py-2" placeholder="np. B" maxLength={2} />
          </div>
          <div>
            <label className="block text-sm font-medium">Pierwszy wiersz</label>
            <input
              type="number"
              name="pierwszy_wiersz_z_nazwiskiem"
              defaultValue={t.pierwszy_wiersz_z_nazwiskiem ?? 2}
              min={1}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Limit graczy</label>
            <input type="number" name="limit_graczy" defaultValue={t.limit_graczy ?? ''} min={1} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        {/* LAT/LNG + przycisk MapPicker */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Lat</label>
            <input id="lat" name="lat" defaultValue={t.lat ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Lng</label>
            <input id="lng" name="lng" defaultValue={t.lng ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div className="flex items-end">
            <MapPicker
              targetLatId="lat"
              targetLngId="lng"
              lat={t.lat ?? null}
              lng={t.lng ?? null}
              buttonLabel="Ustaw pinezkę"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button className="pill pill--primary" type="submit">Zapisz</button>
          <Link href="/admin/turniej" className="pill pill--secondary">Anuluj</Link>
        </div>
      </form>

      {/* --- Import z arkusza Google --- */}
      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Uczestnicy / Import</h2>
          <form action={`/admin/turniej/${t.id}/import`} method="post">
            <button className="pill pill--secondary" type="submit">Wczytaj z arkusza</button>
          </form>
        </div>

        <p className="text-xs text-slate-600">
          Źródło: {t.gsheet_url ? <a className="underline" href={t.gsheet_url} target="_blank" rel="noreferrer">Google Sheet</a> : '—'}
          {t.arkusz_nazwa ? <> • karta: <strong>{t.arkusz_nazwa}</strong></> : null}
          {t.kolumna_nazwisk ? <> • kolumna: <strong>{t.kolumna_nazwisk}</strong></> : null}
          {typeof t.pierwszy_wiersz_z_nazwiskiem === 'number' ? <> • od wiersza: <strong>{t.pierwszy_wiersz_z_nazwiskiem}</strong></> : null}
        </p>
      </section>

      {/* --- Podgląd uczestników (jeśli jest widok v_wyniki) --- */}
      <section className="space-y-2">
        <h3 className="text-base font-semibold">Lista uczestników</h3>
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-red-50">
              <tr className="border-b">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Zawodnik</th>
                <th className="px-3 py-2 text-left">Klub</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Seed</th>
                <th className="px-3 py-2 text-left">Miejsce</th>
                <th className="px-3 py-2 text-left">Punkty</th>
              </tr>
            </thead>
            <tbody>
              {uczestnicy?.map((r, i) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{r.full_name ?? '—'}</td>
                  <td className="px-3 py-2">{r.club ?? '—'}</td>
                  <td className="px-3 py-2">{r.status ?? 'registered'}</td>
                  <td className="px-3 py-2">{r.seed ?? '—'}</td>
                  <td className="px-3 py-2">{r.miejsce ?? '—'}</td>
                  <td className="px-3 py-2">{r.punkty ?? '—'}</td>
                </tr>
              ))}
              {!uczestnicy?.length && (
                <tr>
                  <td className="px-3 py-6 text-sm opacity-60" colSpan={7}>
                    Brak uczestników. Użyj „Wczytaj z arkusza”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
