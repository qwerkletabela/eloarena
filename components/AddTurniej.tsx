'use client'

import { useRouter } from 'next/navigation'

interface AddTurniejProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
  nazwa: string
  data: string
  miejsce: string
}

export default function AddTurniej({ 
  isOpen, 
  onClose, 
  onConfirm,
  isSubmitting,
  nazwa, 
  data, 
  miejsce 
}: AddTurniejProps) {
  const router = useRouter()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-600 shadow-2xl transform transition-all animate-in fade-in-zoom-in-95">
        {/* Nagłówek */}
        <div className="flex items-center gap-3 border-b border-slate-600 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20">
            <svg className="h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-sky-100">Potwierdź utworzenie turnieju</h3>
            <p className="text-sm text-slate-400">Sprawdź poprawność danych przed zapisem</p>
          </div>
        </div>

        {/* Treść */}
        <div className="px-6 py-4">
          <p className="text-sky-100 mb-4">
            Czy na pewno chcesz utworzyć następujący turniej?
          </p>
          
          <div className="space-y-3 bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20">
                <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-sky-100">{nazwa}</p>
                <p className="text-xs text-slate-400">Nazwa turnieju</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20">
                <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-sky-100">{data}</p>
                <p className="text-xs text-slate-400">Data turnieju</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20">
                <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-sky-100">{miejsce}</p>
                <p className="text-xs text-slate-400">Miejsce turnieju</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 rounded-lg px-3 py-2 mt-4">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Turniej zostanie zapisany dopiero po kliknięciu "Tak, zapisz"</span>
          </div>
        </div>

        {/* Przyciski akcji */}
        <div className="flex justify-end gap-3 border-t border-slate-600 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-slate-500 bg-slate-700 hover:bg-slate-600 px-6 py-2 text-sm font-medium text-sky-100 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 px-6 py-2 text-sm font-medium text-white transition flex items-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Zapisywanie...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tak, zapisz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}