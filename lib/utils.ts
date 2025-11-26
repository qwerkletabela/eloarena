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
    year: '2-digit',
    month: 'numeric',
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

  if (end) {
    if (now.getTime() < start.getTime()) {
      const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const diffTime = startDate.getTime() - today.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return { text: 'dzisiaj', style: 'bg-sky-500/15 text-white border-sky-400/60' }
      if (diffDays === 1) return { text: 'jutro', style: 'bg-sky-500/15 text-white border-sky-400/60' }
      if (diffDays === 2) return { text: 'pojutrze', style: 'bg-sky-500/15 text-white border-sky-400/60' }
      return { text: `za ${diffDays} dni`, style: 'bg-sky-500/15 text-white border-sky-400/60' }
    }

    if (now.getTime() >= start.getTime() && now.getTime() <= end.getTime()) {
      return {
        text: 'w trakcie',
        style: 'bg-green-500/15 text-green-100 border-green-400/70',
      }
    }

    return {
      text: 'zakończony',
      style: 'bg-red-500/15 text-red-100 border-red-400/70',
    }
  }

  const ms = start.getTime() - now.getTime()
  if (ms > 0) {
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffTime = startDate.getTime() - today.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return { text: 'dzisiaj', style: 'bg-sky-500/15 text-white border-sky-400/60' }
    if (diffDays === 1) return { text: 'jutro', style: 'bg-sky-500/15 text-white border-sky-400/60' }
    if (diffDays === 2) return { text: 'pojutrze', style: 'bg-sky-500/15 text-white border-sky-400/60' }
    return { text: `za ${diffDays} dni`, style: 'bg-sky-500/15 text-white border-sky-400/60' }
  } else {
    const since = now.getTime() - start.getTime()
    if (since <= sixHours) {
      return {
        text: 'w trakcie',
        style: 'bg-green-500/15 text-green-100 border-green-400/70',
      }
    }
    return {
      text: 'zakończony',
      style: 'bg-red-500/15 text-red-100 border-red-400/70',
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

  const location = miejsce?.latitude && miejsce?.longitude 
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