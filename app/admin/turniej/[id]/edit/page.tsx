import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import Link from 'next/link'
import MapPicker from '@/components/MapPicker'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = Promise<{ id: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

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
    .maybeSingle()

  if (!t) redirect('/admin/turniej')

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edytuj: {t.nazwa}</h1>
        <Link href="/admin/turniej" className="pill pill--secondary">← Lista</Link>
      </div>

      {ok && <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">Zapisano.</div>}
      {err && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Nie udało się zapisać.</div>}

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
            <input type="number" name="pierwszy_wiersz_z_nazwiskiem" defaultValue={t.pierwszy_wiersz_z_nazwiskiem ?? 2} min={1} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Limit graczy</label>
            <input type="number" name="limit_graczy" defaultValue={t.limit_graczy ?? ''} min={1} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        {/* LAT/LNG + przycisk MapPicker */}
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
    </main>
  )
}
