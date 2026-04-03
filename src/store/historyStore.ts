import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Tournament } from '@/domain/types'

interface HistoryState {
  tournaments: Tournament[]
  addToHistory: (tournament: Tournament) => void
  clearHistory: () => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      tournaments: [],

      addToHistory: (tournament) =>
        set((s) => ({ tournaments: [tournament, ...s.tournaments] })),

      clearHistory: () => set({ tournaments: [] }),
    }),
    {
      name: 'chess-history',
      version: 1,
    },
  ),
)
