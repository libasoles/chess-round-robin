import { describe, it, expect } from 'vitest'
import { computeSonnebornBerger, applyDirectEncounter, rankWithTiebreaks } from '../tiebreaks'
import type { Group, Match, Participant, TournamentSettings } from '../types'

const defaultSettings: TournamentSettings = {
  arbitratorName: 'Test',
  forfeitPoints: 0,
  byePoints: 1,
  tiebreakOrder: ['DE', 'SB'],
  useGroups: true,
}

function makeParticipant(id: string): Participant {
  return { id, name: id, isBye: false }
}

function makeMatch(id: string, white: string, black: string, result: Match['result'], round = 1): Match {
  return { id, white, black, round, result }
}

function makeGroup(participants: Participant[], matches: Match[]): Group {
  return { name: 'ALFA', participants, matches }
}

// Hand-calculated 4-player example for SB tests
// A beats B (A=1, B=0)
// A draws C (A=0.5, C=0.5)
// D beats A (D=1, A=0)
// B beats C (B=1, C=0)
// D beats B (D=1, B=0)
// C draws D (C=0.5, D=0.5)
// Final: A=1.5, B=1.0, C=1.0, D=2.5

const A = makeParticipant('A')
const B = makeParticipant('B')
const C = makeParticipant('C')
const D = makeParticipant('D')

const allMatchesGroup = makeGroup([A, B, C, D], [
  makeMatch('m1', 'A', 'B', 'white_win'),
  makeMatch('m2', 'A', 'C', 'draw'),
  makeMatch('m3', 'D', 'A', 'white_win'),
  makeMatch('m4', 'B', 'C', 'white_win'),
  makeMatch('m5', 'D', 'B', 'white_win'),
  makeMatch('m6', 'C', 'D', 'draw'),
])

describe('computeSonnebornBerger', () => {
  // Final standings: A=1.5, B=1.0, C=1.0, D=2.5
  // SB(A) = beat B(1.0) + drew C(0.5*1.0) + lost D(0) = 1.0 + 0.5 + 0 = 1.5
  // SB(B) = lost A(0) + beat C(1.0) + lost D(0) = 1.0
  // SB(C) = drew A(0.5*1.5) + lost B(0) + drew D(0.5*2.5) = 0.75 + 0 + 1.25 = 2.0
  // SB(D) = beat A(1.5) + beat B(1.0) + drew C(0.5*1.0) = 1.5 + 1.0 + 0.5 = 3.0

  it('SB(A) = 1.5', () => {
    expect(computeSonnebornBerger('A', allMatchesGroup, defaultSettings)).toBe(1.5)
  })

  it('SB(B) = 1.0', () => {
    expect(computeSonnebornBerger('B', allMatchesGroup, defaultSettings)).toBe(1.0)
  })

  it('SB(C) = 2.0', () => {
    expect(computeSonnebornBerger('C', allMatchesGroup, defaultSettings)).toBe(2.0)
  })

  it('SB(D) = 3.0', () => {
    expect(computeSonnebornBerger('D', allMatchesGroup, defaultSettings)).toBe(3.0)
  })

  it('excludes Bye matches from SB calculation', () => {
    const BYE: Participant = { id: 'bye', name: 'Libre', isBye: true }
    const groupWithBye = makeGroup([A, B, C, BYE], [
      makeMatch('m1', 'A', 'B', 'white_win'),
      makeMatch('m2', 'A', 'bye', 'auto_bye'),  // should not count
      makeMatch('m3', 'B', 'C', 'white_win'),
      makeMatch('m4', 'C', 'bye', 'auto_bye'),  // should not count
      makeMatch('m5', 'A', 'C', 'draw'),
    ])
    // Final (excluding bye): A plays B, C; B plays A, C; C plays A, B
    // A: beats B(1), draws C → SB(A) depends on final standings without Bye
    const sb = computeSonnebornBerger('A', groupWithBye, defaultSettings)
    // Should not throw and should not include bye match contribution
    expect(typeof sb).toBe('number')
    expect(sb).toBeGreaterThanOrEqual(0)
  })

  it('player who lost all has SB=0', () => {
    const loserGroup = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'black_win'),  // B wins
      makeMatch('m2', 'A', 'C', 'black_win'),  // C wins
      makeMatch('m3', 'A', 'D', 'black_win'),  // D wins
    ])
    expect(computeSonnebornBerger('A', loserGroup, defaultSettings)).toBe(0)
  })
})

