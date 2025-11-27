// components/DeletePartia.tsx
'use client'

import { useState } from 'react'
import { Trash2, X, AlertTriangle } from 'lucide-react'

interface DeletePartiaProps {
  partiaId: string
  turniejId: string
  numerPartii: number
  nazwaTurnieju: string
}

export default function DeletePartia({ partiaId, turniejId, numerPartii, nazwaTurnieju }: DeletePartiaProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/partie/${partiaId}?turniejId=${turniejId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Odśwież stronę
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Błąd: ${error.error || 'Wystąpił nieznany błąd'}`)
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Błąd podczas usuwania partii:', error)
      alert('Wystąpił błąd podczas usuwania partii')
      setIsOpen(false)
    } finally {
      setDeleting(false)
    }
  }

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
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl p-6 mx-4">
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

              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-slate-400 text-sm">
                  <strong>Uwaga:</strong> Usunięcie partii spowoduje przeliczenie rankingu ELO wszystkich graczy biorących w niej udział.
                </p>
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