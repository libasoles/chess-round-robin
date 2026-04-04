import { describe, it, expect } from 'vitest'
import { computeStandings } from '../standings'
import type { Group, Match, Participant, TournamentSettings } from '../types'

const defaultSettings: TournamentSettings = {
  arbitratorName: 'Test',
  forfeitPoints: 0,
  byePoints: 1,
  tiebreakOrder: ['DE', 'SB'],
  useGroups: true,
  groupSize: 4,
}

const BYE: Participant = { id: 'bye', name: 'Libre', isBye: true }

function makeParticipant(id: string): Participant {
  return { id, name: id, isBye: false }
}

function makeMatch(id: string, white: string, black: string, result: Match['result'], round = 1): Match {
  return { id, white, black, round, result }
}

function makeGroup(participants: Participant[], matches: Match[]): Group {
  return { name: 'ALFA', participants, matches }
}

describe('computeStandings', () => {
  const A = makeParticipant('A')
  const B = makeParticipant('B')
  const C = makeParticipant('C')
  const D = makeParticipant('D')

  it('empty matches → all participants at 0 points', () => {
    const group = makeGroup([A, B, C], [])
    const standings = computeStandings(group, defaultSettings)
    expect(standings).toHaveLength(3)
    standings.forEach(e => expect(e.points).toBe(0))
  })

  it('excludes Bye participant from results', () => {
    const group = makeGroup([A, B, BYE], [])
    const standings = computeStandings(group, defaultSettings)
    expect(standings.map(e => e.participantId)).not.toContain('bye')
    expect(standings).toHaveLength(2)
  })

  it('white_win gives 1 to white, 0 to black', () => {
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'white_win'),
    ])
    const standings = computeStandings(group, defaultSettings)
    const aEntry = standings.find(e => e.participantId === 'A')!
    const bEntry = standings.find(e => e.participantId === 'B')!
    expect(aEntry.points).toBe(1)
    expect(bEntry.points).toBe(0)
  })

  it('draw gives 0.5 to both sides', () => {
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'draw'),
    ])
    const standings = computeStandings(group, defaultSettings)
    const aEntry = standings.find(e => e.participantId === 'A')!
    const bEntry = standings.find(e => e.participantId === 'B')!
    expect(aEntry.points).toBe(0.5)
    expect(bEntry.points).toBe(0.5)
  })

  it('null result contributes 0 points', () => {
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', null),
    ])
    const standings = computeStandings(group, defaultSettings)
    standings.forEach(e => expect(e.points).toBe(0))
  })

  it('forfeit_white with forfeitPoints=0.5 gives 0 to white, 0.5 to black', () => {
    const settings = { ...defaultSettings, forfeitPoints: 0.5 as const }
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'forfeit_white'),
    ])
    const standings = computeStandings(group, settings)
    const aEntry = standings.find(e => e.participantId === 'A')!
    const bEntry = standings.find(e => e.participantId === 'B')!
    expect(aEntry.points).toBe(0)
    expect(bEntry.points).toBe(0.5)
  })

  it('auto_bye with byePoints=1: real player gets 1, Bye not in standings', () => {
    const group = makeGroup([A, B, C, BYE], [
      makeMatch('m1', 'A', 'bye', 'auto_bye'),
    ])
    const standings = computeStandings(group, defaultSettings)
    const aEntry = standings.find(e => e.participantId === 'A')!
    expect(aEntry.points).toBe(1)
    expect(standings.find(e => e.participantId === 'bye')).toBeUndefined()
  })

  it('auto_bye with byePoints=0.5: real player gets 0.5', () => {
    const settings = { ...defaultSettings, byePoints: 0.5 as const }
    const group = makeGroup([A, B, C, BYE], [
      makeMatch('m1', 'A', 'bye', 'auto_bye'),
    ])
    const standings = computeStandings(group, settings)
    const aEntry = standings.find(e => e.participantId === 'A')!
    expect(aEntry.points).toBe(0.5)
  })

  it('accumulates multiple matches correctly', () => {
    // A beats B (1), A draws C (0.5), A loses to D (0) → A has 1.5
    // B loses A (0), B beats C (1), B loses D (0) → B has 1
    // C draws A (0.5), C loses B (0), C draws D (0.5) → C has 1
    // D beats A (1), D beats B (1), D draws C (0.5) → D has 2.5
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'white_win'),
      makeMatch('m2', 'A', 'C', 'draw'),
      makeMatch('m3', 'D', 'A', 'white_win'),  // D beats A
      makeMatch('m4', 'B', 'C', 'white_win'),
      makeMatch('m5', 'D', 'B', 'white_win'),  // D beats B
      makeMatch('m6', 'C', 'D', 'draw'),
    ])
    const standings = computeStandings(group, defaultSettings)
    const get = (id: string) => standings.find(e => e.participantId === id)!.points

    expect(get('D')).toBe(2.5)
    expect(get('A')).toBe(1.5)
    expect(get('B')).toBe(1)
    expect(get('C')).toBe(1)
  })

  it('returns results sorted descending by points', () => {
    const group = makeGroup([A, B, C, D], [
      makeMatch('m1', 'A', 'B', 'white_win'),
      makeMatch('m2', 'A', 'C', 'white_win'),
      makeMatch('m3', 'A', 'D', 'white_win'),
    ])
    const standings = computeStandings(group, defaultSettings)
    for (let i = 0; i < standings.length - 1; i++) {
      expect(standings[i].points).toBeGreaterThanOrEqual(standings[i + 1].points)
    }
  })

  it('recalculates correctly when forfeitPoints changes', () => {
    const matches = [makeMatch('m1', 'A', 'B', 'forfeit_white')]
    const group = makeGroup([A, B, C, D], matches)

    const s0 = computeStandings(group, { ...defaultSettings, forfeitPoints: 0 })
    const s1 = computeStandings(group, { ...defaultSettings, forfeitPoints: 1 as const })

    expect(s0.find(e => e.participantId === 'B')!.points).toBe(0)
    expect(s1.find(e => e.participantId === 'B')!.points).toBe(1)
  })
})
