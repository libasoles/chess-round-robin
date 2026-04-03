export type MatchResult =
  | 'white_win'
  | 'black_win'
  | 'draw'
  | 'forfeit_white'
  | 'forfeit_black'
  | 'auto_bye'

export type TiebreakMethod = 'DE' | 'SB'

export type TournamentSettings = {
  arbitratorName: string
  forfeitPoints: 0 | 0.5 | 1
  byePoints: 0 | 0.5 | 1
  tiebreakOrder: TiebreakMethod[]
  useGroups: boolean
}

export type AppSettings = {
  arbitratorName: string | null
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
}

export type StandingEntry = {
  participantId: string
  points: number
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] }
