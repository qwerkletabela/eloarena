'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users, X, Trophy, TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react'

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

interface ZmianaElo {
  gracz_id: string
  imie: string
  nazwisko: string
  elo_przed: number
  elo_po: number
  zmiana_elo: number
  male_punkty: number
  duzy_punkt: boolean
}

interface PartiaData {
  duzyPunkt: string
  malePunkty: number[]
}

export default function NowaPartiaForm({ turniej, gracze, kolejnyNumer, turniejId }: NowaPartiaFormProps) {
  const router = useRouter()
  const [selectedGracze, setSelectedGracze] = useState<(string | null)[]>([null, null, null, null])
  const [searchValues, setSearchValues] = useState<string[]>(['', '', '', ''])
  const [liczbaPartii, setLiczbaPartii] = useState(1)
  const [partieDane, setPartieDane] = useState<PartiaData[]>([
    { duzyPunkt: '', malePunkty: [0, 0, 0, 0] }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryData, setSummaryData] = useState<ZmianaElo[][]>([])

  // Przygotuj listę graczy do wyświetlenia w datalist - z zabezpieczeniem przed undefined
  const graczeOptions = useMemo(() => {
    if (!gracze) return []
    
    return gracze.map(gracz => ({
      id: gracz.id,
      display: `${gracz.imie} ${gracz.nazwisko} (${Math.round(gracz.aktualny_elo || 1200)})`
    }))
  }, [gracze])

  // Funkcja do uzyskania dostępnych graczy dla datalist
  const getAvailableGracze = (currentIndex: number) => {
    return graczeOptions.filter(option => 
      !selectedGracze.some((selected, index) => 
        index !== currentIndex && selected === option.id
      )
    )
  }

  // Funkcja do obsługi zmiany inputa
  const handleInputChange = (index: number, value: string) => {
    const newSearchValues = [...searchValues]
    newSearchValues[index] = value
    setSearchValues(newSearchValues)

    // Sprawdź czy wartość pasuje do któregoś gracza
    const foundGracz = graczeOptions.find(option => 
      option.display.toLowerCase() === value.toLowerCase()
    )

    const newSelected = [...selectedGracze]
    newSelected[index] = foundGracz ? foundGracz.id : null
    setSelectedGracze(newSelected)
  }

  // Funkcja do zmiany liczby partii
  const handleLiczbaPartiiChange = (newLiczba: number) => {
    if (newLiczba < 1) return
    
    if (newLiczba > liczbaPartii) {
      // Dodaj nowe partie
      const newPartieDane = [...partieDane]
      for (let i = liczbaPartii; i < newLiczba; i++) {
        newPartieDane.push({
          duzyPunkt: selectedGracze.find(g => g !== null) || '', // Domyślnie pierwszy wybrany gracz
          malePunkty: selectedGracze.map(() => 0)
        })
      }
      setPartieDane(newPartieDane)
    } else {
      // Usuń partie
      setPartieDane(partieDane.slice(0, newLiczba))
    }
    
    setLiczbaPartii(newLiczba)
  }

  // Funkcja do zmiany dużego punktu w partii
  const handleDuzyPunktChange = (partiaIndex: number, graczId: string) => {
    const newPartieDane = [...partieDane]
    newPartieDane[partiaIndex] = {
      ...newPartieDane[partiaIndex],
      duzyPunkt: graczId
    }
    setPartieDane(newPartieDane)
  }

  // Funkcja do zmiany małych punktów w partii
  const handleMalePunktyChange = (partiaIndex: number, graczIndex: number, value: number) => {
    const newPartieDane = [...partieDane]
    const newMalePunkty = [...newPartieDane[partiaIndex].malePunkty]
    newMalePunkty[graczIndex] = value
    newPartieDane[partiaIndex] = {
      ...newPartieDane[partiaIndex],
      malePunkty: newMalePunkty
    }
    setPartieDane(newPartieDane)
  }

  // Funkcja do czyszczenia pola
  const clearField = (index: number) => {
    const newSearchValues = [...searchValues]
    newSearchValues[index] = ''
    setSearchValues(newSearchValues)

    const newSelected = [...selectedGracze]
    newSelected[index] = null
    setSelectedGracze(newSelected)

    // Zaktualizuj partie dane - usuń duże punkty dla usuniętego gracza
    const newPartieDane = partieDane.map(partia => ({
      ...partia,
      duzyPunkt: partia.duzyPunkt === newSelected[index] ? '' : partia.duzyPunkt,
      malePunkty: partia.malePunkty.map((punkty, i) => i === index ? 0 : punkty)
    }))
    setPartieDane(newPartieDane)
  }

  // Funkcja do przesyłania formularza
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/admin/turniej/${turniejId}/partie/nowa/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          turniej_id: turniejId,
          numer_partii_start: kolejnyNumer,
          liczba_partii: liczbaPartii,
          gracze: selectedGracze.filter(g => g !== null),
          partie: partieDane
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setSummaryData(result.zmiany)
        setShowSummary(true)
      } else {
        const error = await response.json()
        alert(`Błąd: ${error.errors?.join(', ') || 'Wystąpił nieznany błąd'}`)
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania partii:', error)
      alert('Wystąpił błąd podczas zapisywania partii')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funkcja do zamknięcia modala i przekierowania
  const handleCloseSummary = () => {
    setShowSummary(false)
    router.push(`/admin/turniej/${turniejId}/partie`)
    router.refresh()
  }

  const liczbaWybranychGraczy = selectedGracze.filter(g => g !== null).length
  const canSubmit = liczbaWybranychGraczy >= 2 && 
                   partieDane.every(partia => partia.duzyPunkt) &&
                   partieDane.every(partia => 
                     partia.malePunkty.slice(0, liczbaWybranychGraczy).every(punkt => !isNaN(punkt))
                   )

  // Jeśli nie ma graczy, pokaż komunikat
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
              Wybierz graczy (2-4)
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
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <datalist id={`gracze-list-${index}`}>
                        {getAvailableGracze(index).map((gracz) => (
                          <option key={gracz.id} value={gracz.display} />
                        ))}
                      </datalist>
                    </div>

                    {selectedGracze[index] && (
                      <div className="text-xs text-green-400 mt-6">
                        ✓ Wybrano
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wybór liczby partii */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Liczba partii do dodania</h3>
            <div className="flex items-center space-x-4 mb-4">
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
            <p className="text-slate-400 text-sm">
              Możesz dodać maksymalnie 10 partii na raz
            </p>
          </div>

          {/* Partie */}
          <div className="space-y-6 mb-8">
            {partieDane.map((partia, partiaIndex) => (
              <div key={partiaIndex} className="bg-slate-700/30 rounded-xl border border-slate-600 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Partia #{kolejnyNumer + partiaIndex}
                </h3>
                
                <div className="space-y-3">
                  {selectedGracze.map((graczId, graczIndex) => 
                    graczId && (
                      <div key={graczIndex} className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="radio"
                            name={`duzyPunkt-${partiaIndex}`}
                            checked={partia.duzyPunkt === graczId}
                            onChange={() => handleDuzyPunktChange(partiaIndex, graczId)}
                            className="h-4 w-4 text-yellow-500 bg-slate-600 border-slate-500 focus:ring-yellow-500 focus:ring-2"
                          />
                          <span className="text-white font-medium">
                            {graczeOptions.find(g => g.id === graczId)?.display}
                          </span>
                          {partia.duzyPunkt === graczId && (
                            <span className="text-yellow-400 text-sm flex items-center">
                              <Trophy className="h-3 w-3 mr-1" />
                              Zwycięzca
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label className="text-slate-400 text-sm whitespace-nowrap">Małe punkty:</label>
                          <input
                            type="number"
                            value={partia.malePunkty[graczIndex]}
                            onChange={(e) => handleMalePunktyChange(partiaIndex, graczIndex, parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.1"
                            className="w-20 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">Jak to działa?</h4>
            <ul className="text-sm text-blue-200/80 space-y-1">
              <li>• <strong>Wybierz skład graczy</strong> (2-4 osoby) - ten sam dla wszystkich partii</li>
              <li>• <strong>Określ liczbę partii</strong> - ile partii chcesz dodać z tym składem</li>
              <li>• <strong>Dla każdej partii</strong> zaznacz zwycięzcę i wprowadź małe punkty</li>
              <li>• <strong>System automatycznie</strong> obliczy zmiany ELO dla każdej partii</li>
              <li>• Partie zostaną zapisane z kolejnymi numerami</li>
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

      {/* Modal z podsumowaniem zmian */}
      {showSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-600 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500 rounded-lg p-2">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Partie zapisane pomyślnie!</h2>
                    <p className="text-slate-400 text-sm">Podsumowanie zmian rankingu Elo</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseSummary}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {summaryData.map((partiaZmiany, partiaIndex) => (
                <div key={partiaIndex} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Partia #{kolejnyNumer + partiaIndex} - Podsumowanie
                  </h3>
                  <div className="space-y-3">
                    {partiaZmiany
                      .sort((a, b) => (b.duzy_punkt ? 1 : 0) - (a.duzy_punkt ? 1 : 0) || b.zmiana_elo - a.zmiana_elo)
                      .map((zmiana) => (
                        <div 
                          key={zmiana.gracz_id} 
                          className={`p-4 rounded-xl border ${
                            zmiana.duzy_punkt 
                              ? 'bg-green-500/10 border-green-500/30' 
                              : 'bg-slate-700/30 border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {zmiana.duzy_punkt && (
                                <div className="bg-yellow-500 rounded-full p-2">
                                  <Trophy className="h-5 w-5 text-yellow-900" />
                                </div>
                              )}
                              <div>
                                <h4 className="text-white font-semibold">
                                  {zmiana.imie} {zmiana.nazwisko}
                                  {zmiana.duzy_punkt && (
                                    <span className="ml-2 text-yellow-400 text-sm">🎯 ZWYCIĘZCA</span>
                                  )}
                                </h4>
                                <div className="text-sm text-slate-400">
                                  Małe punkty: {zmiana.male_punkty}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center justify-end space-x-2 mb-1">
                                <span className="text-slate-400 text-sm">Ranking Elo:</span>
                                <span className="text-white font-bold">
                                  {Math.round(zmiana.elo_przed)} → {Math.round(zmiana.elo_po)}
                                </span>
                              </div>
                              <div className={`flex items-center justify-end space-x-1 text-sm font-medium ${
                                zmiana.zmiana_elo > 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {zmiana.zmiana_elo > 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                <span>
                                  {zmiana.zmiana_elo > 0 ? '+' : ''}{Math.round(zmiana.zmiana_elo)} punktów
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCloseSummary}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  OK, rozumiem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}