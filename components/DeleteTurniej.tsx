// components/DeleteTurniej.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteTurniejProps {
  id: string
  nazwa: string
}

export default function DeleteTurniej({ id, nazwa }: DeleteTurniejProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    try {
      const response = await fetch(`/admin/turniej/${id}/delete`, {
        method: 'POST',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Błąd podczas usuwania turnieju.')
      }
    } catch (err) {
      console.error('Błąd usuwania:', err)
      alert('Wystąpił błąd podczas usuwania turnieju.')
    } finally {
      setIsOpen(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-500 px-3 py-1 text-xs font-medium text-white transition"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Usuń
      </button>

      {/* Modal potwierdzenia */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-600 shadow-2xl transform transition-all">
            {/* Nagłówek */}
            <div className="flex items-center gap-3 border-b border-slate-600 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-sky-100">Potwierdź usunięcie</h3>
                <p className="text-sm text-slate-400">Ta akcja jest nieodwracalna</p>
              </div>
            </div>

            {/* Treść */}
            <div className="px-6 py-4">
              <p className="text-sky-100 mb-2">
                Czy na pewno chcesz usunąć turniej:
              </p>
              <p className="text-lg font-semibold text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
                "{nazwa}"
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-700/50 rounded-lg px-3 py-2">
                <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Wszystkie dane związane z turniejem zostaną trwale usunięte</span>
              </div>
            </div>

            {/* Przyciski akcji */}
            <div className="flex justify-end gap-3 border-t border-slate-600 px-6 py-4">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-slate-500 bg-slate-700 hover:bg-slate-600 px-6 py-2 text-sm font-medium text-sky-100 transition flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Anuluj
              </button>
              <button
                onClick={handleDelete}
                className="rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 px-6 py-2 text-sm font-medium text-white transition flex items-center gap-2 shadow-lg shadow-red-500/25"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Tak, usuń turniej
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}