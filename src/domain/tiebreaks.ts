import type { Group, StandingEntry, TiebreakMethod, TournamentSettings } from './types'
import { computeStandings } from './standings'
import { resolveMatchPoints } from './scoring'

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
 * Computes the Buchholz score for a participant.
 *
 * Buchholz = sum of final points of ALL opponents faced.
 * Bye matches are excluded from the calculation.
 */
export function computeBuchholz(
  participantId: string,
  group: Group,
  settings: TournamentSettings,
): number {
  const finalStandings = computeStandings(group, settings)
  const finalPoints = new Map(finalStandings.map(e => [e.participantId, e.points]))
  const participantMap = new Map(group.participants.map(p => [p.id, p]))

  const opponentsEncountered = new Set<string>()

  for (const match of group.matches) {
    if (match.result === null) continue

    const isWhite = match.white === participantId
    const isBlack = match.black === participantId
    if (!isWhite && !isBlack) continue

    const opponentId = isWhite ? match.black : match.white
    const opponent = participantMap.get(opponentId)
    if (opponent?.isBye) continue

    opponentsEncountered.add(opponentId)
  }

  let buchholz = 0
  for (const opponentId of opponentsEncountered) {
    buchholz += finalPoints.get(opponentId) ?? 0
  }

  return buchholz
}

/**
 * Computes Partidas Ganadas con Negras (PN) — wins with black pieces.
 *
 * Counts: black_win, forfeit_white (black wins by opponent forfeit).
 * Does NOT count: draw, auto_bye, white_win, forfeit_black.
 */
export function computePartidasGanadasConNegras(
  participantId: string,
  group: Group,
): number {
  let count = 0
  for (const match of group.matches) {
    if (match.result === null) continue
    if (match.black !== participantId) continue
    if (match.result === 'black_win' || match.result === 'forfeit_white') {
      count++
    }
  }
  return count
}

/**
 * Computes Koya score — points scored against opponents who finished with >= 50%
 * of the maximum possible points (i.e., opponents who scored well).
 *
 * Bye matches are excluded.
 */
export function computeKoya(
  participantId: string,
  group: Group,
  settings: TournamentSettings,
): number {
  const finalStandings = computeStandings(group, settings)
  const finalPoints = new Map(finalStandings.map(e => [e.participantId, e.points]))
  const participantMap = new Map(group.participants.map(p => [p.id, p]))

  // Max possible = number of real (non-bye) participants - 1
  const realCount = group.participants.filter(p => !p.isBye).length
  const threshold = (realCount - 1) / 2

  let koya = 0

  for (const match of group.matches) {
    if (match.result === null) continue

    const isWhite = match.white === participantId
    const isBlack = match.black === participantId
    if (!isWhite && !isBlack) continue

    const opponentId = isWhite ? match.black : match.white
    if (participantMap.get(opponentId)?.isBye) continue

    // Only count against opponents above threshold
    if ((finalPoints.get(opponentId) ?? 0) < threshold) continue

    // Use tournament scoring (respects forfeitPoints setting)
    const { whitePoints, blackPoints } = resolveMatchPoints(match, settings, participantMap)
    koya += isWhite ? whitePoints : blackPoints
  }

  return koya
}

/**
 * Applies Direct Encounter tiebreak to N >= 2 tied participants.
 *
 * Computes a mini-tournament score for each tied player based only on matches
 * between tied players. Matches are scored naturally (win=1, draw=0.5, loss=0).
 * Unplayed matches are omitted (neither player gets points).
 *
 * Returns sorted groups [[...], [...]] if mini-tournament resolves the tie,
 * or null if:
 * - tied.length < 2
 * - no matches have been played between tied players
 * - all tied players have equal mini-tournament scores
 */
