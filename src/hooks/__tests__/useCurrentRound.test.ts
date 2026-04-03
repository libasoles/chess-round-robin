import { describe, it, expect } from 'vitest'
import {
  getCurrentRoundMatches,
  getTotalRounds,
  isRoundComplete,
} from '../useCurrentRound'
import { generateRoundRobinPairings } from '@/domain/roundRobin'
import { BYE_PARTICIPANT } from '@/domain/participants'
import type { Group, Participant, Phase } from '@/domain/types'

function makeParticipant(id: string): Participant {
  return { id, name: id, isBye: false }
}

function makeGroup(participants: Participant[], name = 'ALFA'): Group {
  const g: Group = { name, participants, matches: [] }
  return { ...g, matches: generateRoundRobinPairings(g) }
}

function makePhase(groups: Group[], index = 0): Phase {
  return { index, groups }
}

describe('getCurrentRoundMatches — bye visibility regression', () => {
  // 3 players → 1 group of 3 → BYE added automatically → auto_bye matches
  const players = ['Ana', 'Bob', 'Cara'].map(makeParticipant)
  const group = makeGroup(players)
  const phases = [makePhase([group])]

  it('returns matches for round 1', () => {
    const result = getCurrentRoundMatches(phases, 1)
    expect(result).toHaveLength(1)
    expect(result[0].matches.length).toBeGreaterThan(0)
  })

  it('auto_bye matches are included — not filtered out', () => {
    // This is the regression test: bye matches must appear in every round
    for (let round = 1; round <= 3; round++) {
      const result = getCurrentRoundMatches(phases, round)
      const allMatches = result.flatMap(r => r.matches)
      const byeMatches = allMatches.filter(m => m.result === 'auto_bye')
      expect(byeMatches).toHaveLength(1)
    }
  })

  it('each round has exactly 2 matches (1 real + 1 bye)', () => {
    for (let round = 1; round <= 3; round++) {
      const result = getCurrentRoundMatches(phases, round)
      const allMatches = result.flatMap(r => r.matches)
      expect(allMatches).toHaveLength(2)
    }
  })

  it('bye match participant IDs are resolvable when BYE_PARTICIPANT is in the map', () => {
    // Simulates what RoundPage does: seed the map with BYE_PARTICIPANT
    const participantMap = new Map<string, Participant>()
    participantMap.set(BYE_PARTICIPANT.id, BYE_PARTICIPANT)
    for (const p of players) {
      participantMap.set(p.id, p)
    }

    for (let round = 1; round <= 3; round++) {
      const result = getCurrentRoundMatches(phases, round)
      const byeMatches = result.flatMap(r => r.matches).filter(m => m.result === 'auto_bye')
      for (const match of byeMatches) {
        expect(participantMap.get(match.white)).toBeDefined()
        expect(participantMap.get(match.black)).toBeDefined()
      }
    }
  })
})

describe('isRoundComplete', () => {
  it('returns true when all matches are resolved (including auto_bye)', () => {
    const players = ['Ana', 'Bob', 'Cara'].map(makeParticipant)
    const group = makeGroup(players)
    // Resolve all real matches manually
    const resolvedMatches = group.matches.map(m =>
      m.result === null ? { ...m, result: 'white_win' as const } : m,
    )
    const resolvedGroup: Group = { ...group, matches: resolvedMatches }
    const phases = [makePhase([resolvedGroup])]

    expect(isRoundComplete(phases, 1)).toBe(true)
    expect(isRoundComplete(phases, 2)).toBe(true)
    expect(isRoundComplete(phases, 3)).toBe(true)
  })

  it('returns false when a real match in the round has no result', () => {
    const players = ['Ana', 'Bob', 'Cara'].map(makeParticipant)
    const group = makeGroup(players)
    // group has some null results for real matches
    const phases = [makePhase([group])]
    expect(isRoundComplete(phases, 1)).toBe(false)
  })
})

describe('getTotalRounds', () => {
  it('counts rounds from an odd group correctly', () => {
    const players = ['Ana', 'Bob', 'Cara'].map(makeParticipant)
    const group = makeGroup(players)
    const phases = [makePhase([group])]
    // 3 players → 3 rounds (Berger for 4 = 3 rounds)
    expect(getTotalRounds(phases)).toBe(3)
  })

  it('returns 0 for empty phases', () => {
    expect(getTotalRounds([])).toBe(0)
  })
})
