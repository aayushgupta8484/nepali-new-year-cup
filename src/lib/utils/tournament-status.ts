type TournamentStatus =
  | 'registration'
  | 'upcoming'
  | 'group_stage'
  | 'knockout'
  | 'completed'

type TournamentPhase = 'pre' | 'live' | 'post'

interface TournamentInput {
  start_date: string
  end_date: string
  status: TournamentStatus
}

const PRE_STATUSES: TournamentStatus[] = ['registration', 'upcoming']

export function getTournamentPhase(tournament: TournamentInput): TournamentPhase {
  if (!tournament || !tournament.start_date || !tournament.end_date) {
    return 'pre'
  }

  if (tournament.status === 'completed') {
    return 'post'
  }

  if (PRE_STATUSES.includes(tournament.status)) {
    return 'pre'
  }

  const now = new Date()
  const start = new Date(tournament.start_date + 'T00:00:00')
  // End date is inclusive — the entire day counts
  const endInclusive = new Date(tournament.end_date + 'T23:59:59')

  if (now < start) {
    return 'pre'
  }

  if (now > endInclusive) {
    return 'post'
  }

  return 'live'
}