export function applyDirectEncounter(
  tied: string[],
  group: Group,
): string[][] | null {
  if (tied.length < 2) return null

  const tiedSet = new Set(tied)
  const miniScores = new Map<string, number>(tied.map(id => [id, 0]))
  let hasAnyPlayedMatch = false

  // Compute mini-tournament scores: only matches between tied players
  for (const match of group.matches) {
    if (!tiedSet.has(match.white) || !tiedSet.has(match.black)) continue
    if (match.result === null) continue // unplayed match → omitted

    hasAnyPlayedMatch = true

    // Natural scoring: win=1, draw=0.5, loss=0 (NOT configurable forfeitPoints)
    if (match.result === 'white_win' || match.result === 'forfeit_black') {
      miniScores.set(match.white, miniScores.get(match.white)! + 1)
    } else if (match.result === 'black_win' || match.result === 'forfeit_white') {
      miniScores.set(match.black, miniScores.get(match.black)! + 1)
    } else if (match.result === 'draw') {
      miniScores.set(match.white, miniScores.get(match.white)! + 0.5)
      miniScores.set(match.black, miniScores.get(match.black)! + 0.5)
    }
    // 'auto_bye' cannot occur between two real players; ignored
  }

  if (!hasAnyPlayedMatch) return null

  // Sort by mini-tournament score and group
  const scored = tied.map(id => ({ id, score: miniScores.get(id)! }))
  scored.sort((a, b) => b.score - a.score)
  const groups = groupByScore(scored)

  if (groups.length === 1) return null // all equal in mini-tournament
  return groups
}

/**
 * Applies Tablas con Negras (TN) tiebreak to N >= 2 tied participants.
 *
 * Like Direct Encounter, but with modified scoring for draws:
 * - win/forfeit: same as DE (winner +1)
 * - draw: black +1, white +0 (special rule)
 *
 * Returns sorted groups [[...], [...]] if the mini-tournament resolves the tie,
 * or null if:
 * - tied.length < 2
 * - no matches have been played between tied players
 * - all tied players have equal mini-tournament scores
 */
export function applyTablaConNegras(
  tied: string[],
  group: Group,
): string[][] | null {
  if (tied.length < 2) return null

  const tiedSet = new Set(tied)
  const miniScores = new Map<string, number>(tied.map(id => [id, 0]))
  let hasAnyPlayedMatch = false

  for (const match of group.matches) {
    if (!tiedSet.has(match.white) || !tiedSet.has(match.black)) continue
    if (match.result === null) continue

    hasAnyPlayedMatch = true

    if (match.result === 'white_win' || match.result === 'forfeit_black') {
      miniScores.set(match.white, miniScores.get(match.white)! + 1)
    } else if (match.result === 'black_win' || match.result === 'forfeit_white') {
      miniScores.set(match.black, miniScores.get(match.black)! + 1)
    } else if (match.result === 'draw') {
      // Special rule: draw with black pieces counts as 1 pt; white gets 0
      miniScores.set(match.black, miniScores.get(match.black)! + 1)
    }
    // 'auto_bye' cannot occur between two real players; ignored
  }

  if (!hasAnyPlayedMatch) return null

  const scored = tied.map(id => ({ id, score: miniScores.get(id)! }))
  scored.sort((a, b) => b.score - a.score)
  const groups = groupByScore(scored)

  if (groups.length === 1) return null // all equal in mini-tournament
  return groups
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
    const result = applyDirectEncounter(tied, group)
    if (result !== null) {
      // Resolved — apply remaining methods recursively to each sub-group
      return result.flatMap(subGroup =>
        resolveTiedGroup(subGroup, group, settings, rest),
      )
    }
    // Not applicable or unresolved → try next method
    return resolveTiedGroup(tied, group, settings, rest)
  }

  if (method === 'TN') {
    const result = applyTablaConNegras(tied, group)
    if (result !== null) {
      return result.flatMap(subGroup =>
        resolveTiedGroup(subGroup, group, settings, rest),
      )
    }
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

  if (method === 'Buchholz') {
    const scores = tied.map(id => ({
      id,
      score: computeBuchholz(id, group, settings),
    }))
    scores.sort((a, b) => b.score - a.score)

    const buchholzGroups = groupByScore(scores)

    return buchholzGroups.flatMap(subGroup =>
      resolveTiedGroup(subGroup, group, settings, rest),
    )
  }

  if (method === 'PN') {
    const scores = tied.map(id => ({
      id,
      score: computePartidasGanadasConNegras(id, group),
    }))
    scores.sort((a, b) => b.score - a.score)

    const pnGroups = groupByScore(scores)

    return pnGroups.flatMap(subGroup =>
      resolveTiedGroup(subGroup, group, settings, rest),
    )
  }

  if (method === 'Koya') {
    const scores = tied.map(id => ({
      id,
      score: computeKoya(id, group, settings),
    }))
    scores.sort((a, b) => b.score - a.score)

    const koyaGroups = groupByScore(scores)

    return koyaGroups.flatMap(subGroup =>
      resolveTiedGroup(subGroup, group, settings, rest),
    )
  }

  // Unknown method — skip
  return resolveTiedGroup(tied, group, settings, rest)
}

