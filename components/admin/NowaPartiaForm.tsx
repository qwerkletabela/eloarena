'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users, X, Trophy, Plus, Minus, CheckCircle2 } from 'lucide-react'

interface Gracz {
  id: string
  imie: string
  nazwisko: string
  aktualny_elo: number // może zostać, ale nie używamy do obliczeń
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
  // null = nie podano (opcjonalne)
  malePunkty: (number | null)[]
}

export default function NowaPartiaForm({
  turniej,
  gracze,
  kolejnyNumer,
  turniejId,
}: NowaPartiaFormProps) {
  const router = useRouter()

  const [selectedGracze, setSelectedGracze] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ])
  const [searchValues, setSearchValues] = useState<string[]>(['', '', '', ''])

  const [liczbaPartii, setLiczbaPartii] = useState(1)
  const [partieDane, setPartieDane] = useState<PartiaData[]>([
    { duzyPunkt: '', malePunkty: [null, null, null, null] },
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // modal sukcesu
  const [showSuccess, setShowSuccess] = useState(false)

  // options do datalist
  const graczeOptions = useMemo(() => {
    if (!gracze) return []
    return gracze.map((g) => ({
      id: g.id,
      display: `${g.imie} ${g.nazwisko}`, // bez ELO
    }))
  }, [gracze])

  const liczbaWybranychGraczy = selectedGracze.filter((g) => g !== null).length

  const getAvailableGracze = (currentIndex: number) => {
    return graczeOptions.filter(
      (opt) =>
        !selectedGracze.some((selected, idx) => idx !== currentIndex && selected === opt.id)
    )
  }

  const handleInputChange = (index: number, value: string) => {
    const newSearchValues = [...searchValues]
    newSearchValues[index] = value
    setSearchValues(newSearchValues)

    const found = graczeOptions.find((opt) => opt.display.toLowerCase() === value.toLowerCase())

    const newSelected = [...selectedGracze]
    newSelected[index] = found ? found.id : null
    setSelectedGracze(newSelected)

    // jeśli zmienił skład, dbamy żeby partie miały poprawną długość malePunkty
    // (zostawiamy 4 sloty, ale i tak renderujemy tylko wybranych)
    // nie resetujemy danych na siłę, żeby user nie tracił wpisów
  }

  const clearField = (index: number) => {
    const removedId = selectedGracze[index] // zapamiętaj usuwanego

    const newSearchValues = [...searchValues]
    newSearchValues[index] = ''
    setSearchValues(newSearchValues)

    const newSelected = [...selectedGracze]
    newSelected[index] = null
    setSelectedGracze(newSelected)

    // aktualizacja partii: usuń zwycięzcę jeśli to był ten gracz, i wyczyść małe punkty w tym slocie
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
          // domyślny zwycięzca: pierwszy wybrany gracz (jeśli jest)
          const defaultWinner = (selectedGracze.find((g) => g !== null) as string | null) || ''
          next.push({
            duzyPunkt: defaultWinner,
            malePunkty: [null, null, null, null],
          })
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
    // puste pole => null (opcjonalne)
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

  // warunki submitu:
  // - min 2 graczy
  // - w każdej partii jest wybrany zwycięzca
  // - małe punkty: jeśli wpisane, muszą być liczbą
  const canSubmit =
    liczbaWybranychGraczy >= 2 &&
    partieDane.every((p) => p.duzyPunkt) &&
    partieDane.every((p) =>
      p.malePunkty.slice(0, 4).every((v) => v === null || Number.isFinite(v))
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        turniej_id: turniejId,
        numer_partii_start: kolejnyNumer,
        liczba_partii: liczbaPartii,
        gracze: selectedGracze.filter((g): g is string => g !== null),
        // wysyłamy tylko duży punkt i małe (opcjonalne)
        partie: partieDane.map((p) => ({
          duzyPunkt: p.duzyPunkt,
          // backend może chcieć liczb – tu zostawiamy null jako "brak"
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

      // sukces
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

  // Jeśli nie ma graczy
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

        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 text-center">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Brak graczy</h2>
          <p className="text-slate-400 mb-6">
            Nie ma dostępnych graczy do wyboru. Dodaj graczy przed tworzeniem partii.
          </p>
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

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Nowe partie</h1>
        <p className="text-slate-400 mb-6">
          Turniej: {turniej.nazwa} • Partie #{kolejnyNumer}-{kolejnyNumer + liczbaPartii - 1}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Wybór graczy */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Wybierz graczy (2–4)
            </h3>

            <div className="space-y-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-slate-400 mb-1">
                        Gracz {index + 1}
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          value={searchValues[index]}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          list={`gracze-list-${index}`}
                          className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm pr-8"
                          placeholder="Wpisz imię i nazwisko..."
                          required={index < 2}
                          autoComplete="off"
                        />

                        {selectedGracze[index] && (
                          <button
                            type="button"
                            onClick={() => clearField(index)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                            aria-label="Wyczyść"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <datalist id={`gracze-list-${index}`}>
                        {getAvailableGracze(index).map((g) => (
                          <option key={g.id} value={g.display} />
                        ))}
                      </datalist>
                    </div>

                    {selectedGracze[index] && (
                      <div className="text-xs text-green-400 mt-6">✓ Wybrano</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Liczba partii */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Liczba partii do dodania</h3>
            <div className="flex items-center space-x-4 mb-2">
              <button
                type="button"
                onClick={() => handleLiczbaPartiiChange(liczbaPartii - 1)}
                disabled={liczbaPartii <= 1}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="h-4 w-4" />
              </button>

              <span className="text-white font-semibold text-lg min-w-8 text-center">
                {liczbaPartii}
              </span>

              <button
                type="button"
                onClick={() => handleLiczbaPartiiChange(liczbaPartii + 1)}
                disabled={liczbaPartii >= 10}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>

              <span className="text-slate-400 text-sm">
                Partie #{kolejnyNumer}-{kolejnyNumer + liczbaPartii - 1}
              </span>
            </div>
            <p className="text-slate-400 text-sm">Maksymalnie 10 partii na raz</p>
          </div>

          {/* Partie - duży punkt i małe punkty */}
          <div className="space-y-6 mb-8">
            {partieDane.map((partia, partiaIndex) => (
              <div
                key={partiaIndex}
                className="bg-slate-700/30 rounded-xl border border-slate-600 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  Partia #{kolejnyNumer + partiaIndex}
                </h3>

                <div className="space-y-3">
                  {selectedGracze.map(
                    (graczId, graczIndex) =>
                      graczId && (
                        <div
                          key={graczIndex}
                          className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <input
                              type="radio"
                              name={`duzyPunkt-${partiaIndex}`}
                              checked={partia.duzyPunkt === graczId}
                              onChange={() => handleDuzyPunktChange(partiaIndex, graczId)}
                              className="h-4 w-4 text-yellow-500 bg-slate-600 border-slate-500 focus:ring-yellow-500 focus:ring-2"
                            />
                            <span className="text-white font-medium">
                              {graczeOptions.find((g) => g.id === graczId)?.display}
                            </span>

                            {partia.duzyPunkt === graczId && (
                              <span className="text-yellow-400 text-sm flex items-center">
                                <Trophy className="h-3 w-3 mr-1" />
                                Zwycięzca
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <label className="text-slate-400 text-sm whitespace-nowrap">
                              Małe punkty (opcjonalnie):
                            </label>
                            <input
                              type="number"
                              value={partia.malePunkty[graczIndex] ?? ''}
                              onChange={(e) =>
                                handleMalePunktyChange(partiaIndex, graczIndex, e.target.value)
                              }
                              step="0.1"
                              className="w-24 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                              placeholder="-"
                            />
                          </div>
                        </div>
                      )
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* pomocniczy box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">Co wpisujesz?</h4>
            <ul className="text-sm text-blue-200/80 space-y-1">
              <li>• Wybierasz skład graczy (2–4)</li>
              <li>• Dla każdej partii wybierasz zwycięzcę (duży punkt)</li>
              <li>• Małe punkty są opcjonalne — możesz zostawić puste</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href={`/admin/turniej/${turniejId}/partie`}
              className="px-4 py-2 text-slate-400 hover:text-white border border-slate-600 rounded-lg transition-colors"
            >
              Anuluj
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="bg-sky-500 hover:bg-sky-600 disabled:bg-slate-700 disabled:text-slate-400 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Zapisywanie...' : `Zapisz ${liczbaPartii} partii`}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL: sukces (bez ELO) */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-600 max-w-xl w-full overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 rounded-lg p-2">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Zapisano pomyślnie!</h2>
                  <p className="text-slate-400 text-sm">
                    Dodano {liczbaPartii} partii: #{kolejnyNumer}–#{kolejnyNumer + liczbaPartii - 1}
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
