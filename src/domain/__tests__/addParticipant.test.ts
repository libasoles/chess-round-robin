import { describe, it, expect } from 'vitest'
import { addParticipantToActiveTournament, findTargetGroup } from '../addParticipant'
import { generateRoundRobinPairings } from '../roundRobin'
import { assignParticipantsToGroups, BYE_PARTICIPANT } from '../participants'
import { buildGroupSizes } from '../groupSizes'
import type { Group, Participant, Tournament, TournamentSettings } from '../types'

const baseSettings: TournamentSettings = {
  arbitratorName: 'Arb',
  forfeitPoints: 0,
  byePoints: 1,
  tiebreakOrder: ['DE', 'SB', 'Buchholz'],
  useGroups: false,
  groupSize: 4,
}

function makeTournament(names: string[], settingsOverride?: Partial<TournamentSettings>): Tournament {
  const settings: TournamentSettings = { ...baseSettings, ...settingsOverride }
  const participants: Participant[] = names.map((n, i) => ({
    id: `p${i}-${n}`,
    name: n,
    isBye: false,
  }))
  const sizes = buildGroupSizes(names.length, settings.useGroups, settings.groupSize)
  const rawGroups = assignParticipantsToGroups(participants, sizes)
  const groups: Group[] = rawGroups.map((g) => ({ ...g, matches: generateRoundRobinPairings(g) }))
  return {
    id: 't1',
    createdAt: '2025-01-01T00:00:00Z',
    settings,
    phases: [{ index: 0, groups }],
    status: 'active',
  }
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

function realParticipants(g: Group): Participant[] {
  return g.participants.filter((p) => !p.isBye)
}

function expectValidRoundRobin(group: Group, expectedRealCount: number) {
  const N = expectedRealCount % 2 === 0 ? expectedRealCount : expectedRealCount + 1
  const expectedRounds = N - 1
  const expectedMatchesPerRound = N / 2

  const rounds = new Set(group.matches.map((m) => m.round))
  expect(rounds.size).toBe(expectedRounds)

  for (let r = 1; r <= expectedRounds; r++) {
    const ms = group.matches.filter((m) => m.round === r)
    expect(ms).toHaveLength(expectedMatchesPerRound)
    // Each participant appears exactly once per round
    const ids = new Set<string>()
    for (const m of ms) {
      expect(ids.has(m.white)).toBe(false)
      expect(ids.has(m.black)).toBe(false)
      ids.add(m.white)
      ids.add(m.black)
    }
    expect(ids.size).toBe(N)
  }

  // Every pair of distinct participants plays exactly once
  const pairs = new Set<string>()
  for (const m of group.matches) {
    const k = pairKey(m.white, m.black)
    expect(pairs.has(k)).toBe(false)
    pairs.add(k)
  }
  expect(pairs.size).toBe((N * (N - 1)) / 2)
}

describe('findTargetGroup', () => {
  it('returns the only group when useGroups is false', () => {
    const t = makeTournament(['A', 'B', 'C', 'D'])
    expect(findTargetGroup(t)).toEqual({ full: false, groupName: 'ALFA' })
  })

  it('returns the first group with available capacity', () => {
    const t = makeTournament(['A', 'B', 'C', 'D', 'E', 'F'], { useGroups: true, groupSize: 4 })
    // 6 → [3,3]; both have capacity → first
    expect(findTargetGroup(t)).toEqual({ full: false, groupName: 'ALFA' })
  })

  it('returns full when every group is at capacity', () => {
    const t = makeTournament(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], {
      useGroups: true,
      groupSize: 4,
    })
    expect(findTargetGroup(t)).toEqual({ full: true })
  })
})

