// components/DeletePartia.tsx
'use client'

import { useState } from 'react'
import { Trash2, X, AlertTriangle, RefreshCw } from 'lucide-react'

interface GraczDlaUsuwania {
  id: string
  imie: string
  nazwisko: string
  eloPrzed: number
  zmianaElo: number
}

interface DeletePartiaProps {
  partiaId: string
  turniejId: string
  numerPartii: number
  nazwaTurnieju: string
  gracze: GraczDlaUsuwania[]
  className?: string
  iconOnly?: boolean

}

export default function DeletePartia({ partiaId, turniejId, numerPartii, nazwaTurnieju, gracze }: DeletePartiaProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    setResultMessage(null)
    
    try {
      const response = await fetch(`/api/admin/partie/${partiaId}?turniejId=${turniejId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setResultMessage(data.message || 'Partia została pomyślnie usunięta')
        // Odśwież stronę po 2 sekundach
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setResultMessage(`Błąd: ${data.error || 'Wystąpił nieznany błąd'}`)
      }
    } catch (error) {
      console.error('Błąd podczas usuwania partii:', error)
      setResultMessage('Wystąpił błąd podczas usuwania partii')
    } finally {
      setDeleting(false)
    }
  }

  // Oblicz podsumowanie zmian
  const graczeZGracja = gracze.filter(g => g.zmianaElo !== 0)
  const graczeZObrazeniem = graczeZGracja.filter(g => g.zmianaElo < 0)
  const graczeZZyskiem = graczeZGracja.filter(g => g.zmianaElo > 0)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-500 px-3 py-2 text-sm font-medium text-white transition"
      >
        <Trash2 className="h-4 w-4" />
        Usuń
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl p-6 mx-4">
            {/* Nagłówek */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-red-500/20 rounded-lg p-2">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Usuwanie partii
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                disabled={deleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Komunikat wyniku */}
            {resultMessage && (
              <div className={`mb-4 p-4 rounded-lg ${
                resultMessage.includes('Błąd') 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-green-500/10 border border-green-500/20 text-green-400'
              }`}>
                <div className="flex items-center space-x-2">
                  {resultMessage.includes('Błąd') ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <RefreshCw className="h-5 w-5" />
                  )}
                  <span>{resultMessage}</span>
                </div>
                {!resultMessage.includes('Błąd') && (
                  <p className="text-sm mt-2 text-green-300">
                    Strona zostanie odświeżona za chwilę...
                  </p>
                )}
              </div>
            )}

            {/* Treść */}
            <div className="space-y-4">
              <p className="text-slate-300">
                Czy na pewno chcesz usunąć tę partię? Ta operacja jest nieodwracalna.
              </p>
              
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="text-red-400 font-semibold">
                  Partia #{numerPartii}
                </div>
                <div className="text-red-300 text-sm mt-1">
                  {nazwaTurnieju}
                </div>
              </div>

              {/* Szczegółowe informacje o zmianach */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-300 mb-3">
                  Zmiany, które zostaną cofnięte:
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Gracze z zyskiem ELO */}
                  {graczeZZyskiem.length > 0 && (
                    <div>
                      <div className="text-green-400 font-medium mb-2">
                        Gracze, którzy stracą punkty ELO ({graczeZZyskiem.length}):
                      </div>
                      <div className="space-y-1">
                        {graczeZZyskiem.map(gracz => (
                          <div key={gracz.id} className="flex justify-between text-green-300">
                            <span>{gracz.imie} {gracz.nazwisko}</span>
                            <span>-{gracz.zmianaElo} ELO</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gracze ze stratą ELO */}
                  {graczeZObrazeniem.length > 0 && (
                    <div>
                      <div className="text-red-400 font-medium mb-2">
                        Gracze, którzy odzyskają punkty ELO ({graczeZObrazeniem.length}):
                      </div>
                      <div className="space-y-1">
                        {graczeZObrazeniem.map(gracz => (
                          <div key={gracz.id} className="flex justify-between text-red-300">
                            <span>{gracz.imie} {gracz.nazwisko}</span>
                            <span>+{Math.abs(gracz.zmianaElo)} ELO</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-slate-600/30 rounded">
                  <p className="text-slate-400 text-sm">
                    <strong>Pełne przywracanie stanu:</strong> Ranking ELO, statystyki gier i liczba wygranych zostaną przywrócone do stanu sprzed tej partii.
                  </p>
                </div>
              </div>
            </div>

            {/* Przyciski akcji */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-red-400 px-4 py-2 text-sm font-medium text-white transition"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Usuwanie...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Usuń partię
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}