import { Group } from 'jazz-tools'
import type { Group as DomainGroup, Phase, Tournament, TournamentSettings } from '@/domain/types'
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

interface JazzSettingsLike extends JazzNodeLike {
  byePoints?: number
  tiebreakOrder?: string[]
}

interface JazzMatchLike extends JazzNodeLike {
  matchId?: string
  result?: string
}

interface JazzGroupLike extends JazzNodeLike {
  name?: string
  participants?: unknown
  matches?: Iterable<JazzMatchLike | null | undefined>
}

interface JazzPhaseLike {
  index?: number
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
  settings?: JazzSettingsLike
  phases?: JazzPhasesCollectionLike
  finishedAt?: string
  status?: string
}

function buildJazzParticipantList(group: DomainGroup, owner: Group) {
  const jazzParticipants = group.participants.map((p) =>
    JazzParticipant.create({ participantId: p.id, name: p.name, isBye: p.isBye }, { owner }),
  )
  return JazzParticipantList.create(jazzParticipants, { owner })
}

function buildJazzMatchList(group: DomainGroup, owner: Group) {
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
  return JazzMatchList.create(jazzMatches, { owner })
}

function buildJazzPhase(phase: Phase, owner: Group) {
  const jazzGroups = phase.groups.map((group) => {
    return JazzChessGroup.create(
      {
        name: group.name,
        participants: buildJazzParticipantList(group, owner),
        matches: buildJazzMatchList(group, owner),
      },
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

export async function replaceJazzGroup(
  jazzId: string,
  phaseIndex: number,
  groupName: string,
  group: DomainGroup,
): Promise<void> {
  const me = getJazzMe()
  if (!me) return

  const tournament = await JazzTournament.load(jazzId, {
    resolve: {
      phases: {
        $each: {
          groups: { $each: { participants: { $each: true }, matches: { $each: true } } },
        },
      },
    },
    loadAs: me,
  }) as JazzTournamentLike | null
  if (!tournament) return

  const owner = tournament.owner as Group | undefined
  const phases = tournament.phases
  if (!owner || !phases) return

  for (const phase of phases) {
    if (phase?.index !== phaseIndex) continue
    for (const jazzGroup of phase.groups ?? []) {
      if (jazzGroup?.name !== groupName) continue
      jazzGroup.$jazz.set('participants', buildJazzParticipantList(group, owner))
      jazzGroup.$jazz.set('matches', buildJazzMatchList(group, owner))
      return
    }
  }
}

export async function updateJazzTournamentSettings(
  jazzId: string,
  patch: Partial<Pick<TournamentSettings, 'byePoints' | 'tiebreakOrder'>>,
): Promise<void> {
  const me = getJazzMe()
  if (!me) return

  const tournament = await JazzTournament.load(jazzId, {
    resolve: { settings: true },
    loadAs: me,
  }) as JazzTournamentLike | null
  if (!tournament?.settings) return

  if (patch.byePoints !== undefined) {
    tournament.settings.$jazz.set('byePoints', patch.byePoints)
  }
  if (patch.tiebreakOrder !== undefined) {
    tournament.settings.$jazz.set('tiebreakOrder', [...patch.tiebreakOrder])
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
