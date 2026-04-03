import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Group, Match, MatchResult, Phase, Tournament, TournamentSettings } from '@/domain/types'
import { buildGroupSizes } from '@/domain/groupSizes'
import { normalizeName, assignParticipantsToGroups, GROUP_NAMES, BYE_PARTICIPANT } from '@/domain/participants'
import { generateRoundRobinPairings } from '@/domain/roundRobin'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Returns the global max round number across all groups in all phases */
function maxRoundAcrossPhases(tournament: Tournament): number {
  let max = 0
  for (const phase of tournament.phases) {
    for (const group of phase.groups) {
      for (const match of group.matches) {
        if (match.round > max) max = match.round
      }
    }
  }
  return max
}

function updateMatchInTournament(
  tournament: Tournament,
  matchId: string,
  result: MatchResult | null,
): Tournament {
  return {
    ...tournament,
    phases: tournament.phases.map((phase): Phase => ({
      ...phase,
      groups: phase.groups.map((group): Group => ({
        ...group,
        matches: group.matches.map((match): Match =>
          match.id === matchId ? { ...match, result } : match,
        ),
      })),
    })),
  }
}

/**
 * Like assignParticipantsToGroups but uses a custom names list
 * (for new phases where group names must continue from previous phases).
 */
function assignWithNames(
  participants: { id: string; name: string; isBye: boolean }[],
  sizes: number[],
  groupNames: readonly string[],
): Group[] {
  const groups: Group[] = []
  let offset = 0

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i]
    const name = groupNames[i] ?? `GROUP_${i + 1}`
    const slice = participants.slice(offset, offset + size)
    offset += size
    const groupParticipants = slice.length < size ? [...slice, BYE_PARTICIPANT] : [...slice]
    groups.push({ name, participants: groupParticipants, matches: [] })
  }

  return groups
}

interface TournamentState {
  activeTournament: Tournament | null
  currentRound: number // 1-based global round number
  draftParticipants: string[] // ephemeral, NOT persisted

  createTournament: (names: string[], settings: TournamentSettings) => void
  abandonTournament: () => void
  recordResult: (matchId: string, result: MatchResult) => void
  clearResult: (matchId: string) => void
  setCurrentRound: (round: number) => void
  createNewPhase: (selectedParticipantIds: string[]) => void
  finishTournament: (onFinish: (t: Tournament) => void) => void

  setDraftParticipants: (names: string[]) => void
  updateDraftParticipant: (index: number, name: string) => void
  addDraftParticipant: () => void
  removeDraftParticipant: (index: number) => void
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      activeTournament: null,
      currentRound: 1,
      draftParticipants: ['', '', '', ''],

      createTournament: (names, settings) => {
        const cleanNames = names.map(normalizeName).filter((n) => n.length > 0)
        const participants = cleanNames.map((name) => ({
          id: generateId(),
          name,
          isBye: false,
        }))
        const sizes = buildGroupSizes(cleanNames.length, settings.useGroups)
        const rawGroups: Group[] = assignParticipantsToGroups(participants, sizes)
        const groups: Group[] = rawGroups.map((g): Group => ({
          ...g,
          matches: generateRoundRobinPairings(g),
        }))

        const tournament: Tournament = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          settings,
          phases: [{ index: 0, groups }],
          status: 'active',
        }

        set({ activeTournament: tournament, currentRound: 1 })
      },

      abandonTournament: () => set({ activeTournament: null, currentRound: 1 }),

      recordResult: (matchId, result) =>
        set((s) => {
          if (!s.activeTournament) return s
          return { activeTournament: updateMatchInTournament(s.activeTournament, matchId, result) }
        }),

      clearResult: (matchId) =>
        set((s) => {
          if (!s.activeTournament) return s
          return { activeTournament: updateMatchInTournament(s.activeTournament, matchId, null) }
        }),

      setCurrentRound: (round) => set({ currentRound: round }),

      createNewPhase: (selectedParticipantIds) => {
        const { activeTournament } = get()
        if (!activeTournament) return

        const lastRound = maxRoundAcrossPhases(activeTournament)

        // Collect unique selected participants preserving their last-seen group
        const participantToGroup = new Map<string, string>()
        for (const phase of activeTournament.phases) {
          for (const group of phase.groups) {
            for (const p of group.participants) {
              if (!p.isBye) participantToGroup.set(p.id, group.name)
            }
          }
        }

        // Gather selected participants (unique, in their last group order)
        const seen = new Set<string>()
        const selected: { id: string; name: string; isBye: boolean }[] = []
        for (const phase of activeTournament.phases) {
          for (const group of phase.groups) {
            for (const p of group.participants) {
              if (!p.isBye && selectedParticipantIds.includes(p.id) && !seen.has(p.id)) {
                seen.add(p.id)
                selected.push(p)
              }
            }
          }
        }

        // Interleave participants from different groups to minimise same-group repeats
        const byGroup = new Map<string, typeof selected>()
        for (const p of selected) {
          const groupName = participantToGroup.get(p.id) ?? ''
          const bucket = byGroup.get(groupName) ?? []
          bucket.push(p)
          byGroup.set(groupName, bucket)
        }
        const buckets = [...byGroup.values()]
        const maxLen = Math.max(...buckets.map((b) => b.length))
        const interleaved: typeof selected = []
        for (let i = 0; i < maxLen; i++) {
          for (const bucket of buckets) {
            if (i < bucket.length) interleaved.push(bucket[i])
          }
        }

        // Continue group naming from first unused GROUP_NAME
        const usedNames = activeTournament.phases.flatMap((p) => p.groups.map((g) => g.name))
        const firstUnusedIdx = GROUP_NAMES.findIndex((n) => !usedNames.includes(n))
        const availableNames = GROUP_NAMES.slice(firstUnusedIdx >= 0 ? firstUnusedIdx : 0)

        const sizes = buildGroupSizes(interleaved.length, activeTournament.settings.useGroups)
        const rawGroups = assignWithNames(interleaved, sizes, availableNames)
        const groups: Group[] = rawGroups.map((g): Group => {
          const matches = generateRoundRobinPairings(g)
          const offsetMatches: Match[] = matches.map((m): Match => ({
            ...m,
            round: m.round + lastRound,
          }))
          return { ...g, matches: offsetMatches }
        })

        const newPhase: Phase = { index: activeTournament.phases.length, groups }
        const firstNewRound = lastRound + 1

        set((s) => {
          if (!s.activeTournament) return s
          return {
            activeTournament: {
              ...s.activeTournament,
              phases: [...s.activeTournament.phases, newPhase],
            },
            currentRound: firstNewRound,
          }
        })
      },

      finishTournament: (onFinish) => {
        const { activeTournament } = get()
        if (!activeTournament) return

        const finished: Tournament = {
          ...activeTournament,
          status: 'finished',
          finishedAt: new Date().toISOString(),
        }
        onFinish(finished)
        set({ activeTournament: null, currentRound: 1 })
      },

      setDraftParticipants: (names) => set({ draftParticipants: names }),

      updateDraftParticipant: (index, name) =>
        set((s) => {
          const next = [...s.draftParticipants]
          next[index] = name
          return { draftParticipants: next }
        }),

      addDraftParticipant: () =>
        set((s) => ({ draftParticipants: [...s.draftParticipants, ''] })),

      removeDraftParticipant: (index) =>
        set((s) => ({
          draftParticipants: s.draftParticipants.filter((_, i) => i !== index),
        })),
    }),
    {
      name: 'chess-active-tournament',
      version: 1,
      partialize: (s) => ({
        activeTournament: s.activeTournament,
        currentRound: s.currentRound,
      }),
    },
  ),
)