describe('addParticipantToActiveTournament', () => {
  it('adds a player to a 4-player single group: pairs new with the freed player', () => {
    // n=4 has no auto_bye match (even). Adding one makes n=5 → adds Bye.
    const t = makeTournament(['A', 'B', 'C', 'D'])
    const res = addParticipantToActiveTournament(t, 'Eve')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const g = res.tournament.phases[0]!.groups[0]!
    expect(realParticipants(g).map((p) => p.name)).toContain('Eve')
    expect(realParticipants(g)).toHaveLength(5)
    expect(g.participants.some((p) => p.isBye)).toBe(true)
    expectValidRoundRobin(g, 5)
    // Eve must appear in round 1
    const r1 = g.matches.filter((m) => m.round === 1)
    const eveId = realParticipants(g).find((p) => p.name === 'Eve')!.id
    expect(r1.some((m) => m.white === eveId || m.black === eveId)).toBe(true)
  })

  it('preserves existing round-1 matches (ids and results)', () => {
    const t = makeTournament(['A', 'B', 'C', 'D'])
    const r1Before = t.phases[0]!.groups[0]!.matches.filter((m) => m.round === 1)

    // Set a result on one round-1 match
    const tWithResult: Tournament = {
      ...t,
      phases: [
        {
          ...t.phases[0]!,
          groups: [
            {
              ...t.phases[0]!.groups[0]!,
              matches: t.phases[0]!.groups[0]!.matches.map((m) =>
                m.id === r1Before[0]!.id ? { ...m, result: 'white_win' as const } : m,
              ),
            },
          ],
        },
      ],
    }

    const res = addParticipantToActiveTournament(tWithResult, 'Eve')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const g = res.tournament.phases[0]!.groups[0]!
    const preservedIds = r1Before.filter((m) => m.result !== 'auto_bye').map((m) => m.id)
    for (const id of preservedIds) {
      const found = g.matches.find((m) => m.id === id)
      expect(found).toBeDefined()
      expect(found!.round).toBe(1)
    }
    // The match with the existing result is still there with that result
    const withResult = g.matches.find((m) => m.id === r1Before[0]!.id)
    expect(withResult?.result).toBe('white_win')
  })

  it('adds a player to a 3-player group (had Bye in round 1): new pair = freed vs new, no Bye left', () => {
    const t = makeTournament(['A', 'B', 'C']) // → [4] = 3 real + Bye
    // Find the freed player (the one paired with Bye in round 1)
    const r1 = t.phases[0]!.groups[0]!.matches.filter((m) => m.round === 1)
    const byeMatch = r1.find((m) => m.result === 'auto_bye')!
    const freedId =
      byeMatch.white === BYE_PARTICIPANT.id ? byeMatch.black : byeMatch.white

    const res = addParticipantToActiveTournament(t, 'Dan')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const g = res.tournament.phases[0]!.groups[0]!
    expect(realParticipants(g)).toHaveLength(4)
    expect(g.participants.some((p) => p.isBye)).toBe(false)
    expectValidRoundRobin(g, 4)
    // No auto_bye matches anywhere
    expect(g.matches.every((m) => m.result !== 'auto_bye')).toBe(true)
    // Round 1 must contain the (freed vs Dan) pair
    const danId = realParticipants(g).find((p) => p.name === 'Dan')!.id
    const r1New = g.matches.filter((m) => m.round === 1)
    const hasFreedVsDan = r1New.some(
      (m) =>
        (m.white === freedId && m.black === danId) ||
        (m.white === danId && m.black === freedId),
    )
    expect(hasFreedVsDan).toBe(true)
  })

  it('rejects when round 1 is already complete', () => {
    const t = makeTournament(['A', 'B', 'C', 'D'])
    const completed: Tournament = {
      ...t,
      phases: [
        {
          ...t.phases[0]!,
          groups: t.phases[0]!.groups.map((g) => ({
            ...g,
            matches: g.matches.map((m) =>
              m.round === 1 && m.result === null ? { ...m, result: 'draw' as const } : m,
            ),
          })),
        },
      ],
    }
    const res = addParticipantToActiveTournament(completed, 'Eve')
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.reason).toBe('round1-complete')
  })

  it('rejects duplicate names case-insensitively', () => {
    const t = makeTournament(['Ana', 'Bob', 'Cal', 'Dan'])
    const res = addParticipantToActiveTournament(t, 'ana')
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.reason).toBe('duplicate-name')
  })

  it('rejects when all groups are full', () => {
    const t = makeTournament(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], {
      useGroups: true,
      groupSize: 4,
    })
    const res = addParticipantToActiveTournament(t, 'New')
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.reason).toBe('groups-full')
  })

  it('adds to ALFA first when both groups have room (2x3 with groupSize 4)', () => {
    const t = makeTournament(['A', 'B', 'C', 'D', 'E', 'F'], {
      useGroups: true,
      groupSize: 4,
    })
    const res = addParticipantToActiveTournament(t, 'New')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const alfa = res.tournament.phases[0]!.groups[0]!
    const beta = res.tournament.phases[0]!.groups[1]!
    expect(realParticipants(alfa)).toHaveLength(4)
    expect(realParticipants(beta)).toHaveLength(3)
    expect(realParticipants(alfa).some((p) => p.name === 'New')).toBe(true)
    expectValidRoundRobin(alfa, 4)
  })
})
