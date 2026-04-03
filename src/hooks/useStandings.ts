import { computeRankedStandings } from '@/domain/tiebreaks'
import type { Group, StandingEntry, TournamentSettings } from '@/domain/types'

/** Returns ranked standings for a single group, including tiebreak metadata. */
export function useGroupStandings(
  group: Group,
  settings: TournamentSettings,
): StandingEntry[] {
  return computeRankedStandings(group, settings)
}
