import type { Group, Match, Participant, Tournament } from './types'
import { BYE_PARTICIPANT, normalizeName } from './participants'
import { bergerTable } from '../lib/berger'

export type AddParticipantResult =
  | { ok: true; tournament: Tournament }
  | { ok: false; reason: 'groups-full' | 'round1-complete' | 'duplicate-name' | 'invalid-name' | 'no-active-phase' }

export type TargetGroupResult =
  | { full: false; groupName: string }
  | { full: true }

/**
 * Returns the target group for the next inserted participant, or { full: true }
 * when every group is at capacity.
 *
 * - useGroups=false → always the first (only) group, no cap.
 * - useGroups=true → first group whose real-participant count < settings.groupSize.
 *
 * Operates on the first phase, since adding participants is only allowed while
 * round 1 of phase 1 is in progress.
 */
export function findTargetGroup(tournament: Tournament): TargetGroupResult {
  const phase = tournament.phases[0]
  if (!phase) return { full: true }

  if (!tournament.settings.useGroups) {
    return { full: false, groupName: phase.groups[0]!.name }
  }

  const cap = tournament.settings.groupSize
  for (const group of phase.groups) {
    const realCount = group.participants.filter((p) => !p.isBye).length
    if (realCount < cap) return { full: false, groupName: group.name }
  }
  return { full: true }
}

function isRound1Complete(group: Group): boolean {
  for (const match of group.matches) {
    if (match.round === 1 && match.result === null) return false
  }
  return true
}

