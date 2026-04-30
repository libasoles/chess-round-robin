import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Group,
  Match,
  MatchResult,
  Phase,
  Tournament,
  TournamentSettings,
} from "@/domain/types";
import { buildGroupSizes } from "@/domain/groupSizes";
import {
  normalizeName,
  assignParticipantsToGroups,
  GROUP_NAMES,
  BYE_PARTICIPANT,
} from "@/domain/participants";
import { generateRoundRobinPairings } from "@/domain/roundRobin";
import {
  addParticipantToActiveTournament as addParticipantPure,
  type AddParticipantResult,
} from "@/domain/addParticipant";
import { useSettingsStore } from "@/store/settingsStore";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyDraftParticipants(): string[] {
  return [""];
}

/** Returns the global max round number across all groups in all phases */
function maxRoundAcrossPhases(tournament: Tournament): number {
  let max = 0;
  for (const phase of tournament.phases) {
    for (const group of phase.groups) {
      for (const match of group.matches) {
        if (match.round > max) max = match.round;
      }
    }
  }
  return max;
}

function updateMatchInTournament(
  tournament: Tournament,
  matchId: string,
  result: MatchResult | null,
): Tournament {
  return {
    ...tournament,
    phases: tournament.phases.map(
      (phase): Phase => ({
        ...phase,
        groups: phase.groups.map(
          (group): Group => ({
            ...group,
            matches: group.matches.map(
              (match): Match =>
                match.id === matchId ? { ...match, result } : match,
            ),
          }),
        ),
      }),
    ),
  };
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
  const groups: Group[] = [];
  let offset = 0;

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const name = groupNames[i] ?? `GROUP_${i + 1}`;
    const slice = participants.slice(offset, offset + size);
    offset += size;
    const groupParticipants =
      slice.length < size ? [...slice, BYE_PARTICIPANT] : [...slice];
    groups.push({ name, participants: groupParticipants, matches: [] });
  }

  return groups;
}

interface TournamentState {
  activeTournament: Tournament | null;
  currentRound: number; // 1-based global round number
  draftParticipants: string[];

  createTournament: (names: string[], settings: TournamentSettings) => string;
  abandonTournament: () => void;
  recordResult: (matchId: string, result: MatchResult) => void;
  clearResult: (matchId: string) => void;
  setCurrentRound: (round: number) => void;
  deleteRound: (round: number) => void;
  createNewPhase: (selectedParticipantIds: string[]) => void;
  createNewPhaseWithGroups: (
    groupedParticipants: Array<Array<{ id?: string; name: string }>>,
  ) => void;
  finishTournament: (onFinish: (t: Tournament) => void) => void;
  setJazzId: (tournamentId: string, jazzId: string) => void;
  updateActiveTournamentSettings: (
    patch: Partial<Pick<TournamentSettings, "byePoints" | "tiebreakOrder">>,
  ) => void;
  addParticipantToActiveTournament: (name: string) => AddParticipantResult;

  setDraftParticipants: (names: string[]) => void;
  resetDraftParticipants: () => void;
  updateDraftParticipant: (index: number, name: string) => void;
  addDraftParticipant: () => void;
  removeDraftParticipant: (index: number) => void;
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      activeTournament: null,
      currentRound: 1,
      draftParticipants: createEmptyDraftParticipants(),

      createTournament: (names, settings) => {
        const cleanNames = names.map(normalizeName).filter((n) => n.length > 0);
        const participants = cleanNames.map((name) => ({
          id: generateId(),
          name,
          isBye: false,
        }));
        const sizes = buildGroupSizes(
          cleanNames.length,
          settings.useGroups,
          settings.groupSize,
        );
        const rawGroups: Group[] = assignParticipantsToGroups(
          participants,
          sizes,
        );
        const groups: Group[] = rawGroups.map(
          (g): Group => ({
            ...g,
            matches: generateRoundRobinPairings(g),
          }),
        );

        const tournament: Tournament = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          settings,
          phases: [{ index: 0, groups }],
          status: "active",
        };