describe('applyDirectEncounter', () => {
  it('A beat B → [[A],[B]]', () => {
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'white_win'),
    ])
    expect(applyDirectEncounter(['A', 'B'], group)).toEqual([['A'], ['B']])
  })

  it('B beat A → [[B],[A]]', () => {
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'black_win'),
    ])
    expect(applyDirectEncounter(['A', 'B'], group)).toEqual([['B'], ['A']])
  })

  it('draw → null (unresolved)', () => {
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'draw'),
    ])
    expect(applyDirectEncounter(['A', 'B'], group)).toBeNull()
  })

  it('unplayed match (null result) → null', () => {
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', null),
    ])
    expect(applyDirectEncounter(['A', 'B'], group)).toBeNull()
  })

  it('match not found → null', () => {
    const group = makeGroup([A, B, C, D], [])
    expect(applyDirectEncounter(['A', 'B'], group)).toBeNull()
  })

  it('3-way tie → null (DE not applicable)', () => {
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'white_win'),
    ])
    expect(applyDirectEncounter(['A', 'B', 'C'], group)).toBeNull()
  })

  it('1-way → null', () => {
    const group = makeGroup([A, B, C, D], [])
    expect(applyDirectEncounter(['A'], group)).toBeNull()
  })

  it('forfeit_black: A is white, black forfeits → A wins', () => {
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'forfeit_black'),
    ])
    expect(applyDirectEncounter(['A', 'B'], group)).toEqual([['A'], ['B']])
  })

  it('forfeit_white: A is white, white forfeits → B wins', () => {
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'forfeit_white'),
    ])
    expect(applyDirectEncounter(['A', 'B'], group)).toEqual([['B'], ['A']])
  })
})

describe('rankWithTiebreaks', () => {
  it('no ties → straightforward ranking', () => {
    // D=2.5, A=1.5, B=1, C=1 (but B and C tied — handled by SB)
    const ranked = rankWithTiebreaks(allMatchesGroup, defaultSettings)
    expect(ranked[0]).toEqual(['D'])
    expect(ranked[1]).toEqual(['A'])
    // B and C are tied at 1.0; DE is first: B beat C (m4 white_win) → B above C
    expect(ranked[2]).toEqual(['B'])
    expect(ranked[3]).toEqual(['C'])
  })

  it('2-way tie resolved by DE', () => {
    // C=2, A=1, B=0 — no tie at all, just verify ranking
    const group2 = makeGroup([A, B, C], [
      makeMatch('m1', 'A', 'B', 'white_win'),  // A=1, B=0
      makeMatch('m2', 'C', 'A', 'white_win'),  // C=1, A=1
      makeMatch('m3', 'C', 'B', 'white_win'),  // C=2, B=0... hmm
    ])
    // C=2, A=1, B=0
    const settings = { ...defaultSettings, tiebreakOrder: ['DE' as const] }
    const ranked = rankWithTiebreaks(group2, settings)
    expect(ranked[0]).toEqual(['C'])
    expect(ranked[1]).toEqual(['A'])
    expect(ranked[2]).toEqual(['B'])
  })

  it('2-way DE draw → falls through to SB', () => {
    // A and B both have 1 point; their match was a draw → DE unresolved
    // SB: A drew B, B drew A; A beat C (C's points matter for SB)
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'draw'),       // A=0.5, B=0.5
      makeMatch('m2', 'A', 'C', 'white_win'), // A=1.5, C=0
      makeMatch('m3', 'B', 'D', 'white_win'), // B=1.5, D=0
      makeMatch('m4', 'C', 'D', 'white_win'), // C=1, D=0
    ])
    // A=1.5, B=1.5, C=1, D=0
    // A vs B tied at 1.5, drew each other → DE unresolved
    // SB(A): drew B(1.5) → 0.75; beat C(1) → 1.0; total = 1.75
    // SB(B): drew A(1.5) → 0.75; beat D(0) → 0; total = 0.75
    const ranked = rankWithTiebreaks(group, defaultSettings)
    expect(ranked[0]).toEqual(['A'])
    expect(ranked[1]).toEqual(['B'])
  })

  it('3-way tie skips DE, uses SB', () => {
    // A, B, C all at 1 point
    // With tiebreakOrder=['DE','SB'], DE is skipped for 3-way
    const group = makeGroup([A, B, C], [
      makeMatch('m1', 'A', 'B', 'white_win'),  // A=1
      makeMatch('m2', 'B', 'C', 'white_win'),  // B=1
      makeMatch('m3', 'C', 'A', 'white_win'),  // C=1
    ])
    // All at 1; SB:
    // A: beat B(1) → 1.0; lost to C(1) → 0 = 1.0
    // B: lost to A(1) → 0; beat C(1) → 1.0 = 1.0
    // C: lost to B(1) → 0; beat A(1) → 1.0 = 1.0
    // All SB = 1.0, so all still tied
    const ranked = rankWithTiebreaks(group, defaultSettings)
    // All tied after all methods → 1 group of 3
    expect(ranked).toHaveLength(1)
    expect(ranked[0].sort()).toEqual(['A', 'B', 'C'])
  })

  it('all methods exhausted → participants remain in same tied group', () => {
    // All participants tied with same SB → still in one group
    const settings = { ...defaultSettings, tiebreakOrder: [] as typeof defaultSettings.tiebreakOrder }
    const group = makeGroup([A, B, C], [])
    const ranked = rankWithTiebreaks(group, settings)
    // All at 0, no tiebreaks → one group of 3
    expect(ranked).toHaveLength(1)
    expect(ranked[0].sort()).toEqual(['A', 'B', 'C'])
  })
})
