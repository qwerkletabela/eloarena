'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Users,
  X,
  Trophy,
  Plus,
  Minus,
  CheckCircle2,
  Hash,
  LayoutGrid,
} from 'lucide-react'

interface Gracz {
  id: string
  imie: string
  nazwisko: string
  aktualny_elo: number
}

interface Turniej {
  id: string
  nazwa: string
}

interface NowaPartiaFormProps {
  turniej: Turniej
  gracze: Gracz[] | null
  kolejnyNumer: number
  turniejId: string
}

type PartiaData = {
  duzyPunkt: string
  malePunkty: (number | null)[]
}

/** ===== Autocomplete po min. 2 literach + portal do body (zawsze ponad wszystkim) ===== */
function PlayerAutocomplete({
  value,
  onChangeValue,
  selectedId,
  onPick,
  onClear,
  options,
  required,
}: {
  value: string
  onChangeValue: (v: string) => void
  selectedId: string | null
  onPick: (id: string, display: string) => void
  onClear: () => void
  options: Array<{ id: string; display: string }>
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [rect, setRect] = useState<{ left: number; top: number; width: number }>({
    left: 0,
    top: 0,
    width: 0,
  })

  useEffect(() => setMounted(true), [])

  const updateRect = () => {
    const el = inputRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setRect({ left: r.left, top: r.bottom + 6, width: r.width })
  }

  useEffect(() => {
    if (!open) return
    updateRect()

    const onScroll = () => updateRect()
    const onResize = () => updateRect()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (q.length < 2) return []
    return options.filter((o) => o.display.toLowerCase().includes(q)).slice(0, 12)
  }, [value, options])

  const showDropdown = open && !selectedId && value.trim().length >= 2

  const dropdown =
    mounted && showDropdown
      ? createPortal(
          <div
            style={{
              position: 'fixed',
              left: rect.left,
              top: rect.top,
              width: rect.width,
              zIndex: 999999,
            }}
            className="overflow-hidden rounded-xl border border-slate-600 bg-slate-900 shadow-2xl"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">Brak wyników</div>
            ) : (
              <ul className="max-h-72 overflow-auto">
                {filtered.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onPick(o.id, o.display)
                        setOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                    >
                      {o.display}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )
      : null

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChangeValue(e.target.value)
          setOpen(true)
          queueMicrotask(updateRect)
        }}
        onFocus={() => {
          setOpen(true)
          queueMicrotask(updateRect)
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="w-full bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm pr-9
                   focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
        placeholder="Wpisz min. 2 litery…"
        required={required}
        autoComplete="off"
      />

      {selectedId && (
        <button
          type="button"
          onClick={() => {
            onClear()
            setOpen(false)
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          aria-label="Wyczyść"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {!selectedId && (
        <div className="mt-1 text-xs text-slate-400">Podpowiedzi po wpisaniu 2 znaków</div>
      )}

      {dropdown}
    </div>
  )
}

/** ===== małe helpery do UI ===== */
function Section({
  step,
  title,
  icon,
  children,
  description,
}: {
  step: number
  title: string
  icon: React.ReactNode
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/60">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300 border border-sky-500/20">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Krok {step}</span>
              <h3 className="text-base font-semibold text-white">{title}</h3>
            </div>
            {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
          </div>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  )
}

export default function NowaPartiaForm({
  turniej,
  gracze,
  kolejnyNumer,
  turniejId,
}: NowaPartiaFormProps) {
  const router = useRouter()

  // 1) stolik (wspólny)
  const [stolik, setStolik] = useState<number | null>(1)

  // 2) ilość partii
  const [liczbaPartii, setLiczbaPartii] = useState(1)

  // 3) gracze
  const [selectedGracze, setSelectedGracze] = useState<(string | null)[]>([null, null, null, null])
  const [searchValues, setSearchValues] = useState<string[]>(['', '', '', ''])

  // 4) wyniki
  const [partieDane, setPartieDane] = useState<PartiaData[]>([
    { duzyPunkt: '', malePunkty: [null, null, null, null] },
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const graczeOptions = useMemo(() => {
    if (!gracze) return []
    return gracze.map((g) => ({ id: g.id, display: `${g.imie} ${g.nazwisko}` }))
  }, [gracze])

  const liczbaWybranychGraczy = selectedGracze.filter((g) => g !== null).length

  const getAvailableGracze = (currentIndex: number) => {
    return graczeOptions.filter(
      (opt) => !selectedGracze.some((selected, idx) => idx !== currentIndex && selected === opt.id)
    )
  }

  const clearField = (index: number) => {
    const removedId = selectedGracze[index]

    const newSearch = [...searchValues]
    newSearch[index] = ''
    setSearchValues(newSearch)

    const newSel = [...selectedGracze]
    newSel[index] = null
    setSelectedGracze(newSel)

    setPartieDane((prev) =>
      prev.map((p) => ({
        ...p,
        duzyPunkt: p.duzyPunkt === removedId ? '' : p.duzyPunkt,
        malePunkty: p.malePunkty.map((val, i) => (i === index ? null : val)),
      }))
    )
  }

  const handleLiczbaPartiiChange = (newLiczba: number) => {
    if (newLiczba < 1 || newLiczba > 10) return

    if (newLiczba > liczbaPartii) {
      setPartieDane((prev) => {
        const next = [...prev]
        for (let i = liczbaPartii; i < newLiczba; i++) {
          // ✅ brak domyślnego zwycięzcy
          next.push({ duzyPunkt: '', malePunkty: [null, null, null, null] })
        }
        return next
      })
    } else {
      setPartieDane((prev) => prev.slice(0, newLiczba))
    }

    setLiczbaPartii(newLiczba)
  }

  const handleDuzyPunktChange = (partiaIndex: number, graczId: string) => {
    setPartieDane((prev) => {
      const next = [...prev]
      next[partiaIndex] = { ...next[partiaIndex], duzyPunkt: graczId }
      return next
    })
  }

  const handleMalePunktyChange = (partiaIndex: number, graczIndex: number, valueRaw: string) => {
    const trimmed = valueRaw.trim()
    const value = trimmed === '' ? null : Number(trimmed)
    const safeValue = value === null ? null : Number.isFinite(value) ? value : null

    setPartieDane((prev) => {
      const next = [...prev]
      const mp = [...next[partiaIndex].malePunkty]
      mp[graczIndex] = safeValue
      next[partiaIndex] = { ...next[partiaIndex], malePunkty: mp }
      return next
    })
  }

  const stolikOk = stolik !== null && Number.isFinite(stolik) && stolik >= 1

  const canSubmit =
    stolikOk &&
    liczbaWybranychGraczy >= 2 &&
    partieDane.every((p) => p.duzyPunkt) &&
    partieDane.every((p) => p.malePunkty.every((v) => v === null || Number.isFinite(v)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        turniej_id: turniejId,
        numer_partii_start: kolejnyNumer,
        liczba_partii: liczbaPartii,
        gracze: selectedGracze.filter((g): g is string => g !== null),
        partie: partieDane.map((p) => ({
          stolik: stolik,
          duzyPunkt: p.duzyPunkt,
          malePunkty: p.malePunkty,
        })),
      }

      const response = await fetch(`/admin/turniej/${turniejId}/partie/nowa/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => null)
        alert(`Błąd: ${err?.errors?.join(', ') || 'Wystąpił nieznany błąd'}`)
        return
      }

      setShowSuccess(true)
    } catch (error) {
      console.error('Błąd podczas zapisywania partii:', error)
      alert('Wystąpił błąd podczas zapisywania partii')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
    router.push(`/admin/turniej/${turniejId}/partie`)
    router.refresh()
  }

  if (!gracze || gracze.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Link
          href={`/admin/turniej/${turniejId}/partie`}
          className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Powrót do partii
        </Link>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 text-center">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Brak graczy</h2>
          <p className="text-slate-400 mb-6">Nie ma dostępnych graczy do wyboru.</p>
          <Link
            href="/admin/gracze"
            className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Zarządzaj graczami
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link
        href={`/admin/turniej/${turniejId}/partie`}
        className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Powrót do partii
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-700 bg-slate-800/60">
          <h1 className="text-2xl font-bold text-white">Dodaj partie</h1>
          <p className="text-slate-400 mt-1">
            Turniej: <span className="text-slate-200 font-semibold">{turniej.nazwa}</span> • Partie{' '}
            <span className="text-slate-200 font-semibold">
              #{kolejnyNumer}–#{kolejnyNumer + liczbaPartii - 1}
            </span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Krok 1 */}
        <Section
          step={1}
          title="Numer stolika"
          icon={<Hash className="h-5 w-5" />}
          description="Ten numer zostanie zapisany dla wszystkich dodawanych partii."
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative w-full sm:w-56">
              <input
                type="number"
                min={1}
                step={1}
                value={stolik ?? ''}
                onChange={(e) => {
                  const t = e.target.value.trim()
                  if (t === '') return setStolik(null)
                  const n = Math.floor(Number(t))
                  setStolik(Number.isFinite(n) && n >= 1 ? n : null)
                }}
                className="w-full bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                placeholder="np. 7"
              />
            </div>

            <div className="text-sm text-slate-400">
              Na liście wyników gracze mogą być oznaczeni jako <span className="text-slate-200">7A, 7B…</span>
            </div>
          </div>

          {!stolikOk && <div className="mt-2 text-sm text-red-300">Podaj poprawny numer stolika (min. 1).</div>}
        </Section>

        {/* Krok 2 */}
        <Section
          step={2}
          title="Liczba partii"
          icon={<LayoutGrid className="h-5 w-5" />}
          description="Dodaj od 1 do 10 partii. Potem wypełnisz wyniki dla każdej z nich."
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="inline-flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleLiczbaPartiiChange(liczbaPartii - 1)}
                disabled={liczbaPartii <= 1}
                className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-600
                           bg-slate-700/60 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="h-4 w-4 text-slate-100" />
              </button>

              <div className="min-w-14 text-center">
                <div className="text-2xl font-bold text-white leading-none">{liczbaPartii}</div>
                <div className="text-xs text-slate-400 mt-1">partii</div>
              </div>

              <button
                type="button"
                onClick={() => handleLiczbaPartiiChange(liczbaPartii + 1)}
                disabled={liczbaPartii >= 10}
                className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-600
                           bg-slate-700/60 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 text-slate-100" />
              </button>
            </div>

            <div className="text-sm text-slate-400">
              Zakres numerów: <span className="text-slate-200 font-semibold">#{kolejnyNumer}–#{kolejnyNumer + liczbaPartii - 1}</span>
            </div>
          </div>
        </Section>

        {/* Krok 3 */}
        <Section
          step={3}
          title="Wybór graczy"
          icon={<Users className="h-5 w-5" />}
          description="Wpisz min. 2 litery, aby zobaczyć podpowiedzi. Gracze nie mogą się powtarzać."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="rounded-xl border border-slate-700 bg-slate-900/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm text-slate-300 font-medium">Gracz {index + 1}</label>
                      {selectedGracze[index] && (
                        <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                          wybrano
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
                      <PlayerAutocomplete
                        value={searchValues[index]}
                        selectedId={selectedGracze[index]}
                        options={getAvailableGracze(index)}
                        required={index < 2}
                        onChangeValue={(v) => {
                          const newSearch = [...searchValues]
                          newSearch[index] = v
                          setSearchValues(newSearch)

                          if (selectedGracze[index]) {
                            const newSel = [...selectedGracze]
                            newSel[index] = null
                            setSelectedGracze(newSel)
                          }
                        }}
                        onPick={(id, display) => {
                          if (selectedGracze.some((s, i) => i !== index && s === id)) return

                          const newSel = [...selectedGracze]
                          newSel[index] = id
                          setSelectedGracze(newSel)

                          const newSearch = [...searchValues]
                          newSearch[index] = display
                          setSearchValues(newSearch)
                        }}
                        onClear={() => clearField(index)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm text-slate-400">
            Wybrano: <span className="text-slate-200 font-semibold">{liczbaWybranychGraczy}</span> graczy
          </div>
        </Section>

        {/* Krok 4 */}
        <Section
          step={4}
          title="Wyniki partii"
          icon={<Trophy className="h-5 w-5" />}
          description="Dla każdej partii wybierz zwycięzcę (duży punkt) i ewentualnie wpisz małe punkty."
        >
          <div className="space-y-5">
            {partieDane.map((partia, partiaIndex) => (
              <div key={partiaIndex} className="rounded-2xl border border-slate-700 bg-slate-900/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-white font-semibold">
                    Partia #{kolejnyNumer + partiaIndex}
                  </div>
                  <div className="text-sm text-slate-400">
                    Stolik: <span className="text-slate-200 font-semibold">{stolik ?? '-'}</span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {selectedGracze.map((graczId, graczIndex) => {
                    if (!graczId) return null
                    const name = graczeOptions.find((g) => g.id === graczId)?.display ?? '—'
                    const isWinner = partia.duzyPunkt === graczId

                    return (
                      <div
                        key={graczIndex}
                        className={`rounded-xl border px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3
                          ${isWinner ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-slate-700 bg-slate-800/30'}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`duzyPunkt-${partiaIndex}`}
                            checked={isWinner}
                            onChange={() => handleDuzyPunktChange(partiaIndex, graczId)}
                            className="h-4 w-4 text-yellow-500 bg-slate-700 border-slate-600 focus:ring-yellow-500 focus:ring-2"
                          />
                          <div>
                            <div className="text-white font-medium">{name}</div>
                            <div className="text-xs text-slate-400">
                              Zaznacz jako zwycięzcę tej partii
                            </div>
                          </div>

                          {isWinner && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full">
                              <Trophy className="h-3 w-3" />
                              zwycięzca
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-sm text-slate-400 whitespace-nowrap">Małe punkty:</span>
                          <input
                            type="number"
                            value={partia.malePunkty[graczIndex] ?? ''}
                            onChange={(e) => handleMalePunktyChange(partiaIndex, graczIndex, e.target.value)}
                            step="0.1"
                            className="w-28 bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
                                       focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                            placeholder="-"
                          />
                        </div>
                      </div>
                    )
                  })}

                  {liczbaWybranychGraczy < 2 && (
                    <div className="text-sm text-slate-400">
                      Najpierw wybierz przynajmniej 2 graczy, żeby uzupełnić wyniki.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Sticky bar */}
        <div className="sticky bottom-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-sm text-slate-300">
              Stolik <span className="text-white font-semibold">{stolik ?? '-'}</span> •{' '}
              Partie <span className="text-white font-semibold">{liczbaPartii}</span> •{' '}
              Gracze <span className="text-white font-semibold">{liczbaWybranychGraczy}</span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/admin/turniej/${turniejId}/partie`}
                className="px-4 py-2 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-colors"
              >
                Anuluj
              </Link>

              <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="bg-sky-500 hover:bg-sky-600 disabled:bg-slate-700 disabled:text-slate-400 text-white px-5 py-2 rounded-lg inline-flex items-center transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Zapisywanie...' : `Zapisz ${liczbaPartii} partii`}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* modal sukcesu */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-600 max-w-xl w-full overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/15 rounded-xl p-2 border border-emerald-500/20">
                  <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Zapisano pomyślnie!</h2>
                  <p className="text-slate-400 text-sm">
                    Stolik {stolik ?? '-'} • Dodano {liczbaPartii} partii: #{kolejnyNumer}–#
                    {kolejnyNumer + liczbaPartii - 1}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseSuccess}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
                aria-label="Zamknij"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-slate-200 text-sm leading-relaxed">
                Partie zostały zapisane w turnieju <span className="font-semibold">{turniej.nazwa}</span>.
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCloseSuccess}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
