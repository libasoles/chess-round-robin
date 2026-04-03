import type { Match, Phase } from '@/domain/types'

export interface RoundMatches {
  groupName: string
  matches: Match[]
}

/**
 * Returns the matches for the given round number, grouped by group.
 * Searches across all phases.
 */
export function getCurrentRoundMatches(phases: Phase[], round: number): RoundMatches[] {
  const result: RoundMatches[] = []

  for (const phase of phases) {
    for (const group of phase.groups) {
      const matches = group.matches.filter((m) => m.round === round)
      if (matches.length > 0) {
        result.push({ groupName: group.name, matches })
      }
    }
  }

  return result
}

/** Returns the total number of rounds across all phases (max round number). */
export function getTotalRounds(phases: Phase[]): number {
  let max = 0
  for (const phase of phases) {
    for (const group of phase.groups) {
      for (const match of group.matches) {
        if (match.round > max) max = match.round
      }
    }
  }
  return max
}

/** Returns true if all matches for the given round are resolved. */
export function isRoundComplete(phases: Phase[], round: number): boolean {
  for (const phase of phases) {
    for (const group of phase.groups) {
      for (const match of group.matches) {
        if (match.round === round && match.result === null) return false
      }
    }
  }
  return true
}

/** Returns the first round number of the last (most recent) phase. */
export function getLastPhaseFirstRound(phases: Phase[]): number {
  if (phases.length === 0) return 1
  const lastPhase = phases[phases.length - 1]
  let min = Infinity
  for (const group of lastPhase.groups) {
    for (const match of group.matches) {
      if (match.round < min) min = match.round
    }
  }
  return min === Infinity ? 1 : min
}
