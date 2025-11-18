'use client'

import { useState } from 'react'

type Props = {
  urlInputId: string        // id inputa z linkiem do Google Sheets
  sheetInputId: string      // id inputa, do którego wpiszemy nazwę karty
  gidHiddenInputId?: string // (opcjonalnie) id ukrytego inputa na gid
}

export default function SheetPicker({ urlInputId, sheetInputId, gidHiddenInputId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sheets, setSheets] = useState<{ name: string; gid: string | null }[]>([])
  const [selected, setSelected] = useState<string>('')

  async function fetchSheets() {
    setError(null)
    setSheets([])
    setSelected('')
    const urlEl = document.getElementById(urlInputId) as HTMLInputElement | null
    if (!urlEl || !urlEl.value) {
      setError('Wklej najpierw link do Google Sheets.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/gsheets/list?url=${encodeURIComponent(urlEl.value)}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'fetch_failed')
      setSheets(data.sheets || [])
      if ((data.sheets || []).length === 0) {
        setError('Nie znaleziono arkuszy. Upewnij się, że dokument jest publiczny/opublikowany.')
      }
    } catch (e: any) {
      setError('Nie udało się pobrać listy arkuszy.')
    } finally {
      setLoading(false)
    }
  }

  function applySelection(name: string) {
    setSelected(name)
    const sheetEl = document.getElementById(sheetInputId) as HTMLInputElement | null
    if (sheetEl) sheetEl.value = name
    // jeśli mamy hidden na gid, ustaw go dla wygody (jeśli wybrany ma gid)
    if (gidHiddenInputId) {
      const gidEl = document.getElementById(gidHiddenInputId) as HTMLInputElement | null
      const found = sheets.find(s => s.name === name)
      if (gidEl) gidEl.value = found?.gid ?? ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button type="button" className="pill pill--secondary" onClick={fetchSheets} disabled={loading}>
          {loading ? 'Pobieranie…' : 'Pobierz arkusze'}
        </button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>

      {sheets.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            className="rounded border px-3 py-2"
            value={selected}
            onChange={(e) => applySelection(e.target.value)}
          >
            <option value="" disabled>— wybierz kartę —</option>
            {sheets.map((s) => (
              <option key={`${s.name}-${s.gid ?? 'nogid'}`} value={s.name}>
                {s.name}{s.gid ? ` (gid: ${s.gid})` : ''}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-600">Zapisze nazwę do pola „Nazwa karty”.</span>
        </div>
      )}
    </div>
  )
}
