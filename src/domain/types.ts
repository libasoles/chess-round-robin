export type MatchResult =
  | 'white_win'
  | 'black_win'
  | 'draw'
  | 'forfeit_white'
  | 'forfeit_black'
  | 'auto_bye'

export type TiebreakMethod = 'DE' | 'SB' | 'Buchholz' | 'PN'

export type TournamentSettings = {
  arbitratorName: string
  organizerName?: string
  forfeitPoints: 0 | 0.5 | 1
  byePoints: 0 | 0.5 | 1
  tiebreakOrder: TiebreakMethod[]
  useGroups: boolean
}

export type AppSettings = {
  arbitratorName: string | null
  organizerName?: string | null
  lastTournamentSettings: TournamentSettings
}

export type Participant = {
  id: string
  name: string
  isBye: boolean
}

export type Match = {
  id: string
  white: string  // participant id
  black: string  // participant id
  round: number
  result: MatchResult | null
}

export type Group = {
  name: string
  participants: Participant[]
  matches: Match[]
}

export type Phase = {
  index: number
  groups: Group[]
}

export type Tournament = {
  id: string
  createdAt: string  // ISO 8601
  finishedAt?: string
  settings: TournamentSettings
  phases: Phase[]
  status: 'active' | 'finished'
  jazzId?: string  // CoID<JazzTournament> as string
}

export type StandingEntry = {
  participantId: string
  points: number
  tiebreakScores: Partial<Record<TiebreakMethod, number>>
  rank: number
  tiebreakUsed: TiebreakMethod | null
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] }
