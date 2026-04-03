import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TournamentSettings } from '@/domain/types'

export type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  arbitratorName: string | null
  lastTournamentSettings: TournamentSettings
  participantsPool: string[]
  theme: Theme
  setArbitratorName: (name: string) => void
  setLastTournamentSettings: (settings: TournamentSettings) => void
  setTheme: (theme: Theme) => void
  addToParticipantsPool: (names: string[]) => void
  removeFromParticipantsPool: (name: string) => void
}

const DEFAULT_TOURNAMENT_SETTINGS: TournamentSettings = {
  arbitratorName: '',
  forfeitPoints: 1,
  byePoints: 1,
  tiebreakOrder: ['DE', 'SB'],
  useGroups: true,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      arbitratorName: null,
      lastTournamentSettings: DEFAULT_TOURNAMENT_SETTINGS,
      participantsPool: [],
      theme: 'system',

      setArbitratorName: (name) =>
        set((s) => ({
          arbitratorName: name || null,
          lastTournamentSettings: {
            ...s.lastTournamentSettings,
            arbitratorName: name,
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
    }),
    {
      name: 'chess-settings',
      version: 1,
    },
  ),
)
