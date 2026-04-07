import type { Group, Participant, ValidationResult } from './types'

export const BYE_PARTICIPANT: Participant = {
  id: 'bye',
  name: 'Libre',
  isBye: true,
}

export const GROUP_NAMES = ['ALFA', 'BETA', 'GAMMA', 'DELTA', 'EPSILON', 'ZETA', 'ETA', 'THETA', 'IOTA', 'KAPPA', 'LAMBDA', 'MU', 'NU', 'XI', 'OMICRON', 'PI', 'RHO', 'SIGMA', 'TAU', 'UPSILON', 'PHI', 'JI', 'PSI', 'OMEGA'] as const

/**
 * Capitalize the first letter of each word; lowercase all other letters.
 * Trims leading/trailing whitespace and collapses internal spaces.
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Validates a list of participant names (already normalized).
 * Errors: fewer than 3 names, or case-insensitive duplicates.
 */
export function validateParticipants(names: string[]): ValidationResult {
  const errors: string[] = []

  const normalized = names.map(normalizeName).filter(n => n.length > 0)

  if (normalized.length < 3) {
    errors.push('At least 3 participants are required')
  }

  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const name of normalized) {
    const key = name.toLowerCase()
    if (seen.has(key)) {
      duplicates.add(name)
    }
    seen.add(key)
  }

  if (duplicates.size > 0) {
    errors.push(`Duplicate participant names: ${[...duplicates].join(', ')}`)
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }
  return { valid: true }
}

/**
 * Distributes real participants into groups according to the given sizes.
 *
 * - Participants are assigned sequentially (first `sizes[0]` to group 0, etc.).
 * - If a group is allocated fewer real participants than its target size, a Bye
 *   is appended. This only applies when the total real participants is less than
 *   the sum of sizes (e.g. n=3 → sizes=[4], or n=5 → sizes=[6]).
 * - Groups of 3 real participants do NOT get a Bye here; that's handled by
 *   generateRoundRobinPairings when it detects an odd-sized group.
 * - matches starts empty.
 */
export function assignParticipantsToGroups(
  participants: Participant[],
  sizes: number[],
): Group[] {
  const groups: Group[] = []
  let offset = 0

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i]
    const name = GROUP_NAMES[i] ?? `GROUP_${i + 1}`
    const slice = participants.slice(offset, offset + size)
    offset += size

    const groupParticipants: Participant[] =
      slice.length < size ? [...slice, BYE_PARTICIPANT] : slice

    groups.push({ name, participants: groupParticipants, matches: [] })
  }

  return groups
}
