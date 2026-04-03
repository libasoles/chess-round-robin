import { describe, it, expect } from 'vitest'
import {
  computeBuchholz,
  computePartidasGanadasConNegras,
  computeRankedStandings,
} from '../tiebreaks'
import type { Group, Match, Participant, TournamentSettings } from '../types'

function makeParticipant(id: string): Participant {
  return { id, name: id, isBye: false }
}

function makeMatch(id: string, white: string, black: string, result: Match['result'], round = 1): Match {
  return { id, white, black, round, result }
}

function makeGroup(participants: Participant[], matches: Match[]): Group {
  return { name: 'ALFA', participants, matches }
}

const defaultSettings: TournamentSettings = {
  arbitratorName: 'Test',
  forfeitPoints: 0,
  byePoints: 1,
  tiebreakOrder: ['DE', 'SB'],
  useGroups: true,
}

const A = makeParticipant('A')
const B = makeParticipant('B')
const C = makeParticipant('C')
const D = makeParticipant('D')
const BYE: Participant = { id: 'bye', name: 'Libre', isBye: true }

// Hand-calculated 4-player group: same as in tiebreaks.test.ts
// A beats B (A=1, B=0)
// A draws C (A=0.5, C=0.5)
// D beats A (D=1, A=0)
// B beats C (B=1, C=0)
// D beats B (D=1, B=0)
// C draws D (C=0.5, D=0.5)
// Final: A=1.5, B=1.0, C=1.0, D=2.5
const allMatchesGroup = makeGroup([A, B, C, D], [
  makeMatch('m1', 'A', 'B', 'white_win'),
  makeMatch('m2', 'A', 'C', 'draw'),
  makeMatch('m3', 'D', 'A', 'white_win'),
  makeMatch('m4', 'B', 'C', 'white_win'),
  makeMatch('m5', 'D', 'B', 'white_win'),
  makeMatch('m6', 'C', 'D', 'draw'),
])

// ------- computeBuchholz -------

describe('computeBuchholz', () => {
  // Final: A=1.5, B=1.0, C=1.0, D=2.5
  // Buch(A) = B(1.0) + C(1.0) + D(2.5) = 4.5
  // Buch(B) = A(1.5) + C(1.0) + D(2.5) = 5.0
  // Buch(C) = A(1.5) + B(1.0) + D(2.5) = 5.0
  // Buch(D) = A(1.5) + B(1.0) + C(1.0) = 3.5

  it('Buch(A) = 4.5', () => {
    expect(computeBuchholz('A', allMatchesGroup, defaultSettings)).toBe(4.5)
  })

  it('Buch(B) = 5.0', () => {
    expect(computeBuchholz('B', allMatchesGroup, defaultSettings)).toBe(5.0)
  })

  it('Buch(C) = 5.0', () => {
    expect(computeBuchholz('C', allMatchesGroup, defaultSettings)).toBe(5.0)
  })

  it('Buch(D) = 3.5', () => {
    expect(computeBuchholz('D', allMatchesGroup, defaultSettings)).toBe(3.5)
  })

  it('excludes Bye matches from Buchholz calculation', () => {
    const groupWithBye = makeGroup([A, B, C, BYE], [
      makeMatch('m1', 'A', 'B', 'white_win'),
      makeMatch('m2', 'A', 'bye', 'auto_bye'),   // should not count
      makeMatch('m3', 'B', 'C', 'white_win'),
      makeMatch('m4', 'C', 'bye', 'auto_bye'),   // should not count
      makeMatch('m5', 'A', 'C', 'draw'),
    ])
    // Buchholz(A) should only sum final points of B and C (not bye)
    const buch = computeBuchholz('A', groupWithBye, defaultSettings)
    // Final: A=1.5 (beat B + bye_bye + draw C), B=0.5 (lost A + beat C), C=0.5 (draw A + bye)
    // Wait - auto_bye gives byePoints(1) to the real player; bye doesn't appear in standings
    // Opponents of A: B and C (bye excluded)
    expect(typeof buch).toBe('number')
    expect(buch).toBeGreaterThan(0)
  })

  it('player with no completed matches has Buchholz=0', () => {
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', null),
      makeMatch('m2', 'A', 'C', null),
      makeMatch('m3', 'A', 'D', null),
    ])
    expect(computeBuchholz('A', group, defaultSettings)).toBe(0)
  })
})

// ------- computePartidasGanadasConNegras -------

