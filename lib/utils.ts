import { styleText } from "util"

type MiejsceTurnieju = {
  id: string
  nazwa: string
  miasto: string
  wojewodztwo: string | null
  adres: string | null
  latitude: number | null
  longitude: number | null
}

type TurniejRow = {
  id: string
  nazwa: string
  data_turnieju: string | null
  godzina_turnieju: string | null
  zakonczenie_turnieju: string | null
  gsheet_url: string | null
  limit_graczy: number | null
  miejsce_id: string | null
  miejsce_turnieju: MiejsceTurnieju | null
}

export function joinDateTime(d: string | null, t: string | null): Date | null {
  if (!d) return null
  const hhmm = (t ?? '00:00').slice(0, 5)
  return new Date(`${d}T${hhmm}`)
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatDatePL(d: Date) {
  const formatted = d.toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return capitalizeFirst(formatted)
}

export function formatTimeHHMM(raw: string | null) {
  if (!raw) return '00:00'
  return raw.slice(0, 5)
}

export function statusBadge(start: Date | null, end: Date | null) {
  if (!start) return null

  const now = new Date()
  const sixHours = 6 * 60 * 60 * 1000

  //
  //  BAZA = „BUTTON” (jak do logowania)
  //
  const base =
    'inline-flex items-center justify-center rounded-full px-3 py-1 ' +
    'text-xs font-semibold tracking-wide text-white shadow-sm ' +
    'transition-colors'

  //
  //  KOLORY:
  //  - przyszłe: niebieski
  //  - w trakcie: zielony
  //  - zakończony: czerwony
  //
  const futureStyle = `${base} bg-blue-600 hover:bg-blue-500`
  const activeStyle = `${base} bg-emerald-600 hover:bg-emerald-500`
  const finishedStyle = `${base} bg-rose-600 hover:bg-rose-500`

  // Ile dni do startu (pełne dni kalendarzowe)
  const getDiffDays = () => {
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffTime = startDate.getTime() - today.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  //
  //  MAMY DATĘ KOŃCA
  //
  if (end) {
    // JESZCZE SIĘ NIE ZACZĄŁ → PRZYSZŁE (NIEBIESKI)
    if (now.getTime() < start.getTime()) {
      const diffDays = getDiffDays()

      if (diffDays === 0) return { text: 'dzisiaj', style: futureStyle }
      if (diffDays === 1) return { text: 'jutro', style: futureStyle }
      if (diffDays === 2) return { text: 'pojutrze', style: futureStyle }
      return { text: `za ${diffDays} dni`, style: futureStyle }
    }

    // W TRAKCIE → ZIELONY
    if (now.getTime() >= start.getTime() && now.getTime() <= end.getTime()) {
      return {
        text: 'w trakcie',
        style: activeStyle,
      }
    }

    // PO ZAKOŃCZENIU → CZERWONY
    return {
      text: 'zakończony',
      style: finishedStyle,
    }
  }

  //
  //  NIE MA DATY KOŃCA – TYLKO START
  //
  const ms = start.getTime() - now.getTime()
  if (ms > 0) {
    const diffDays = getDiffDays()

    if (diffDays === 0) return { text: 'dzisiaj', style: futureStyle }
    if (diffDays === 1) return { text: 'jutro', style: futureStyle }
    if (diffDays === 2) return { text: 'pojutrze', style: futureStyle }
    return { text: `za ${diffDays} dni`, style: futureStyle }
  } else {
    const since = now.getTime() - start.getTime()
    if (since <= sixHours) {
      return {
        text: 'w trakcie',
        style: activeStyle,
      }
    }
    return {
      text: 'zakończony',
      style: finishedStyle,
    }
  }
}

export function createGoogleCalendarUrl(r: TurniejRow): string | null {
  if (!r.data_turnieju) return null

  const start = joinDateTime(r.data_turnieju, r.godzina_turnieju)
  if (!start) return null

  const formatDateForGoogle = (date: Date) =>
    date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z'

  const startTime = formatDateForGoogle(start)

  let end: Date
  if (r.zakonczenie_turnieju) {
    const e = joinDateTime(r.data_turnieju, r.zakonczenie_turnieju)
    end = e ?? new Date(start.getTime() + 3 * 60 * 60 * 1000)
  } else {
    end = new Date(start.getTime() + 3 * 60 * 60 * 1000)
  }
  const endTime = formatDateForGoogle(end)

  const details: string[] = []
  if (r.limit_graczy) details.push(`Limit graczy: ${r.limit_graczy}`)
  if (r.gsheet_url) details.push(`Arkusz Google: ${r.gsheet_url}`)
  if (r.zakonczenie_turnieju) details.push(`Zakończenie: ${formatTimeHHMM(r.zakonczenie_turnieju)}`)

  const miejsce = r.miejsce_turnieju
  if (miejsce) {
    details.push(`Miejsce: ${miejsce.nazwa}, ${miejsce.miasto}`)
  }

  const location =
    miejsce?.latitude && miejsce?.longitude
      ? `https://maps.google.com/?q=${miejsce.latitude},${miejsce.longitude}`
      : miejsce?.adres || ''

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: r.nazwa,
    dates: `${startTime}/${endTime}`,
    details: details.join('\n'),
    location: location,
    ctz: 'Europe/Warsaw',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
