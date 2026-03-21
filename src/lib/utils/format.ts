export function formatDate(
  dateStr: string,
  timeZone: string = 'America/Los_Angeles',
): string {
  if (!dateStr) return ''

  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'))
  return date.toLocaleDateString('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(
  isoDatetime: string,
  timeZone: string = 'America/Los_Angeles',
): string {
  if (!isoDatetime) return ''

  const date = new Date(isoDatetime)
  return date.toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatScore(
  home: number | null | undefined,
  away: number | null | undefined,
): string {
  if (home == null || away == null) return 'vs'
  return `${home} - ${away}`
}

export function formatMatchTitle(
  teamA: string | null | undefined,
  teamB: string | null | undefined,
): string {
  return `${teamA || 'TBD'} vs ${teamB || 'TBD'}`
}
