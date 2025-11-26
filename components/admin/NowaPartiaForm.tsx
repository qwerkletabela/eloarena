'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users, X, Trophy, TrendingUp, TrendingDown } from 'lucide-react'

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
  gracze: Gracz[]
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
  miejsce: number
  male_punkty: number
  duzy_punkt: boolean
}

export default function NowaPartiaForm({ turniej, gracze, kolejnyNumer, turniejId }: NowaPartiaFormProps) {
  const router = useRouter()
  const [selectedGracze, setSelectedGracze] = useState<(string | null)[]>([null, null, null, null])
  const [searchValues, setSearchValues] = useState<string[]>(['', '', '', ''])
  const [duzyPunkt, setDuzyPunkt] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryData, setSummaryData] = useState<ZmianaElo[]>([])

  // Przygotuj listę graczy do wyświetlenia w datalist
  const graczeOptions = useMemo(() => {
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

  // Funkcja do czyszczenia pola
  const clearField = (index: number) => {
    const newSearchValues = [...searchValues]
    newSearchValues[index] = ''
    setSearchValues(newSearchValues)

    const newSelected = [...selectedGracze]
    newSelected[index] = null
    setSelectedGracze(newSelected)

    // Jeśli usuwamy gracza z dużym punktem, wyczyść duży punkt
    if (duzyPunkt === newSelected[index]) {
      setDuzyPunkt('')
    }
  }

  // Funkcja do przesyłania formularza
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.target as HTMLFormElement)
    
    try {
      const response = await fetch(`/admin/turniej/${turniejId}/partie/nowa/action`, {
        method: 'POST',
        body: formData,
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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href={`/admin/turniej/${turniejId}/partie`}
        className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Powrót do partii
      </Link>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Nowa partia</h1>
        <p className="text-slate-400 mb-6">
          Turniej: {turniej.nazwa} • Partia #{kolejnyNumer}
        </p>

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="turniej_id" value={turniejId} />
          <input type="hidden" name="numer_partii" value={kolejnyNumer} />
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Wybierz graczy (2-4) i wprowadź wyniki
            </h3>
            
            <div className="space-y-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Wybór gracza z autouzupełnianiem */}
                    <div className="relative">
                      <label className="block text-sm text-slate-400 mb-1">
                        Gracz {index + 1}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name={`gracz${index + 1}_search`}
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
                      
                      {/* Datalist z dostępnymi graczami */}
                      <datalist id={`gracze-list-${index}`}>
                        {getAvailableGracze(index).map((gracz) => (
                          <option key={gracz.id} value={gracz.display} data-id={gracz.id} />
                        ))}
                      </datalist>
                      
                      {/* Ukryte pole z ID gracza */}
                      <input 
                        type="hidden" 
                        name={`gracz${index + 1}`} 
                        value={selectedGracze[index] || ''} 
                      />
                    </div>

                    {/* Miejsce */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">
                        Miejsce
                      </label>
                      <select
                        name={`miejsce${index + 1}`}
                        defaultValue={index + 1}
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm"
                        disabled={!selectedGracze[index]}
                      >
                        <option value="1">1. miejsce</option>
                        <option value="2">2. miejsce</option>
                        <option value="3">3. miejsce</option>
                        <option value="4">4. miejsce</option>
                      </select>
                    </div>

                    {/* Małe punkty */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">
                        Małe punkty
                      </label>
                      <input
                        type="number"
                        name={`male_punkty${index + 1}`}
                        min="0"
                        step="0.1"
                        defaultValue="0"
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm"
                        disabled={!selectedGracze[index]}
                      />
                    </div>

                    {/* Duży punkt */}
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="duzy_punkt"
                        value={selectedGracze[index] || ''}
                        checked={duzyPunkt === selectedGracze[index]}
                        onChange={(e) => setDuzyPunkt(e.target.value)}
                        id={`duzy_punkt${index + 1}`}
                        className="h-4 w-4 text-yellow-500 bg-slate-600 border-slate-500"
                        disabled={!selectedGracze[index]}
                      />
                      <label 
                        htmlFor={`duzy_punkt${index + 1}`}
                        className="ml-2 text-sm text-slate-400"
                      >
                        Duży punkt
                      </label>
                    </div>
                  </div>
                  
                  {/* Wyświetl informację o wybranym graczu */}
                  {selectedGracze[index] && (
                    <div className="mt-2 text-xs text-green-400">
                      ✓ Wybrano: {searchValues[index]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">Instrukcja:</h4>
            <ul className="text-sm text-blue-200/80 space-y-1">
              <li>• Wpisz imię i nazwisko gracza - pojawi się lista sugestii</li>
              <li>• Wybierz od 2 do 4 różnych graczy</li>
              <li>• Ustaw miejsca od 1 do 4 (miejsca muszą być unikalne)</li>
              <li>• Wprowadź małe punkty dla każdego gracza</li>
              <li>• Zaznacz tylko <strong>jednego gracza</strong>, który otrzymuje duży punkt</li>
              <li>• Kliknij × aby usunąć gracza z pola</li>
            </ul>
          </div>

          <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-sky-300 mb-2">System punktacji Elo:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-sky-200/80">
              <div>
                <strong>2 graczy:</strong><br/>
                1. miejsce: 1.0 pkt<br/>
                2. miejsce: 0.0 pkt
              </div>
              <div>
                <strong>3 graczy:</strong><br/>
                1. miejsce: 1.0 pkt<br/>
                2. miejsce: 0.5 pkt<br/>
                3. miejsce: 0.0 pkt
              </div>
              <div>
                <strong>4 graczy:</strong><br/>
                1. miejsce: 1.0 pkt<br/>
                2. miejsce: 0.67 pkt<br/>
                3. miejsce: 0.33 pkt<br/>
                4. miejsce: 0.0 pkt
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href={`/admin/turniej/${turniejId}/partie`}
              className="px-4 py-2 text-slate-400 hover:text-white border border-slate-600 rounded-lg"
            >
              Anuluj
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-sky-500 hover:bg-sky-600 disabled:bg-sky-800 text-white px-6 py-2 rounded-lg flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz partię'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal z podsumowaniem zmian */}
      {showSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500 rounded-lg p-2">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Partia zapisana pomyślnie!</h2>
                    <p className="text-slate-400 text-sm">Podsumowanie zmian rankingu Elo</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseSummary}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {summaryData
                  .sort((a, b) => a.miejsce - b.miejsce)
                  .map((zmiana, index) => (
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
                          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                            zmiana.miejsce === 1 ? 'bg-yellow-500 text-yellow-900' :
                            zmiana.miejsce === 2 ? 'bg-gray-400 text-gray-900' :
                            zmiana.miejsce === 3 ? 'bg-orange-700 text-orange-100' :
                            'bg-slate-600 text-slate-300'
                          }`}>
                            {zmiana.miejsce}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">
                              {zmiana.imie} {zmiana.nazwisko}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-slate-400">
                              <span>Małe punkty: {zmiana.male_punkty}</span>
                              {zmiana.duzy_punkt && (
                                <span className="text-yellow-400 flex items-center">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Duży punkt
                                </span>
                              )}
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

              <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Co się stało?</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Partia została zapisana w systemie</li>
                  <li>• Rankingi Elo graczy zostały zaktualizowane</li>
                  <li>• Statystyki graczy zostały uaktualnione</li>
                  <li>• Możesz teraz dodać kolejną partię lub wrócić do listy</li>
                </ul>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCloseSummary}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg flex items-center"
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