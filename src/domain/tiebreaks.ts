import type { Group, TournamentSettings } from './types'
import { computeStandings } from './standings'

/**
 * Computes the Sonneborn-Berger score for a participant.
 *
 * SB = sum of final points of opponents beaten
 *    + 0.5 × sum of final points of opponents drawn against
 *
 * Bye matches are excluded from the calculation.
 */
export function computeSonnebornBerger(
  participantId: string,
  group: Group,
  settings: TournamentSettings,
): number {
  const finalStandings = computeStandings(group, settings)
  const finalPoints = new Map(finalStandings.map(e => [e.participantId, e.points]))
  const participantMap = new Map(group.participants.map(p => [p.id, p]))

  let sb = 0

  for (const match of group.matches) {
    if (match.result === null) continue

    const isWhite = match.white === participantId
    const isBlack = match.black === participantId
    if (!isWhite && !isBlack) continue

    const opponentId = isWhite ? match.black : match.white
    const opponent = participantMap.get(opponentId)

    // Exclude Bye matches
    if (opponent?.isBye) continue

    const opponentPoints = finalPoints.get(opponentId) ?? 0

    const participantWon =
      (isWhite && match.result === 'white_win') ||
      (isWhite && match.result === 'forfeit_black') ||
      (isBlack && match.result === 'black_win') ||
      (isBlack && match.result === 'forfeit_white')

    const drew =
      match.result === 'draw'

    if (participantWon) {
      sb += opponentPoints
    } else if (drew) {
      sb += 0.5 * opponentPoints
    }
    // loss → adds 0
  }

  return sb
}

/**
 * Applies Direct Encounter tiebreak to exactly 2 tied participants.
 *
 * Returns [[winner], [loser]] if resolved, or null if:
 * - tied.length !== 2
 * - the match between them was a draw
 * - the match has not been played (result is null)
 */
export function applyDirectEncounter(
  tied: string[],
  group: Group,
): string[][] | null {
  if (tied.length !== 2) return null

  const [a, b] = tied

  const match = group.matches.find(
    m =>
      (m.white === a && m.black === b) ||
      (m.white === b && m.black === a),
  )

  if (!match || match.result === null || match.result === 'draw') return null

  const aWon =
    (match.white === a && (match.result === 'white_win' || match.result === 'forfeit_black')) ||
    (match.black === a && (match.result === 'black_win' || match.result === 'forfeit_white'))

  return aWon ? [[a], [b]] : [[b], [a]]
}

/**
 * Ranks all real participants in a group, applying tiebreak methods in order.
 *
 * Returns an array of ranked groups: each inner array contains participant IDs
 * that are effectively tied at that rank after all tiebreaks are applied.
 *
 * Algorithm:
 * 1. computeStandings → group by equal points
 * 2. For each tied subgroup (size > 1), apply tiebreakOrder methods in sequence
 * 3. Recursively apply remaining methods to still-tied sub-groups
 */
export function rankWithTiebreaks(
  group: Group,
  settings: TournamentSettings,
): string[][] {
  const standings = computeStandings(group, settings)

  // Group by equal points (preserving sort order from computeStandings)
  const tiedGroups = groupByPoints(standings.map(e => e.participantId), standings)

  return tiedGroups.flatMap(tiedGroup =>
    resolveTiedGroup(tiedGroup, group, settings, settings.tiebreakOrder),
  )
}

function groupByPoints(
  ids: string[],
  standings: ReturnType<typeof computeStandings>,
): string[][] {
  const pointsMap = new Map(standings.map(e => [e.participantId, e.points]))
  const groups: string[][] = []
  let current: string[] = []
  let currentPoints: number | undefined

  for (const id of ids) {
    const pts = pointsMap.get(id) ?? 0
    if (currentPoints === undefined || pts === currentPoints) {
      current.push(id)
      currentPoints = pts
    } else {
      groups.push(current)
      current = [id]
      currentPoints = pts
    }
  }
  if (current.length > 0) groups.push(current)

  return groups
}

function resolveTiedGroup(
  tied: string[],
  group: Group,
  settings: TournamentSettings,
  remainingMethods: typeof settings.tiebreakOrder,
): string[][] {
  if (tied.length <= 1 || remainingMethods.length === 0) {
    return [tied]
  }

  const [method, ...rest] = remainingMethods

  if (method === 'DE') {
    // DE only applies to exactly 2-way ties
    if (tied.length === 2) {
      const result = applyDirectEncounter(tied, group)
      if (result !== null) {
        // Resolved — apply remaining methods recursively to each sub-group
        return result.flatMap(subGroup =>
          resolveTiedGroup(subGroup, group, settings, rest),
        )
      }
    }
    // Not applicable or unresolved → try next method
    return resolveTiedGroup(tied, group, settings, rest)
  }

  if (method === 'SB') {
    const sbScores = tied.map(id => ({
      id,
      sb: computeSonnebornBerger(id, group, settings),
    }))
    sbScores.sort((a, b) => b.sb - a.sb)

    // Re-group by equal SB scores
    const sbGroups: string[][] = []
    let current: string[] = []
    let currentSb: number | undefined

    for (const { id, sb } of sbScores) {
      if (currentSb === undefined || sb === currentSb) {
        current.push(id)
        currentSb = sb
      } else {
        sbGroups.push(current)
        current = [id]
        currentSb = sb
      }
    }
    if (current.length > 0) sbGroups.push(current)

    return sbGroups.flatMap(subGroup =>
      resolveTiedGroup(subGroup, group, settings, rest),
    )
  }

  // Unknown method — skip
  return resolveTiedGroup(tied, group, settings, rest)
}
