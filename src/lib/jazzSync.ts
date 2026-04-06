import { Group } from 'jazz-tools'
import type { Phase, Tournament } from '@/domain/types'
import {
  JazzTournament,
  JazzTournamentSettings,
  JazzPhase,
  JazzPhaseList,
  JazzChessGroup,
  JazzChessGroupList,
  JazzParticipant,
  JazzParticipantList,
  JazzMatch,
  JazzMatchList,
} from './jazz'
import { getJazzMe } from './jazzAgent'

interface JazzNodeLike {
  $jazz: {
    set: (key: string, value: unknown) => void
  }
}

interface JazzMatchLike extends JazzNodeLike {
  matchId?: string
  result?: string
}

interface JazzGroupLike {
  matches?: Iterable<JazzMatchLike | null | undefined>
}

interface JazzPhaseLike {
  groups?: Iterable<JazzGroupLike | null | undefined>
}

interface JazzPhasesCollectionLike extends Iterable<JazzPhaseLike | null | undefined> {
  $jazz: {
    push: (phase: unknown) => void
  }
}

interface JazzTournamentLike extends JazzNodeLike {
  $jazz: {
    id: string
    set: (key: string, value: unknown) => void
  }
  owner?: unknown
  phases?: JazzPhasesCollectionLike
  finishedAt?: string
  status?: string
}

function buildJazzPhase(phase: Phase, owner: Group) {
  const jazzGroups = phase.groups.map((group) => {
    const jazzParticipants = group.participants.map((p) =>
      JazzParticipant.create({ participantId: p.id, name: p.name, isBye: p.isBye }, { owner }),
    )
    const participantList = JazzParticipantList.create(jazzParticipants, { owner })

    const jazzMatches = group.matches.map((m) =>
      JazzMatch.create(
        {
          matchId: m.id,
          white: m.white,
          black: m.black,
          round: m.round,
          result: m.result ?? undefined,
        },
        { owner },
      ),
    )
    const matchList = JazzMatchList.create(jazzMatches, { owner })

    return JazzChessGroup.create(
      { name: group.name, participants: participantList, matches: matchList },
      { owner },
    )
  })

  const groupList = JazzChessGroupList.create(jazzGroups, { owner })
  return JazzPhase.create({ index: phase.index, groups: groupList }, { owner })
}

export function createJazzTournament(tournament: Tournament): string {
  const me = getJazzMe()
  if (!me) throw new Error('Jazz not initialized')

  const group = Group.create({ owner: me }).makePublic('reader')

  const settings = JazzTournamentSettings.create(
    {
      arbitratorName: tournament.settings.arbitratorName,
      organizerName: tournament.settings.organizerName ?? undefined,
      forfeitPoints: tournament.settings.forfeitPoints,
      byePoints: tournament.settings.byePoints,
      tiebreakOrder: [...tournament.settings.tiebreakOrder],
      useGroups: tournament.settings.useGroups,
    },
    { owner: group },
  )

  const jazzPhases = tournament.phases.map((phase) => buildJazzPhase(phase, group))
  const phaseList = JazzPhaseList.create(jazzPhases, { owner: group })

  const jazzTournament = JazzTournament.create(
    {
      domainId: tournament.id,
      createdAt: tournament.createdAt,
      finishedAt: tournament.finishedAt ?? undefined,
      status: tournament.status,
      settings,
      phases: phaseList,
    },
    { owner: group },
  )

  const jazzId = (jazzTournament as JazzTournamentLike).$jazz.id
  if (typeof jazzId !== 'string') {
    throw new Error('Jazz tournament id is missing')
  }
  return jazzId
}

export async function updateJazzMatch(
  jazzId: string,
  matchId: string,
  result: string | null,
): Promise<void> {
  const me = getJazzMe()
  if (!me) return

  const tournament = await JazzTournament.load(jazzId, {
    resolve: { phases: { $each: { groups: { $each: { matches: { $each: true } } } } } },
    loadAs: me,
  }) as JazzTournamentLike | null
  if (!tournament) return

  const phases = tournament.phases
  if (!phases) return

  for (const phase of phases) {
    for (const group of (phase?.groups ?? [])) {
      for (const match of (group?.matches ?? [])) {
        if (match?.matchId === matchId) {
          match.$jazz.set('result', result ?? undefined)
          return
        }
      }
    }
  }
}

export async function finishJazzTournament(jazzId: string, finishedAt: string): Promise<void> {
  const me = getJazzMe()
  if (!me) return

  const tournament = await JazzTournament.load(jazzId, { loadAs: me }) as JazzTournamentLike | null
  if (!tournament) return

  tournament.$jazz.set('finishedAt', finishedAt)
  tournament.$jazz.set('status', 'finished')
}

export async function addJazzPhase(jazzId: string, newPhase: Phase): Promise<void> {
  const me = getJazzMe()
  if (!me) return

  const tournament = await JazzTournament.load(jazzId, {
    resolve: { phases: true },
    loadAs: me,
  }) as JazzTournamentLike | null
  if (!tournament) return

  const group = tournament.owner as Group
  const jazzPhase = buildJazzPhase(newPhase, group)
  tournament.phases?.$jazz.push(jazzPhase)
}
