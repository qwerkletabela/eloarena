// elo-arena/app/admin/turniej/[id]/edit/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import AutoHide from '@/components/AutoHide'
import {
  MapPin,
  Clock,
  CalendarDays,
  Trophy,
  Link as LinkIcon,
  Sheet as SheetIcon,
  Hash,
  Users,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface EditTurniejPageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

type MiejsceRow = {
  id: string
  nazwa: string
  miasto: string
  wojewodztwo: string | null
}

/** value MUSI odpowiadać temu, co jest w kolumnie `gra` (enum) */
const GAME_VARIANTS = [
  { value: 'rummikub_standard', label: 'Rummikub – Standard' },
  { value: 'rummikub_twist', label: 'Rummikub – Twist' },
  { value: 'qwirkle', label: 'Qwirkle' },
] as const

export default async function EditTurniejPage(props: EditTurniejPageProps) {
  const params = await props.params
  const searchParams = await props.searchParams
  const supabase = await createSupabaseServer()

  // 🔐 AUTORYZACJA
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  // 📍 MIEJSCA
  const { data: miejsca } = await supabase
    .from('miejsce_turnieju')
    .select('id, nazwa, miasto, wojewodztwo')
    .order('nazwa', { ascending: true })

  // 🏆 TURNIEJ
  const { data: turniej } = await supabase
    .from('turniej')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!turniej) redirect('/admin?error=turniej_not_found')

  // komunikaty błędów (pasują do route.ts)
  const errorMessages: Record<string, string> = {
    invalid_input: 'Wypełnij wszystkie wymagane pola',
    date_time_required: 'Podaj datę i godzinę wydarzenia',
    invalid_game: 'Wybrano nieprawidłową grę / wariant',
    invalid_location_id: 'Nieprawidłowy identyfikator miejsca',
    place_not_found: 'Wybrane miejsce nie istnieje',
    sheet_col_invalid: 'Kolumna nazwisk musi być pojedynczą literą (A–Z)',
    number_invalid: 'Wprowadź poprawną liczbę',
    url_invalid: 'Wprowadź poprawny URL',
    save_failed: 'Zapis nie powiódł się. Spróbuj ponownie.',
    server_error: 'Błąd serwera. Spróbuj ponownie.',
    invalid_id: 'Nieprawidłowy identyfikator turnieju.',
    game_required: 'Wybierz grę / wariant',
    gra_locked: 'Nie można zmienić gry po dodaniu pierwszej partii',
  }

  const error = (searchParams?.e as string) || ''
  const success = (searchParams?.ok as string) || ''

  const currentGame: string = (turniej as any).gra || ''
  const currentGameLabel =
    GAME_VARIANTS.find((v) => v.value === currentGame)?.label || '— nie ustawiono —'

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-6 sm:px-8 py-12 sm:py-16">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-800/95 border border-slate-700 shadow-[0_14px_40px_rgba(0,0,0,0.8)] p-6 space-y-6">
        <h1 className="text-4xl font-bold text-sky-50 text-center">Edytuj turniej</h1>

        {error && (
          <div className="rounded-md border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            ❌ {errorMessages[error] || 'Wystąpił nieznany błąd'}
          </div>
        )}

        {success && (
          <AutoHide ms={5000}>
            <div className="rounded-md border border-green-400/50 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              ✅ Turniej został zaktualizowany
            </div>
          </AutoHide>
        )}

        <form action={`/admin/turniej/${params.id}/update`} method="post" className="space-y-6">
          {/* NAZWA */}
          <div>
            <label className="flex items-center gap-2 text-sm text-sky-100">
              <Trophy size={18} /> Nazwa turnieju
            </label>
            <input
              name="nazwa"
              required
              defaultValue={(turniej as any).nazwa ?? ''}
              className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sky-100"
            />
          </div>

          {/* GRA / WARIANT */}
          <div>
            <label className="flex items-center gap-2 text-sm text-sky-100">
              <Trophy size={18} /> Gra / wariant
            </label>

            <div className="mt-1 rounded-xl border border-slate-600 bg-slate-900/60 px-3 py-2 text-sky-100">
              <span className="text-slate-400 text-sm mr-2">Aktualnie:</span>
              <span className="font-semibold">{currentGameLabel}</span>
              <span className="ml-2 text-xs text-slate-400">({currentGame || 'brak'})</span>
            </div>

            <select
              name="gra"
              required
              defaultValue={currentGame}
              className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sky-100"
            >
              <option value="">— wybierz z listy —</option>
              {GAME_VARIANTS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-slate-400">
              Uwaga: po dodaniu pierwszej partii zmiana gry może być zablokowana.
            </p>
          </div>

          {/* DATA / GODZINY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-sky-100">
                <CalendarDays size={18} /> Data
              </label>
              <input
                type="date"
                name="data_turnieju"
                required
                defaultValue={(turniej as any).data_turnieju || ''}
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sky-100"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-sky-100">
                <Clock size={18} /> Start
              </label>
              <input
                type="time"
                name="godzina_turnieju"
                required
                defaultValue={(turniej as any).godzina_turnieju || ''}
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sky-100"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-sky-100">
                <Clock size={18} /> Koniec
              </label>
              <input
                type="time"
                name="zakonczenie_turnieju"
                defaultValue={(turniej as any).zakonczenie_turnieju || ''}
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sky-100"
              />
            </div>
          </div>

          {/* LIMIT GRACZY */}
          <div>
            <label className="flex items-center gap-2 text-sm text-sky-100">
              <Users size={18} /> Limit graczy (opcjonalnie)
            </label>
            <input
              type="number"
              name="limit_graczy"
              min={1}
              placeholder="np. 32"
              defaultValue={(turniej as any).limit_graczy ?? ''}
              className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sky-100"
            />
            <p className="mt-1 text-xs text-slate-400">Puste = brak limitu.</p>
          </div>

          {/* MIEJSCE */}
          <div>
            <label className="flex items-center gap-2 text-sm text-sky-100">
              <MapPin size={18} /> Miejsce (opcjonalnie)
            </label>
            <select
              name="miejsce_id"
              defaultValue={(turniej as any).miejsce_id || ''}
              className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sky-100"
            >
              <option value="">— brak / nie ustawiono —</option>
              {(miejsca as MiejsceRow[] | null)?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nazwa} – {m.miasto}
                  {m.wojewodztwo && `, ${m.wojewodztwo}`}
                </option>
              ))}
            </select>
          </div>

          {/* GOOGLE SHEETS */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/30 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sky-100">
              <SheetIcon size={18} />
              <h2 className="font-semibold">Import z Google Sheets (opcjonalnie)</h2>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-sky-100">
                <LinkIcon size={18} /> Link do arkusza (gsheet_url)
              </label>
              <input
                name="gsheet_url"
                placeholder="https://..."
                defaultValue={(turniej as any).gsheet_url || ''}
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sky-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-sky-100">
                  <SheetIcon size={18} /> Nazwa arkusza (arkusz_nazwa)
                </label>
                <input
                  name="arkusz_nazwa"
                  placeholder="np. Sheet1"
                  defaultValue={(turniej as any).arkusz_nazwa || ''}
                  className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sky-100"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-sky-100">
                  <Hash size={18} /> Kolumna nazwisk (A–Z)
                </label>
                <input
                  name="kolumna_nazwisk"
                  placeholder="np. A"
                  maxLength={1}
                  defaultValue={(turniej as any).kolumna_nazwisk || ''}
                  className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sky-100 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-sky-100">
                <Hash size={18} /> Pierwszy wiersz z nazwiskiem
              </label>
              <input
                type="number"
                name="pierwszy_wiersz_z_nazwiskiem"
                min={1}
                placeholder="np. 2"
                defaultValue={(turniej as any).pierwszy_wiersz_z_nazwiskiem ?? ''}
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sky-100"
              />
            </div>
          </div>

          {/* AKCJE */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="w-full rounded-full bg-sky-600 hover:bg-sky-500 py-3 text-white font-semibold"
            >
              Zapisz zmiany
            </button>
            <a
              href="/admin"
              className="w-full rounded-full bg-red-600 hover:bg-red-500 py-3 text-white font-semibold text-center"
            >
              Anuluj
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}
