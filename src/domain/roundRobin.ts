import type { Group, Match } from './types'
import { BYE_PARTICIPANT } from './participants'
import { bergerTable } from '../lib/berger'

/**
 * Generates round-robin pairings for a group using the Berger circle method.
 *
 * - If the group has an odd number of participants, BYE_PARTICIPANT is added
 *   as the last participant before generating pairings.
 * - Matches involving the Bye are pre-resolved as 'auto_bye'.
 * - If a seed is provided, the participant order is shuffled with a seeded
 *   Fisher-Yates shuffle before mapping Berger indices — giving deterministic
 *   but varied color assignments.
 *
 * @returns A flat array of Match objects across all rounds.
 */
export function generateRoundRobinPairings(group: Group, seed?: number): Match[] {
  let participants = [...group.participants]

  // Add Bye if needed to make the count even
  if (participants.length % 2 !== 0) {
    participants = [...participants, BYE_PARTICIPANT]
  }

  const n = participants.length

  // Optionally shuffle participant order for color variety
  if (seed !== undefined) {
    participants = seededShuffle(participants, seed)
  }

  // Special case: n=2 — single round, one match (bergerTable requires n>=4)
  if (n === 2) {
    return [{
      id: crypto.randomUUID(),
      white: participants[0].id,
      black: participants[1].id,
      round: 1,
      result: null,
    }]
  }

  const table = bergerTable(n)
  const matches: Match[] = []

  for (let roundIndex = 0; roundIndex < table.length; roundIndex++) {
    const round = table[roundIndex]
    for (const [whiteIdx, blackIdx] of round) {
      // Berger indices are 1-based
      const white = participants[whiteIdx - 1]
      const black = participants[blackIdx - 1]

      const isByeMatch = white.isBye || black.isBye

      matches.push({
        id: crypto.randomUUID(),
        white: white.id,
        black: black.id,
        round: roundIndex + 1,
        result: isByeMatch ? 'auto_bye' : null,
      })
    }
  }

  return matches
}

/**
 * Seeded Fisher-Yates shuffle.
 * Uses a simple mulberry32 PRNG for deterministic results given the same seed.
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array]
  const rng = mulberry32(seed)

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = result[i]
    result[i] = result[j]!
    result[j] = temp!
  }

  return result
}

function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let z = Math.imul(s ^ (s >>> 15), 1 | s)
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296
  }
}
