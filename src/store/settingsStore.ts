import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TournamentSettings } from '@/domain/types'

export type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  arbitratorName: string | null
  organizerName: string | null
  lastTournamentSettings: TournamentSettings
  participantsPool: string[]
  theme: Theme
  ownedTournamentIds: string[]
  setArbitratorName: (name: string) => void
  setOrganizerName: (name: string) => void
  setLastTournamentSettings: (settings: TournamentSettings) => void
  setTheme: (theme: Theme) => void
  addToParticipantsPool: (names: string[]) => void
  removeFromParticipantsPool: (name: string) => void
  addOwnedTournamentId: (id: string) => void
}

const DEFAULT_TOURNAMENT_SETTINGS: TournamentSettings = {
  arbitratorName: '',
  organizerName: '',
  forfeitPoints: 1,
  byePoints: 1,
  tiebreakOrder: ['DE', 'SB'],
  useGroups: true,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      arbitratorName: null,
      organizerName: null,
      lastTournamentSettings: DEFAULT_TOURNAMENT_SETTINGS,
      participantsPool: [],
      theme: 'system',
      ownedTournamentIds: [],

      setArbitratorName: (name) =>
        set((s) => ({
          arbitratorName: name || null,
          lastTournamentSettings: {
            ...s.lastTournamentSettings,
            arbitratorName: name,
          },
        })),

      setOrganizerName: (name) =>
        set((s) => ({
          organizerName: name || null,
          lastTournamentSettings: {
            ...s.lastTournamentSettings,
            organizerName: name,
          },
        })),

      setLastTournamentSettings: (settings) =>
        set({ lastTournamentSettings: settings }),

      setTheme: (theme) => set({ theme }),

      addToParticipantsPool: (names) =>
        set((s) => {
          const existing = new Set(s.participantsPool.map((n) => n.toLowerCase()))
          const newNames = names.filter(
            (n) => n.trim() && n.toLowerCase() !== 'libre' && !existing.has(n.toLowerCase()),
          )
          return { participantsPool: [...s.participantsPool, ...newNames] }
        }),

      removeFromParticipantsPool: (name) =>
        set((s) => ({
          participantsPool: s.participantsPool.filter((n) => n !== name),
        })),

      addOwnedTournamentId: (id) =>
        set((s) => ({
          ownedTournamentIds: s.ownedTournamentIds.includes(id)
            ? s.ownedTournamentIds
            : [...s.ownedTournamentIds, id],
        })),
    }),
    {
      name: 'chess-settings',
      version: 2,
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as Partial<SettingsState>
        return {
          ...state,
          organizerName: state.organizerName ?? null,
          lastTournamentSettings: {
            ...DEFAULT_TOURNAMENT_SETTINGS,
            ...(state.lastTournamentSettings ?? {}),
            organizerName: state.lastTournamentSettings?.organizerName ?? '',
          },
          ownedTournamentIds: (state as Partial<SettingsState>).ownedTournamentIds ?? [],
        }
      },
    },
  ),
)