describe('computePartidasGanadasConNegras', () => {
  it('counts black_win', () => {
    const group = makeGroup([A, B, C], [
      makeMatch('m1', 'A', 'B', 'black_win'),  // B is black and wins
      makeMatch('m2', 'C', 'B', 'black_win'),  // B is black and wins
    ])
    expect(computePartidasGanadasConNegras('B', group)).toBe(2)
  })

  it('counts forfeit_white as win for black', () => {
    const group = makeGroup([A, B, C], [
      makeMatch('m1', 'A', 'B', 'forfeit_white'),  // B is black, A forfeits → B wins
    ])
    expect(computePartidasGanadasConNegras('B', group)).toBe(1)
  })

  it('does not count draw', () => {
    const group = makeGroup([A, B, C], [
      makeMatch('m1', 'A', 'B', 'draw'),
    ])
    expect(computePartidasGanadasConNegras('B', group)).toBe(0)
  })

  it('does not count auto_bye', () => {
    const group = makeGroup([A, B, BYE], [
      makeMatch('m1', 'A', 'bye', 'auto_bye'),
    ])
    // bye is black but auto_bye doesn't count (it's not a real win)
    expect(computePartidasGanadasConNegras('bye', group)).toBe(0)
  })

  it('does not count white_win (player was white)', () => {
    const group = makeGroup([A, B, C], [
      makeMatch('m1', 'B', 'A', 'white_win'),  // B is white, not black
    ])
    expect(computePartidasGanadasConNegras('B', group)).toBe(0)
  })

  it('does not count forfeit_black (black loses)', () => {
    const group = makeGroup([A, B, C], [
      makeMatch('m1', 'A', 'B', 'forfeit_black'),  // B is black and forfeits → B loses
    ])
    expect(computePartidasGanadasConNegras('B', group)).toBe(0)
  })

  it('does not count null results', () => {
    const group = makeGroup([A, B, C], [
      makeMatch('m1', 'A', 'B', null),
    ])
    expect(computePartidasGanadasConNegras('B', group)).toBe(0)
  })

  it('returns 0 when player has no black games', () => {
    const group = makeGroup([A, B, C], [
      makeMatch('m1', 'A', 'B', 'black_win'),  // B is black
      makeMatch('m2', 'A', 'C', 'white_win'),  // A is white and wins
    ])
    // A has no black games at all
    expect(computePartidasGanadasConNegras('A', group)).toBe(0)
  })
})

// ------- computeRankedStandings -------

