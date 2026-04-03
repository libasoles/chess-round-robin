import type { Group, StandingEntry, TournamentSettings } from './types'
import { resolveMatchPoints } from './scoring'

/**
 * Computes the current standings for a group.
 *
 * - Excludes Bye participant (isBye=true) from results.
 * - Only counts matches with a non-null result.
 * - Returns entries sorted descending by points.
 */
export function computeStandings(
  group: Group,
  settings: TournamentSettings,
): StandingEntry[] {
  const participantMap = new Map(group.participants.map(p => [p.id, p]))
  const points = new Map<string, number>()

  // Initialize points for all real participants
  for (const p of group.participants) {
    if (!p.isBye) {
      points.set(p.id, 0)
    }
  }

  for (const match of group.matches) {
    if (match.result === null) continue

    const { whitePoints, blackPoints } = resolveMatchPoints(match, settings, participantMap)

    const whiteParticipant = participantMap.get(match.white)
    const blackParticipant = participantMap.get(match.black)

    if (whiteParticipant && !whiteParticipant.isBye) {
      points.set(match.white, (points.get(match.white) ?? 0) + whitePoints)
    }
    if (blackParticipant && !blackParticipant.isBye) {
      points.set(match.black, (points.get(match.black) ?? 0) + blackPoints)
    }
  }

  const unsorted: StandingEntry[] = Array.from(points.entries()).map(
    ([participantId, pts]) => ({
      participantId,
      points: pts,
      tiebreakScores: {},
      rank: 0,
      tiebreakUsed: null,
    }),
  )

  const sorted = unsorted.sort((a, b) => b.points - a.points)
  sorted.forEach((entry, index) => { entry.rank = index + 1 })
  return sorted
}