function isDuplicateName(tournament: Tournament, name: string): boolean {
  const lower = name.toLowerCase()
  for (const phase of tournament.phases) {
    for (const group of phase.groups) {
      for (const p of group.participants) {
        if (!p.isBye && p.name.toLowerCase() === lower) return true
      }
    }
  }
  return false
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Pure: returns a new Tournament with `newName` added to the first group with
 * available capacity. Round 1 matches with results are preserved; rounds ≥ 2
 * for the affected group are regenerated using a Berger schedule whose round 1
 * matches the new (real) round-1 pairings.
 */
export function addParticipantToActiveTournament(
  tournament: Tournament,
  rawName: string,
): AddParticipantResult {
  const newName = normalizeName(rawName)
  if (!newName) return { ok: false, reason: 'invalid-name' }
  if (isDuplicateName(tournament, newName)) return { ok: false, reason: 'duplicate-name' }

  const target = findTargetGroup(tournament)
  if (target.full) return { ok: false, reason: 'groups-full' }

  const phase = tournament.phases[0]
  if (!phase) return { ok: false, reason: 'no-active-phase' }

  const groupIdx = phase.groups.findIndex((g) => g.name === target.groupName)
  if (groupIdx === -1) return { ok: false, reason: 'no-active-phase' }
  const group = phase.groups[groupIdx]!

  if (isRound1Complete(group)) return { ok: false, reason: 'round1-complete' }

  const newParticipant: Participant = { id: newId(), name: newName, isBye: false }

  const updatedGroup = rebuildGroupWithNewParticipant(group, newParticipant)

  const updatedGroups = phase.groups.map((g, i) => (i === groupIdx ? updatedGroup : g))
  const updatedPhase = { ...phase, groups: updatedGroups }
  const updatedTournament: Tournament = {
    ...tournament,
    phases: [updatedPhase, ...tournament.phases.slice(1)],
  }

  return { ok: true, tournament: updatedTournament }
}

function rebuildGroupWithNewParticipant(group: Group, newParticipant: Participant): Group {
  // Existing round 1 matches
  const round1 = group.matches.filter((m) => m.round === 1)
  const keep = round1.filter((m) => m.result !== 'auto_bye')
  const byeMatch = round1.find((m) => m.result === 'auto_bye')

  // Identify the "freed" participant currently paired with Bye, if any.
  let freedPlayerId: string | null = null
  if (byeMatch) {
    freedPlayerId = byeMatch.white === BYE_PARTICIPANT.id ? byeMatch.black : byeMatch.white
  }

  // Build new participants list (real only, then Bye if needed for parity).
  const realParticipants: Participant[] = [
    ...group.participants.filter((p) => !p.isBye),
    newParticipant,
  ]
  const N = realParticipants.length % 2 === 0 ? realParticipants.length : realParticipants.length + 1
  const groupParticipants: Participant[] =
    realParticipants.length % 2 === 0
      ? realParticipants
      : [...realParticipants, BYE_PARTICIPANT]

  // Construct the new round 1 pair created by this insertion.
  let newRound1Match: Match
  if (freedPlayerId !== null) {
    // Freed player vs new player; freed keeps existing color (white by convention here).
    newRound1Match = {
      id: newId(),
      white: freedPlayerId,
      black: newParticipant.id,
      round: 1,
      result: null,
    }
  } else {
    // New player vs Bye (auto_bye).
    newRound1Match = {
      id: newId(),
      white: newParticipant.id,
      black: BYE_PARTICIPANT.id,
      round: 1,
      result: 'auto_bye',
    }
  }

  const newRound1: Match[] = [...keep, newRound1Match]

  // Sanity: newRound1 must contain exactly N/2 pairs covering all participants.
  // (If not, fall back to a fresh schedule — should not happen in normal flow.)
  if (newRound1.length !== N / 2) {
    return regenerateGroupFromScratch(group, groupParticipants)
  }

  // Build position array P[1..N] so bergerTable(N) round 0 matches newRound1.
  // Berger round 1 emits (pos1, posN), (pos2, posN-1), ..., (posN/2, posN/2+1).
  const P: string[] = new Array(N)
  for (let i = 0; i < newRound1.length; i++) {
    const m = newRound1[i]!
    P[i] = m.white
    P[N - 1 - i] = m.black
  }

  // Generate rounds 2..N-1 from Berger using these positions.
  const idToParticipant = new Map<string, Participant>()
  for (const p of groupParticipants) idToParticipant.set(p.id, p)

  const restMatches: Match[] = []
  if (N >= 4) {
    const table = bergerTable(N)
    // Skip round 0 (already handled by newRound1).
    for (let r = 1; r < table.length; r++) {
      for (const [whiteIdx, blackIdx] of table[r]!) {
        const whiteId = P[whiteIdx - 1]!
        const blackId = P[blackIdx - 1]!
        const isByeMatch = whiteId === BYE_PARTICIPANT.id || blackId === BYE_PARTICIPANT.id
        restMatches.push({
          id: newId(),
          white: whiteId,
          black: blackId,
          round: r + 1,
          result: isByeMatch ? 'auto_bye' : null,
        })
      }
    }
  }

  return {
    ...group,
    participants: groupParticipants,
    matches: [...newRound1, ...restMatches],
  }
}

/** Defensive fallback: fully fresh schedule. Loses round-1 results in the affected group. */
function regenerateGroupFromScratch(group: Group, groupParticipants: Participant[]): Group {
  const N = groupParticipants.length
  if (N < 4) {
    if (N === 2) {
      return {
        ...group,
        participants: groupParticipants,
        matches: [
          {
            id: newId(),
            white: groupParticipants[0]!.id,
            black: groupParticipants[1]!.id,
            round: 1,
            result: null,
          },
        ],
      }
    }
    return { ...group, participants: groupParticipants, matches: [] }
  }

  const table = bergerTable(N)
  const matches: Match[] = []
  for (let r = 0; r < table.length; r++) {
    for (const [whiteIdx, blackIdx] of table[r]!) {
      const white = groupParticipants[whiteIdx - 1]!
      const black = groupParticipants[blackIdx - 1]!
      const isBye = white.isBye || black.isBye
      matches.push({
        id: newId(),
        white: white.id,
        black: black.id,
        round: r + 1,
        result: isBye ? 'auto_bye' : null,
      })
    }
  }
  return { ...group, participants: groupParticipants, matches }
}