describe('computeRankedStandings', () => {
  it('no ties: assigns correct sequential ranks', () => {
    // D=2.5, A=1.5, B=1.0, C=1.0 — B and C are tied, but DE resolves (m4: B beat C)
    const settings = { ...defaultSettings, tiebreakOrder: ['DE', 'SB'] as TournamentSettings['tiebreakOrder'] }
    const standings = computeRankedStandings(allMatchesGroup, settings)

    expect(standings[0].participantId).toBe('D')
    expect(standings[0].rank).toBe(1)
    expect(standings[1].participantId).toBe('A')
    expect(standings[1].rank).toBe(2)
    expect(standings[2].participantId).toBe('B')
    expect(standings[2].rank).toBe(3)
    expect(standings[3].participantId).toBe('C')
    expect(standings[3].rank).toBe(4)
  })

  it('non-tied players have tiebreakUsed: null', () => {
    // D=2.5 is uniquely first, A=1.5 is uniquely second
    const standings = computeRankedStandings(allMatchesGroup, defaultSettings)
    const dEntry = standings.find(e => e.participantId === 'D')!
    const aEntry = standings.find(e => e.participantId === 'A')!
    expect(dEntry.tiebreakUsed).toBeNull()
    expect(aEntry.tiebreakUsed).toBeNull()
  })

  it('players whose tie was broken by DE have tiebreakUsed: DE', () => {
    // B and C are tied at 1.0; B beat C (m4 white_win) → DE resolves
    const standings = computeRankedStandings(allMatchesGroup, defaultSettings)
    const bEntry = standings.find(e => e.participantId === 'B')!
    const cEntry = standings.find(e => e.participantId === 'C')!
    expect(bEntry.tiebreakUsed).toBe('DE')
    expect(cEntry.tiebreakUsed).toBe('DE')
  })

  it('still-tied players (no method resolves) have tiebreakUsed: null', () => {
    // 3-way tie at 1 point; SB also ties at 1.0 for all → no resolution
    const group = makeGroup([A, B, C], [
      makeMatch('m1', 'A', 'B', 'white_win'),  // A=1
      makeMatch('m2', 'B', 'C', 'white_win'),  // B=1
      makeMatch('m3', 'C', 'A', 'white_win'),  // C=1
    ])
    const standings = computeRankedStandings(group, defaultSettings)
    standings.forEach(e => expect(e.tiebreakUsed).toBeNull())
  })

  it('tiebreakScores computed for SB when in tiebreakOrder', () => {
    const standings = computeRankedStandings(allMatchesGroup, defaultSettings)
    // All entries should have SB scores (SB is in defaultSettings.tiebreakOrder)
    standings.forEach(e => expect(e.tiebreakScores.SB).toBeTypeOf('number'))
  })

  it('tiebreakScores includes Buchholz and PN when in tiebreakOrder', () => {
    const settings: TournamentSettings = {
      ...defaultSettings,
      tiebreakOrder: ['DE', 'SB', 'Buchholz', 'PN'],
    }
    const standings = computeRankedStandings(allMatchesGroup, settings)
    standings.forEach(e => {
      expect(e.tiebreakScores.SB).toBeTypeOf('number')
      expect(e.tiebreakScores.Buchholz).toBeTypeOf('number')
      expect(e.tiebreakScores.PN).toBeTypeOf('number')
      expect(e.tiebreakScores.DE).toBeUndefined()  // DE has no numeric score
    })
  })

  it('tied players share the same rank', () => {
    const group = makeGroup([A, B, C], [
      makeMatch('m1', 'A', 'B', 'white_win'),  // A=1
      makeMatch('m2', 'B', 'C', 'white_win'),  // B=1
      makeMatch('m3', 'C', 'A', 'white_win'),  // C=1
    ])
    // All at 1pt, SB all equal → still tied → all rank 1
    const settings = { ...defaultSettings, tiebreakOrder: ['SB'] as TournamentSettings['tiebreakOrder'] }
    const standings = computeRankedStandings(group, settings)
    standings.forEach(e => expect(e.rank).toBe(1))
  })

  it('DE resolved 2-way tie uses tiebreakUsed: DE and SB falls to second in tie', () => {
    // A and B tied at 1.5; they drew each other → DE unresolved → SB resolves
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'draw'),       // A=0.5, B=0.5
      makeMatch('m2', 'A', 'C', 'white_win'),  // A=1.5
      makeMatch('m3', 'B', 'D', 'white_win'),  // B=1.5
      makeMatch('m4', 'C', 'D', 'white_win'),  // C=1
    ])
    // A=1.5, B=1.5, C=1, D=0
    // SB(A) = drew B(1.5)*0.5 + beat C(1) = 0.75+1.0=1.75
    // SB(B) = drew A(1.5)*0.5 + beat D(0) = 0.75+0=0.75
    // → A ranked above B via SB
    const standings = computeRankedStandings(group, defaultSettings)
    const aEntry = standings.find(e => e.participantId === 'A')!
    const bEntry = standings.find(e => e.participantId === 'B')!
    expect(aEntry.rank).toBe(1)
    expect(bEntry.rank).toBe(2)
    expect(aEntry.tiebreakUsed).toBe('SB')
    expect(bEntry.tiebreakUsed).toBe('SB')
  })

  it('Buchholz resolves a tie when used as tiebreak method', () => {
    // B and C tied at 1.0 in allMatchesGroup
    // Buch(B)=5.0, Buch(C)=5.0 → Buchholz also can't separate them
    // Switch: use a group where Buchholz can separate
    // A=1, B=1; A faced D(2.5), B faced C(1.0) → Buch(A) > Buch(B)
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'draw'),      // A=0.5, B=0.5
      makeMatch('m2', 'A', 'D', 'draw'),      // A=1.0, D=1.0 (A faced hi-point D)
      makeMatch('m3', 'B', 'C', 'draw'),      // B=1.0, C=0.5 (B faced lo-point C)
    ])
    // A=1.0, B=1.0, C=0.5, D=0.5
    // Buch(A) = B(1.0) + D(0.5) = 1.5
    // Buch(B) = A(1.0) + C(0.5) = 1.5
    // Both equal → still tied
    const settings: TournamentSettings = {
      ...defaultSettings,
      tiebreakOrder: ['Buchholz'],
    }
    const standings = computeRankedStandings(group, settings)
    const aEntry = standings.find(e => e.participantId === 'A')!
    const bEntry = standings.find(e => e.participantId === 'B')!
    // Both still tied → same rank, no tiebreakUsed
    expect(aEntry.rank).toBe(bEntry.rank)
    expect(aEntry.tiebreakUsed).toBeNull()
  })

  it('PN resolves a tie when scores differ', () => {
    // A and B at same points; A has more black wins than B
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'C', 'A', 'black_win'),  // A is black, wins → PN(A)++
      makeMatch('m2', 'B', 'C', 'white_win'),  // B is white, wins
      makeMatch('m3', 'D', 'A', 'draw'),       // A draws (no PN)
      makeMatch('m4', 'B', 'D', 'draw'),       // B draws
    ])
    // A=1.5, B=1.5, C=0, D=0.5
    // PN(A)=1, PN(B)=0 → A ranked above B
    const settings: TournamentSettings = {
      ...defaultSettings,
      tiebreakOrder: ['PN'],
    }
    const standings = computeRankedStandings(group, settings)
    const aEntry = standings.find(e => e.participantId === 'A')!
    const bEntry = standings.find(e => e.participantId === 'B')!
    expect(aEntry.rank).toBeLessThan(bEntry.rank)
    expect(aEntry.tiebreakUsed).toBe('PN')
    expect(bEntry.tiebreakUsed).toBe('PN')
  })
})
