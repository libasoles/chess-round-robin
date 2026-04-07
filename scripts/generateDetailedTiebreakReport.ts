import { buildGroupSizes } from '../src/domain/groupSizes'
import { generateRoundRobinPairings } from '../src/domain/roundRobin'
import { computeRankedStandings, applyDirectEncounter, computeSonnebornBerger, computePartidasGanadasConNegras, computeBuchholz } from '../src/domain/tiebreaks'
import type { Group, Participant, TournamentSettings, Match } from '../src/domain/types'

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
    tiebreakOrder: ['DE', 'SB', 'Buchholz', 'Koya', 'PN'],
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
        // 60% decisive
        const whiteId = parseInt(match.white.replace('P', ''))
        const blackId = parseInt(match.black.replace('P', ''))
        // Lower ID = stronger
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

interface DetailedReport {
  numParticipants: number
  useGroups: boolean
  groupConfig: string
  groups: {
    name: string
    matches: Array<{
      round: number
      white: string
      black: string
      result: string
    }>
    standings: Array<{
      rank: number
      name: string
      points: number
      de: string | null
      sb: number
      buchholz: number
      pn: number
      tiebreakUsed: string | null
      tiedWith: string[]
    }>
    unresolvedTies: Array<{
      names: string[]
    }>
  }[]
}

function generateDetailedReport(): DetailedReport[] {
  const results: DetailedReport[] = []
  let seed = 42

  // Test cases: 3-12 participants, with and without groups
  for (const numParticipants of [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    for (const useGroups of [false, true]) {
      const { groups, settings } = generateTestTournament(numParticipants, useGroups, seed++)

      const groupSizes = buildGroupSizes(numParticipants, useGroups)
      const groupConfig = useGroups ? `${groupSizes.join('+')}` : 'Sin grupos'

      const reportGroups = groups.map((group) => {
        const nameMap = new Map(group.participants.map((p) => [p.id, p.name]))

        // Match display (includes auto_bye to show complete picture)
        const matchDisplay = group.matches
          .filter((m) => m.result !== null)
          .sort((a, b) => a.round - b.round)
          .map((m) => ({
            round: m.round,
            white: nameMap.get(m.white) ?? m.white,
            black: nameMap.get(m.black) ?? m.black,
            result: getResultDisplay(m.result as string),
          }))

        const standings = computeRankedStandings(group, settings)

        // Detect unresolved ties
        const rankGroups = new Map<number, typeof standings>()
        for (const entry of standings) {
          const g = rankGroups.get(entry.rank) ?? []
          g.push(entry)
          rankGroups.set(entry.rank, g)
        }
        const unresolvedTies = [...rankGroups.values()]
          .filter((g) => g.length > 1)
          .map((entries) => ({
            names: entries.map((e) => nameMap.get(e.participantId) ?? e.participantId),
          }))

        // Compute tiebreak scores for display
        const reportStandings = standings.map((entry) => {
          const coTiedIds = standings
            .filter((e) => e.rank === entry.rank && e.participantId !== entry.participantId)
            .map((e) => e.participantId)

          const sb = computeSonnebornBerger(entry.participantId, group, settings)
          const buchholz = computeBuchholz(entry.participantId, group, settings)
          const pn = computePartidasGanadasConNegras(entry.participantId, group)

          // Check if DE resolves this pair/group
          const tiedIds = [entry.participantId, ...coTiedIds]
          let deResult: string | null = null
          if (tiedIds.length > 1) {
            const deApplied = applyDirectEncounter(tiedIds, group)
            if (deApplied) {
              // Find which group this participant is in
              const myGroup = deApplied.find((g) => g.includes(entry.participantId))
              const myRank = deApplied.findIndex((g) => g.includes(entry.participantId))
              deResult = myGroup && myRank !== -1 ? `Grupo ${myRank + 1}` : 'Empate'
            } else {
              deResult = 'Sin resolver'
            }
          }

          return {
            rank: entry.rank,
            name: nameMap.get(entry.participantId) ?? entry.participantId,
            points: entry.points,
            de: deResult,
            sb,
            buchholz,
            pn,
            tiebreakUsed: entry.tiebreakUsed ?? null,
            tiedWith: coTiedIds.map((id) => nameMap.get(id) ?? id),
          }
        })

        return {
          name: group.name,
          matches: matchDisplay,
          standings: reportStandings,
          unresolvedTies,
        }
      })

      results.push({
        numParticipants,
        useGroups,
        groupConfig,
        groups: reportGroups,
      })
    }
  }

  return results
}

function getResultDisplay(result: string): string {
  const map: Record<string, string> = {
    white_win: '1-0',
    black_win: '0-1',
    draw: '½-½',
    auto_bye: 'Libre',
  }
  return map[result] || result
}

// Generate and output
const results = generateDetailedReport()
console.log(JSON.stringify(results, null, 2))