        set({
          activeTournament: tournament,
          currentRound: 1,
          draftParticipants: createEmptyDraftParticipants(),
        });
        useSettingsStore.getState().addOwnedTournamentId(tournament.id);
        return tournament.id;
      },

      abandonTournament: () => set({ activeTournament: null, currentRound: 1 }),

      recordResult: (matchId, result) =>
        set((s) => {
          if (!s.activeTournament) return s;
          const updated = updateMatchInTournament(
            s.activeTournament,
            matchId,
            result,
          );
          if (updated.jazzId) {
            import('@/lib/jazzSync').then(({ updateJazzMatch }) =>
              updateJazzMatch(updated.jazzId!, matchId, result).catch((e) =>
                console.warn("[jazz] updateJazzMatch failed", e),
              )
            )
          }
          return { activeTournament: updated };
        }),

      clearResult: (matchId) =>
        set((s) => {
          if (!s.activeTournament) return s;
          const updated = updateMatchInTournament(
            s.activeTournament,
            matchId,
            null,
          );
          if (updated.jazzId) {
            import('@/lib/jazzSync').then(({ updateJazzMatch }) =>
              updateJazzMatch(updated.jazzId!, matchId, null).catch((e) =>
                console.warn("[jazz] updateJazzMatch failed", e),
              )
            )
          }
          return { activeTournament: updated };
        }),

      setCurrentRound: (round) => set({ currentRound: round }),

      deleteRound: (round) => {
        const s = get();
        const tournament = s.activeTournament;
        if (!tournament) return;

        const totalRounds = maxRoundAcrossPhases(tournament);
        if (totalRounds <= 1 || round < 1 || round > totalRounds) return;

        const nextPhases = tournament.phases
          .map(
            (phase): Phase => ({
              ...phase,
              groups: phase.groups
                .map(
                  (group): Group => ({
                    ...group,
                    matches: group.matches
                      .filter((m) => m.round !== round)
                      .map(
                        (m): Match =>
                          m.round > round ? { ...m, round: m.round - 1 } : m,
                      ),
                  }),
                )
                .filter((group) => group.matches.length > 0),
            }),
          )
          .filter((phase) => phase.groups.length > 0);

        const nextCurrentRound =
          s.currentRound > round
            ? s.currentRound - 1
            : s.currentRound === round
              ? Math.max(1, s.currentRound - 1)
              : s.currentRound;

        // Re-create the Jazz CoValue so visitors no longer see the deleted round
        const newJazzId = tournament.jazzId;
        set({
          activeTournament: { ...tournament, phases: nextPhases, jazzId: newJazzId },
          currentRound: nextCurrentRound,
        });
        if (tournament.jazzId) {
          import('@/lib/jazzSync').then(({ createJazzTournament }) => {
            try {
              const updatedJazzId = createJazzTournament({ ...tournament, phases: nextPhases });
              set((s) => ({
                activeTournament: s.activeTournament
                  ? { ...s.activeTournament, jazzId: updatedJazzId }
                  : s.activeTournament,
              }));
            } catch (e) {
              console.warn('[jazz] re-createJazzTournament after deleteRound failed', e);
            }
          });
        }
      },

      createNewPhase: (selectedParticipantIds) => {
        const { activeTournament } = get();
        if (!activeTournament) return;

        const lastRound = maxRoundAcrossPhases(activeTournament);

        // Collect unique selected participants preserving their last-seen group
        const participantToGroup = new Map<string, string>();
        for (const phase of activeTournament.phases) {
          for (const group of phase.groups) {
            for (const p of group.participants) {
              if (!p.isBye) participantToGroup.set(p.id, group.name);
            }
          }
        }

        // Gather selected participants (unique, in their last group order)
        const seen = new Set<string>();
        const selected: { id: string; name: string; isBye: boolean }[] = [];
        for (const phase of activeTournament.phases) {
          for (const group of phase.groups) {
            for (const p of group.participants) {
              if (
                !p.isBye &&
                selectedParticipantIds.includes(p.id) &&
                !seen.has(p.id)
              ) {
                seen.add(p.id);
                selected.push(p);
              }
            }
          }
        }

        // Interleave participants from different groups to minimise same-group repeats
        const byGroup = new Map<string, typeof selected>();
        for (const p of selected) {
          const groupName = participantToGroup.get(p.id) ?? "";
          const bucket = byGroup.get(groupName) ?? [];
          bucket.push(p);
          byGroup.set(groupName, bucket);
        }
        const buckets = [...byGroup.values()];
        const maxLen = Math.max(...buckets.map((b) => b.length));
        const interleaved: typeof selected = [];
        for (let i = 0; i < maxLen; i++) {
          for (const bucket of buckets) {
            if (i < bucket.length) interleaved.push(bucket[i]);
          }
        }

        // Continue group naming from first unused GROUP_NAME
        const usedNames = activeTournament.phases.flatMap((p) =>
          p.groups.map((g) => g.name),
        );
        const firstUnusedIdx = GROUP_NAMES.findIndex(
          (n) => !usedNames.includes(n),
        );
        const availableNames = GROUP_NAMES.slice(
          firstUnusedIdx >= 0 ? firstUnusedIdx : 0,
        );

        const sizes = buildGroupSizes(
          interleaved.length,
          activeTournament.settings.useGroups,
          activeTournament.settings.groupSize,
          2,
        );
        const rawGroups = assignWithNames(interleaved, sizes, availableNames);
        const groups: Group[] = rawGroups.map((g): Group => {
          const matches = generateRoundRobinPairings(g);
          const offsetMatches: Match[] = matches.map(
            (m): Match => ({
              ...m,
              round: m.round + lastRound,
            }),
          );
          return { ...g, matches: offsetMatches };
        });

        const newPhase: Phase = {
          index: activeTournament.phases.length,
          groups,
        };
        const firstNewRound = lastRound + 1;

        set((s) => {
          if (!s.activeTournament) return s;
          return {
            activeTournament: {
              ...s.activeTournament,
              phases: [...s.activeTournament.phases, newPhase],
            },
            currentRound: firstNewRound,
          };
        });

        if (activeTournament.jazzId) {
          import('@/lib/jazzSync').then(({ addJazzPhase }) =>
            addJazzPhase(activeTournament.jazzId!, newPhase).catch((e) =>
              console.warn("[jazz] addJazzPhase failed", e),
            )
          );
        }
      },

      createNewPhaseWithGroups: (groupedParticipants) => {
        const { activeTournament } = get();
        if (!activeTournament) return;

        const lastRound = maxRoundAcrossPhases(activeTournament);

        // Collect all non-bye participants from existing phases by id
        const participantMap = new Map<
          string,
          { id: string; name: string; isBye: boolean }
        >();
        for (const phase of activeTournament.phases) {
          for (const group of phase.groups) {
            for (const p of group.participants) {
              if (!p.isBye) participantMap.set(p.id, p);
            }
          }
        }

        // Continue group naming from first unused GROUP_NAME
        const usedNames = activeTournament.phases.flatMap((p) =>
          p.groups.map((g) => g.name),
        );
        const firstUnusedIdx = GROUP_NAMES.findIndex(
          (n) => !usedNames.includes(n),
        );
        const availableNames = GROUP_NAMES.slice(
          firstUnusedIdx >= 0 ? firstUnusedIdx : 0,
        );

        // Convert input format to Groups
        const groups: Group[] = groupedParticipants.map(
          (groupParticipants, idx) => {
            const participants = groupParticipants.map((p) => {
              if (p.id) {
                const existing = participantMap.get(p.id);
                if (existing) return existing;
              }
              // New participant
              return { id: generateId(), name: p.name, isBye: false };
            });
            const name = availableNames[idx] ?? `GROUP_${idx + 1}`;
            return { name, participants, matches: [] };
          },
        );

        // Generate pairings with round offset
        const groupsWithMatches: Group[] = groups.map((g): Group => {
          const matches = generateRoundRobinPairings(g);
          const offsetMatches: Match[] = matches.map(
            (m): Match => ({
              ...m,
              round: m.round + lastRound,
            }),
          );
          return { ...g, matches: offsetMatches };
        });

        const newPhase: Phase = {
          index: activeTournament.phases.length,
          groups: groupsWithMatches,
        };
        const firstNewRound = lastRound + 1;

        set((s) => {
          if (!s.activeTournament) return s;
          return {
            activeTournament: {
              ...s.activeTournament,
              phases: [...s.activeTournament.phases, newPhase],
            },
            currentRound: firstNewRound,
          };
        });

        if (activeTournament.jazzId) {
          import('@/lib/jazzSync').then(({ addJazzPhase }) =>
            addJazzPhase(activeTournament.jazzId!, newPhase).catch((e) =>
              console.warn("[jazz] addJazzPhase failed", e),
            )
          );
        }
      },

      finishTournament: (onFinish) => {
        const { activeTournament } = get();
        if (!activeTournament) return;

        const finished: Tournament = {
          ...activeTournament,
          status: "finished",
          finishedAt: new Date().toISOString(),
        };

        if (finished.jazzId) {
          import('@/lib/jazzSync').then(({ finishJazzTournament }) =>
            finishJazzTournament(finished.jazzId!, finished.finishedAt!).catch(
              (e) => console.warn("[jazz] finishJazzTournament failed", e),
            )
          );
        }

        onFinish(finished);
        set({ activeTournament: null, currentRound: 1 });
      },

      updateActiveTournamentSettings: (patch) => {
        const { activeTournament } = get();
        if (!activeTournament || activeTournament.status !== "active") return;

        const updated: Tournament = {
          ...activeTournament,
          settings: { ...activeTournament.settings, ...patch },
        };

        set({ activeTournament: updated });

        if (updated.jazzId) {
          import("@/lib/jazzSync").then(({ updateJazzTournamentSettings }) =>
            updateJazzTournamentSettings(updated.jazzId!, patch).catch((e) =>
              console.warn("[jazz] updateJazzTournamentSettings failed", e),
            ),
          );
        }
      },

      addParticipantToActiveTournament: (name) => {
        const { activeTournament } = get();
        if (!activeTournament || activeTournament.status !== "active") {
          return { ok: false, reason: "no-active-phase" };
        }
        const result = addParticipantPure(activeTournament, name);
        if (!result.ok) return result;
        set({ activeTournament: result.tournament });

        if (result.tournament.jazzId) {
          import("@/lib/jazzSync").then(({ replaceJazzTournamentPhases }) =>
            replaceJazzTournamentPhases(
              result.tournament.jazzId!,
              result.tournament.phases,
            ).catch((e) =>
              console.warn("[jazz] replaceJazzTournamentPhases failed", e),
            ),
          );
        }

        return result;
      },

      setJazzId: (tournamentId, jazzId) =>
        set((s) => {
          if (s.activeTournament?.id !== tournamentId) return s;
          return { activeTournament: { ...s.activeTournament, jazzId } };
        }),

      setDraftParticipants: (names) => set({ draftParticipants: names }),

      resetDraftParticipants: () =>
        set({ draftParticipants: createEmptyDraftParticipants() }),

      updateDraftParticipant: (index, name) =>
        set((s) => {
          const next = [...s.draftParticipants];
          next[index] = name;
          return { draftParticipants: next };
        }),

      addDraftParticipant: () =>
        set((s) => ({ draftParticipants: [...s.draftParticipants, ""] })),

      removeDraftParticipant: (index) =>
        set((s) => ({
          draftParticipants: s.draftParticipants.filter((_, i) => i !== index),
        })),
    }),
    {
      name: "chess-active-tournament",
      version: 1,
      partialize: (s) => ({
        activeTournament: s.activeTournament,
        currentRound: s.currentRound,
        draftParticipants: s.draftParticipants,
      }),
    },
  ),
);