// Helper: group pre-sorted scored entries by equal score into string[][] buckets
function groupByScore(scored: Array<{ id: string; score: number }>): string[][] {
  const groups: string[][] = []
  let current: string[] = []
  let currentScore: number | undefined

  for (const { id, score } of scored) {
    if (currentScore === undefined || score === currentScore) {
      current.push(id)
      currentScore = score
    } else {
      groups.push(current)
      current = [id]
      currentScore = score
    }
  }
  if (current.length > 0) groups.push(current)
  return groups
}

// Helper: compute numeric score for a non-DE, non-TN method
function computeScoreForMethod(
  method: Exclude<TiebreakMethod, 'DE' | 'TN'>,
  participantId: string,
  group: Group,
  settings: TournamentSettings,
): number {
  switch (method) {
    case 'SB': return computeSonnebornBerger(participantId, group, settings)
    case 'Buchholz': return computeBuchholz(participantId, group, settings)
    case 'PN': return computePartidasGanadasConNegras(participantId, group)
    case 'Koya': return computeKoya(participantId, group, settings)
  }
}

// Helper: find the first tiebreak method that separates participantId from its co-tied players
function findFirstResolvingMethod(
  participantId: string,
  coTied: string[],
  group: Group,
  settings: TournamentSettings,
): TiebreakMethod | null {
  for (const method of settings.tiebreakOrder) {
    if (method === 'DE') {
      if (applyDirectEncounter([participantId, ...coTied], group) !== null) return 'DE'
      continue
    }
    if (method === 'TN') {
      if (applyTablaConNegras([participantId, ...coTied], group) !== null) return 'TN'
      continue
    }
    const myScore = computeScoreForMethod(method, participantId, group, settings)
    const differFromSomeone = coTied.some(
      id => computeScoreForMethod(method, id, group, settings) !== myScore,
    )
    if (differFromSomeone) return method
  }
  return null
}

/**
 * Computes a fully-ranked standings list with tiebreak metadata.
 *
 * Returns StandingEntry[] sorted by rank, where each entry includes:
 * - rank: 1-based; players still tied share the same rank
 * - tiebreakScores: computed scores for each enabled non-DE method
 * - tiebreakUsed: the first method that separated this player from co-tied opponents,
 *   or null if no tie existed / tie is unresolved
 */
export function computeRankedStandings(
  group: Group,
  settings: TournamentSettings,
): StandingEntry[] {
  const rawStandings = computeStandings(group, settings)
  const pointsByPlayer = new Map(rawStandings.map(e => [e.participantId, e.points]))

  // Map each player to the other players they were originally tied with on points
  const coTiedByPlayer = new Map<string, string[]>()
  for (const entry of rawStandings) {
    const coTied = rawStandings
      .filter(e => e.participantId !== entry.participantId && e.points === entry.points)
      .map(e => e.participantId)
    coTiedByPlayer.set(entry.participantId, coTied)
  }

  // Get final ordered groups (ties resolved as much as possible)
  const rankedGroups = rankWithTiebreaks(group, settings)

  const result: StandingEntry[] = []
  let currentRank = 1

  for (const outputGroup of rankedGroups) {
    for (const id of outputGroup) {
      const coTied = coTiedByPlayer.get(id) ?? []

      // tiebreakUsed: set when the player was in a point-tie that was at least partially resolved
      // (i.e., they are now in a singleton or smaller group than their original tied set)
      const wasInPointTie = coTied.length > 0
      const stillTiedWithAll =
        wasInPointTie && coTied.every(other => outputGroup.includes(other))
      const tiebreakUsed: TiebreakMethod | null =
        wasInPointTie && !stillTiedWithAll
          ? findFirstResolvingMethod(id, coTied, group, settings)
          : null

      // Compute numeric tiebreak scores for all enabled non-DE methods
      const tiebreakScores: Partial<Record<TiebreakMethod, number>> = {}
      for (const method of settings.tiebreakOrder) {
        if (method !== 'DE' && method !== 'TN') {
          tiebreakScores[method] = computeScoreForMethod(method, id, group, settings)
        }
      }

      result.push({
        participantId: id,
        points: pointsByPlayer.get(id) ?? 0,
        tiebreakScores,
        rank: currentRank,
        tiebreakUsed,
      })
    }
    currentRank += outputGroup.length
  }

  return result
}
