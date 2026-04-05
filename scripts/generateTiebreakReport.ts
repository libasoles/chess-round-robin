import { buildGroupSizes } from '../src/domain/groupSizes'
import { generateRoundRobinPairings } from '../src/domain/roundRobin'
import { computeRankedStandings } from '../src/domain/tiebreaks'
import type { Group, Participant, Tournament, TournamentSettings, Match } from '../src/domain/types'

// Seed for reproducible random results
function seededRandom(seed: number): () => number {
  return function () {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

function generateTestTournament(
  numParticipants: number,
  useGroups: boolean,
  seed: number,
): { groups: Group[]; settings: TournamentSettings } {
  const rng = seededRandom(seed)

  const participants: Participant[] = Array.from({ length: numParticipants }, (_, i) => ({
    id: `P${i + 1}`,
    name: `Jugador ${i + 1}`,
    isBye: false,
  }))

  const settings: TournamentSettings = {
    arbitratorName: 'Test',
    organizerName: 'Test',
    forfeitPoints: 1,
    byePoints: 1,
    tiebreakOrder: ['DE', 'SB', 'PN'],
    useGroups,
    groupSize: useGroups ? 4 : numParticipants,
  }

  const groupSizes = buildGroupSizes(numParticipants, useGroups)
  const groups: Group[] = []

  let participantIdx = 0
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F']

  for (let g = 0; g < groupSizes.length; g++) {
    const size = groupSizes[g]
    const groupParticipants = participants.slice(participantIdx, participantIdx + size)
    participantIdx += size

    // Generate round-robin and simulate results with seeded randomness
    const groupStub: Group = {
      name: groupNames[g] || `Group${g + 1}`,
      participants: groupParticipants,
      matches: [],
    }
    const matches = generateRoundRobinPairings(groupStub, seed + g)

    // Simulate match results: use weighted randomness biased towards decisive results
    const simulatedMatches = matches.map((match) => {
      if (match.result === 'auto_bye') {
        return match
      }

      const rand = rng()
      let result: Match['result']

      if (rand < 0.6) {
        // 60% decisive (weighted by ELO-like strength)
        const whiteId = parseInt(match.white.replace('P', ''))
        const blackId = parseInt(match.black.replace('P', ''))
        // Lower ID = stronger → slightly biased towards white win
        const whiteWinsProb = 0.5 + (blackId - whiteId) * 0.02
        if (rng() < whiteWinsProb) {
          result = 'white_win'
        } else {
          result = 'black_win'
        }
      } else {
        // 40% draw
        result = 'draw'
      }

      return { ...match, result }
    })

    groups.push({
      name: groupNames[g] || `Group${g + 1}`,
      participants: groupParticipants,
      matches: simulatedMatches,
    })
  }

  return { groups, settings }
}

interface TournamentResult {
  numParticipants: number
  useGroups: boolean
  groupCount: number
  groupConfig: string
  groups: {
    name: string
    standings: Array<{
      rank: number
      name: string
      points: number
      tiebreakUsed: string | null
      tiebreakScores: Record<string, number>
      tiedWith: string[]
    }>
    unresolvedTies: Array<{
      names: string[]
      methods: string[]
    }>
  }[]
}

function generateReport(): TournamentResult[] {
  const results: TournamentResult[] = []
  let seed = 42

  // Test cases: 3-12 participants, with and without groups
  for (const numParticipants of [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    for (const useGroups of [false, true]) {
      const { groups, settings } = generateTestTournament(numParticipants, useGroups, seed++)

      const groupSizes = buildGroupSizes(numParticipants, useGroups)
      const groupConfig = useGroups ? `${groupSizes.join('+')}` : 'Sin grupos'

      const reportGroups = groups.map((group) => {
        const standings = computeRankedStandings(group, settings)
        const nameMap = new Map(group.participants.map((p) => [p.id, p.name]))

        // Detect unresolved ties
        const rankGroups = new Map<number, typeof standings>()
        for (const entry of standings) {
          const g = rankGroups.get(entry.rank) ?? []
          g.push(entry)
          rankGroups.set(entry.rank, g)
        }
        const unresolvedTies = [...rankGroups.values()]
          .filter((g) => g.length > 1)
          .map((entries) => {
            const names = entries.map((e) => nameMap.get(e.participantId) ?? e.participantId)
            // Simplified: just list the methods that were configured
            return {
              names,
              methods: settings.tiebreakOrder,
            }
          })

        const reportStandings = standings.map((entry) => {
          const coTiedIds = standings
            .filter((e) => e.rank === entry.rank && e.participantId !== entry.participantId)
            .map((e) => e.participantId)

          return {
            rank: entry.rank,
            name: nameMap.get(entry.participantId) ?? entry.participantId,
            points: entry.points,
            tiebreakUsed: entry.tiebreakUsed ?? null,
            tiebreakScores: entry.tiebreakScores as Record<string, number>,
            tiedWith: coTiedIds.map((id) => nameMap.get(id) ?? id),
          }
        })

        return {
          name: group.name,
          standings: reportStandings,
          unresolvedTies,
        }
      })

      results.push({
        numParticipants,
        useGroups,
        groupCount: groups.length,
        groupConfig,
        groups: reportGroups,
      })
    }
  }

  return results
}

// Generate and output
const results = generateReport()
console.log(JSON.stringify(results, null, 2))
