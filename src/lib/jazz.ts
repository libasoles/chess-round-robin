import { co, z } from 'jazz-tools'

export const JazzTournamentSettings = co.map({
  arbitratorName: z.string(),
  organizerName: z.optional(z.string()),
  forfeitPoints: z.number(),
  byePoints: z.number(),
  tiebreakOrder: z.array(z.string()),
  useGroups: z.boolean(),
})

export const JazzParticipant = co.map({
  participantId: z.string(),
  name: z.string(),
  isBye: z.boolean(),
})

export const JazzMatch = co.map({
  matchId: z.string(),
  white: z.string(),
  black: z.string(),
  round: z.number(),
  result: z.optional(z.string()),
})

export const JazzParticipantList = co.list(JazzParticipant)
export const JazzMatchList = co.list(JazzMatch)

export const JazzChessGroup = co.map({
  name: z.string(),
  participants: JazzParticipantList,
  matches: JazzMatchList,
})

export const JazzChessGroupList = co.list(JazzChessGroup)

export const JazzPhase = co.map({
  index: z.number(),
  groups: JazzChessGroupList,
})

export const JazzPhaseList = co.list(JazzPhase)

export const JazzTournament = co.map({
  domainId: z.string(),
  createdAt: z.string(),
  finishedAt: z.optional(z.string()),
  status: z.string(),
  settings: JazzTournamentSettings,
  phases: JazzPhaseList,
})
