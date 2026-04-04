import { describe, it, expect } from 'vitest'
import { generateRoundRobinPairings } from '../roundRobin'
import { BYE_PARTICIPANT } from '../participants'
import type { Group, Participant } from '../types'

function makeParticipant(id: string): Participant {
  return { id, name: id, isBye: false }
}

function makeGroup(participants: Participant[]): Group {
  return { name: 'ALFA', participants, matches: [] }
}

function allPairsKey(white: string, black: string): string {
  return [white, black].sort().join('-')
}

describe('generateRoundRobinPairings', () => {
  describe('group of 4 (no Bye)', () => {
    const players = ['A', 'B', 'C', 'D'].map(makeParticipant)
    const group = makeGroup(players)
    const matches = generateRoundRobinPairings(group)

    it('returns 6 matches', () => {
      expect(matches).toHaveLength(6)
    })

    it('all matches have null result (no Bye)', () => {
      expect(matches.every(m => m.result === null)).toBe(true)
    })

    it('rounds are numbered 1, 2, 3', () => {
      const rounds = new Set(matches.map(m => m.round))
      expect([...rounds].sort()).toEqual([1, 2, 3])
    })

    it('2 matches per round', () => {
      for (let r = 1; r <= 3; r++) {
        expect(matches.filter(m => m.round === r)).toHaveLength(2)
      }
    })

    it('every pair of players appears exactly once', () => {
      const pairs = matches.map(m => allPairsKey(m.white, m.black))
      expect(pairs).toHaveLength(6)
      expect(new Set(pairs).size).toBe(6)
    })

    it('each player plays exactly 3 matches', () => {
      for (const p of players) {
        const count = matches.filter(m => m.white === p.id || m.black === p.id).length
        expect(count).toBe(3)
      }
    })

    it('each match has a unique id', () => {
      const ids = matches.map(m => m.id)
      expect(new Set(ids).size).toBe(6)
    })
  })

  describe('group of 2 (new phase minimum)', () => {
    const players = ['A', 'B'].map(makeParticipant)
    const group = makeGroup(players)
    const matches = generateRoundRobinPairings(group)

    it('returns 1 match', () => {
      expect(matches).toHaveLength(1)
    })

    it('match is in round 1', () => {
      expect(matches[0].round).toBe(1)
    })

    it('result is null', () => {
      expect(matches[0].result).toBeNull()
    })

    it('both players are in the match', () => {
      const ids = new Set([matches[0].white, matches[0].black])
      expect(ids).toContain('A')
      expect(ids).toContain('B')
    })
  })

  describe('group of 3 (odd — Bye added automatically)', () => {
    const players = ['A', 'B', 'C'].map(makeParticipant)
    const group = makeGroup(players)
    const matches = generateRoundRobinPairings(group)

    it('returns 6 matches (3 real + 3 bye)', () => {
      expect(matches).toHaveLength(6)
    })

    it('3 auto_bye matches', () => {
      expect(matches.filter(m => m.result === 'auto_bye')).toHaveLength(3)
    })

    it('3 real matches (null result)', () => {
      expect(matches.filter(m => m.result === null)).toHaveLength(3)
    })

    it('each real player gets exactly 1 bye match', () => {
      for (const p of players) {
        const byeMatches = matches.filter(
          m =>
            m.result === 'auto_bye' &&
            (m.white === p.id || m.black === p.id),
        )
        expect(byeMatches).toHaveLength(1)
      }
    })

    it('each real player plays exactly 2 real matches', () => {
      for (const p of players) {
        const realMatches = matches.filter(
          m =>
            m.result === null &&
            (m.white === p.id || m.black === p.id),
        )
        expect(realMatches).toHaveLength(2)
      }
    })

    it('every pair of real players meets exactly once', () => {
      const realMatches = matches.filter(m => m.result === null)
      const pairs = realMatches.map(m => allPairsKey(m.white, m.black))
      expect(new Set(pairs).size).toBe(3)
    })
  })

  describe('group of 6 (no Bye)', () => {
    const players = ['A', 'B', 'C', 'D', 'E', 'F'].map(makeParticipant)
    const group = makeGroup(players)
    const matches = generateRoundRobinPairings(group)

    it('returns 15 matches', () => {
      expect(matches).toHaveLength(15)
    })

    it('all matches have null result', () => {
      expect(matches.every(m => m.result === null)).toBe(true)
    })

    it('rounds are numbered 1 through 5', () => {
      const rounds = new Set(matches.map(m => m.round))
      expect([...rounds].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
    })

    it('3 matches per round', () => {
      for (let r = 1; r <= 5; r++) {
        expect(matches.filter(m => m.round === r)).toHaveLength(3)
      }
    })

    it('every pair appears exactly once', () => {
      const pairs = matches.map(m => allPairsKey(m.white, m.black))
      expect(pairs).toHaveLength(15)
      expect(new Set(pairs).size).toBe(15)
    })

    it('each player plays exactly 5 matches', () => {
      for (const p of players) {
        const count = matches.filter(m => m.white === p.id || m.black === p.id).length
        expect(count).toBe(5)
      }
    })
  })

  describe('group of 5 (odd — Bye added)', () => {
    const players = ['A', 'B', 'C', 'D', 'E'].map(makeParticipant)
    const group = makeGroup(players)
    const matches = generateRoundRobinPairings(group)

    it('returns 15 matches (5 rounds × 3 matches)', () => {
      expect(matches).toHaveLength(15)
    })

    it('5 auto_bye matches', () => {
      expect(matches.filter(m => m.result === 'auto_bye')).toHaveLength(5)
    })

    it('each real player gets exactly 1 bye match', () => {
      for (const p of players) {
        const byeMatches = matches.filter(
          m => m.result === 'auto_bye' && (m.white === p.id || m.black === p.id),
        )
        expect(byeMatches).toHaveLength(1)
      }
    })
  })

  describe('bye participant ID invariant', () => {
    it('auto_bye matches always reference BYE_PARTICIPANT.id on the bye side', () => {
      for (const count of [3, 5]) {
        const players = Array.from({ length: count }, (_, i) =>
          makeParticipant(String.fromCharCode(65 + i)),
        )
        const group = makeGroup(players)
        const matches = generateRoundRobinPairings(group)
        for (const match of matches.filter(m => m.result === 'auto_bye')) {
          const byeSide = match.white === BYE_PARTICIPANT.id || match.black === BYE_PARTICIPANT.id
          expect(byeSide).toBe(true)
        }
      }
    })
  })

  describe('determinism with seed', () => {
    const players = ['A', 'B', 'C', 'D'].map(makeParticipant)
    const group = makeGroup(players)

    it('same seed → same white/black assignment', () => {
      const m1 = generateRoundRobinPairings(group, 42)
      const m2 = generateRoundRobinPairings(group, 42)
      const pairs1 = m1.map(m => `${m.white}-${m.black}`)
      const pairs2 = m2.map(m => `${m.white}-${m.black}`)
      expect(pairs1).toEqual(pairs2)
    })

    it('both seeds produce schedules covering all 6 pairs', () => {
      const m1 = generateRoundRobinPairings(group, 1)
      const m2 = generateRoundRobinPairings(group, 999)
      // Normalize: sort each pair's two player IDs, then sort all pairs
      const normalize = (matches: typeof m1) =>
        matches
          .map(m => [m.white, m.black].sort().join('-'))
          .sort()
      expect(normalize(m1)).toEqual(normalize(m2))
    })

    it('no seed → still produces valid all-pairs schedule', () => {
      const matches = generateRoundRobinPairings(group)
      const pairs = matches.map(m => allPairsKey(m.white, m.black))
      expect(new Set(pairs).size).toBe(6)
    })
  })
})
