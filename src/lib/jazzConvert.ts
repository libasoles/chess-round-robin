import type { Match, MatchResult, Tournament, TiebreakMethod } from '@/domain/types'

/**
 * Converts a deeply loaded JazzTournament CoMap instance to a domain Tournament.
 * Returns null if the value is not yet loaded.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function jazzTournamentToDomain(jt: any): Tournament | null {
  if (!jt) return null

  try {
    const settings = jt.settings
    if (!settings) return null

    const phases = jt.phases
    if (!phases) return null

    return {
      id: jt.domainId as string,
      createdAt: jt.createdAt as string,
      finishedAt: jt.finishedAt as string | undefined,
      status: (jt.status as string) === 'finished' ? 'finished' : 'active',
      jazzId: jt.id as string,
      settings: {
        arbitratorName: settings.arbitratorName as string,
        organizerName: settings.organizerName as string | undefined,
        forfeitPoints: (settings.forfeitPoints as number) as 0 | 0.5 | 1,
        byePoints: (settings.byePoints as number) as 0 | 0.5 | 1,
        tiebreakOrder: (settings.tiebreakOrder as string[]).map(
          (t) => t as TiebreakMethod,
        ),
        useGroups: settings.useGroups as boolean,
      },
      phases: [...phases].map((phase: any) => ({
        index: phase.index as number,
        groups: [...(phase.groups ?? [])].map((group: any) => ({
          name: group.name as string,
          participants: [...(group.participants ?? [])].map((p: any) => ({
            id: p.participantId as string,
            name: p.name as string,
            isBye: p.isBye as boolean,
          })),
          matches: [...(group.matches ?? [])].map(
            (m: any): Match => ({
              id: m.matchId as string,
              white: m.white as string,
              black: m.black as string,
              round: m.round as number,
              result: (m.result as MatchResult) ?? null,
            }),
          ),
        })),
      })),
    }
  } catch {
    return null
  }
}
