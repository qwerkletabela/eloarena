// components/DeleteMiejsceButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface DeleteMiejsceButtonProps {
  id: string
  nazwa: string
}

interface ErrorModalProps {
  isOpen: boolean
  title: string
  message: string
  onClose: () => void
}

interface SuccessModalProps {
  isOpen: boolean
  message: string
  onClose: () => void
  onConfirm: () => void
}

const ErrorModal = ({ isOpen, title, message, onClose }: ErrorModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-red-600 shadow-2xl transform transition-all">
        {/* Nagłówek */}
        <div className="flex items-center gap-3 border-b border-red-600 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-100">{title}</h3>
            <p className="text-sm text-red-300">Wystąpił błąd</p>
          </div>
        </div>

        {/* Treść */}
        <div className="px-6 py-4">
          <p className="text-slate-200 whitespace-pre-line">{message}</p>
        </div>

        {/* Przycisk zamknięcia */}
        <div className="flex justify-end border-t border-red-600 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-full bg-red-600 hover:bg-red-500 px-6 py-2 text-sm font-medium text-white transition"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  )
}

const SuccessModal = ({ isOpen, message, onClose, onConfirm }: SuccessModalProps) => {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-green-600 shadow-2xl transform transition-all">
        {/* Nagłówek */}
        <div className="flex items-center gap-3 border-b border-green-600 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-100">Sukces!</h3>
            <p className="text-sm text-green-300">Operacja zakończona pomyślnie</p>
          </div>
        </div>

        {/* Treść */}
        <div className="px-6 py-4">
          <p className="text-slate-200">{message}</p>
        </div>

        {/* Przycisk zamknięcia */}
        <div className="flex justify-end border-t border-green-600 px-6 py-4">
          <button
            onClick={handleConfirm}
            className="rounded-full bg-green-600 hover:bg-green-500 px-6 py-2 text-sm font-medium text-white transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DeleteMiejsceButton({ id, nazwa }: DeleteMiejsceButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  
  // Stany dla modalów błędów i sukcesu
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({
    isOpen: false,
    title: '',
    message: ''
  })
  
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean
    message: string
  }>({
    isOpen: false,
    message: ''
  })

  const handleDelete = async () => {
    // Sprawdź czy id jest dostępne
    if (!id || id === 'undefined') {
      setErrorModal({
        isOpen: true,
        title: 'Błąd walidacji',
        message: 'ID miejsca jest nieprawidłowe. Spróbuj odświeżyć stronę i spróbować ponownie.'
      })
      return
    }

    setIsDeleting(true)

    try {
      // Sprawdź czy miejsce nie jest używane w żadnym turnieju
      const { data: turnieje, error: checkError } = await supabase
        .from('turniej')
        .select('id, nazwa')
        .eq('miejsce_id', id)

      if (checkError) {
        console.error('Błąd podczas sprawdzania turniejów:', checkError)
        setErrorModal({
          isOpen: true,
          title: 'Błąd sprawdzania turniejów',
          message: `Nie udało się sprawdzić turniejów: ${checkError.message}`
        })
        setIsDeleting(false)
        return
      }

      if (turnieje && turnieje.length > 0) {
        const turniejNazwy = turnieje.map(t => `• ${t.nazwa}`).join('\n')
        setIsOpen(false)
        setErrorModal({
          isOpen: true,
          title: 'Miejsce jest używane w turniejach',
          message: `Nie można usunąć tego miejsca, ponieważ jest przypisane do następujących turniejów:\n\n${turniejNazwy}\n\nNajpierw usuń lub zmień miejsce w tych turniejach.`
        })
        setIsDeleting(false)
        return
      }

      // Usuń miejsce z tabeli miejsce_turnieju
      const { error: deleteError } = await supabase
        .from('miejsce_turnieju')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Błąd Supabase podczas usuwania:', deleteError)
        setErrorModal({
          isOpen: true,
          title: 'Błąd bazy danych',
          message: `Wystąpił błąd podczas usuwania miejsca: ${deleteError.message}`
        })
        setIsDeleting(false)
        return
      }

      // Ustaw flagę, że miejsce zostało usunięte
      setIsDeleted(true)
      
      // Pokaż modal sukcesu
      setIsOpen(false)
      setSuccessModal({
        isOpen: true,
        message: `Miejsce "${nazwa}" zostało pomyślnie usunięte.`
      })
      
    } catch (error: any) {
      console.error('Pełny błąd podczas usuwania miejsca:', error)
      setErrorModal({
        isOpen: true,
        title: 'Nieoczekiwany błąd',
        message: `Wystąpił nieoczekiwany błąd podczas usuwania miejsca:\n\n${error.message || 'Nieznany błąd'}`
      })
      setIsDeleting(false)
    }
  }

  const handleSuccessModalClose = () => {
    // Zamknij modal sukcesu i odśwież stronę
    setSuccessModal({ ...successModal, isOpen: false })
    if (isDeleted) {
      router.refresh()
    }
  }

  const handleSuccessModalConfirm = () => {
    // Potwierdzenie zamknięcia modala sukcesu
    setSuccessModal({ ...successModal, isOpen: false })
    if (isDeleted) {
      router.refresh()
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 rounded bg-red-600 hover:bg-red-500 px-3 py-1 text-xs font-medium text-white transition"
        disabled={!id}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Usuń
      </button>

      {/* Modal potwierdzenia usunięcia */}
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
                Czy na pewno chcesz usunąć miejsce turnieju:
              </p>
              <p className="text-lg font-semibold text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
                "{nazwa || 'Nieznane miejsce'}"
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-700/50 rounded-lg px-3 py-2">
                  <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Wszystkie dane związane z miejscem zostaną trwale usunięte</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 bg-blue-500/10 rounded-lg px-3 py-2">
                  <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>System sprawdzi czy miejsce nie jest używane w istniejących turniejach</span>
                </div>
              </div>
            </div>

            {/* Przyciski akcji */}
            <div className="flex justify-end gap-3 border-t border-slate-600 px-6 py-4">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                className="rounded-full border border-slate-500 bg-slate-700 hover:bg-slate-600 px-6 py-2 text-sm font-medium text-sky-100 transition flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Anuluj
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || !id}
                className="rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 px-6 py-2 text-sm font-medium text-white transition flex items-center gap-2 shadow-lg shadow-red-500/25 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Usuwanie...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {id ? 'Tak, usuń miejsce' : 'Błąd: brak ID miejsca'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal błędu */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
      />

      {/* Modal sukcesu */}
      <SuccessModal
        isOpen={successModal.isOpen}
        message={successModal.message}
        onClose={handleSuccessModalClose}
        onConfirm={handleSuccessModalConfirm}
      />
    </>
  )
}