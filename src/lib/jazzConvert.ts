import type { Match, MatchResult, Tournament, TiebreakMethod } from '@/domain/types'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) return null
  return value as Record<string, unknown>
}

function asIterable(value: unknown): Iterable<unknown> {
  if (!value) return []
  const maybeIterable = value as { [Symbol.iterator]?: unknown }
  return typeof maybeIterable[Symbol.iterator] === 'function'
    ? (value as Iterable<unknown>)
    : []
}

/**
 * Converts a deeply loaded JazzTournament CoMap instance to a domain Tournament.
 * Returns null if the value is not yet loaded.
 */
export function jazzTournamentToDomain(jt: unknown): Tournament | null {
  const root = asRecord(jt)
  if (!root) return null

  try {
    const settings = asRecord(root.settings)
    if (!settings) return null

    if (!root.phases) return null
    const phases = asIterable(root.phases)

    return {
      id: root.domainId as string,
      createdAt: root.createdAt as string,
      finishedAt: root.finishedAt as string | undefined,
      status: (root.status as string) === 'finished' ? 'finished' : 'active',
      jazzId: root.id as string,
      settings: {
        arbitratorName: settings.arbitratorName as string,
        organizerName: settings.organizerName as string | undefined,
        forfeitPoints: (settings.forfeitPoints as number) as 0 | 0.5 | 1,
        byePoints: (settings.byePoints as number) as 0 | 0.5 | 1,
        tiebreakOrder: (settings.tiebreakOrder as string[]).map(
          (t) => t as TiebreakMethod,
        ),
        useGroups: settings.useGroups as boolean,
        groupSize: (settings.groupSize as number | undefined) ?? 4,
      },
      phases: [...phases].map((phase) => ({
        index: (asRecord(phase)?.index ?? 0) as number,
        groups: [...asIterable(asRecord(phase)?.groups)].map((group) => ({
          name: asRecord(group)?.name as string,
          participants: [...asIterable(asRecord(group)?.participants)].map((p) => ({
            id: asRecord(p)?.participantId as string,
            name: asRecord(p)?.name as string,
            isBye: asRecord(p)?.isBye as boolean,
          })),
          matches: [...asIterable(asRecord(group)?.matches)].map(
            (m): Match => ({
              id: asRecord(m)?.matchId as string,
              white: asRecord(m)?.white as string,
              black: asRecord(m)?.black as string,
              round: asRecord(m)?.round as number,
              result: (asRecord(m)?.result as MatchResult) ?? null,
            }),
          ),
        })),
      })),
    }
  } catch {
    return null
  }
}
