import { useEffect } from 'react'
import { useJazzContextValue } from 'jazz-tools/react'
import { Account } from 'jazz-tools'
import { setJazzMe } from '@/lib/jazzAgent'
import { createJazzTournament } from '@/lib/jazzSync'
import { useTournamentStore } from '@/store/tournamentStore'
import { useHistoryStore } from '@/store/historyStore'
import { useSettingsStore } from '@/store/settingsStore'

/**
 * Bootstraps the Jazz account into the singleton and, once ready,
 * creates the Jazz tournament for any active tournament missing a jazzId.
 */
export function JazzInit() {
  const ctx = useJazzContextValue<Account>()
  const { activeTournament, setJazzId } = useTournamentStore()

  useEffect(() => {
    if (!('me' in ctx) || !ctx.me) return
    setJazzMe(ctx.me as unknown as Account)

    // If the active tournament has no jazzId yet, create it now
    if (activeTournament && !activeTournament.jazzId) {
      try {
        const jazzId = createJazzTournament(activeTournament)
        setJazzId(activeTournament.id, jazzId)
      } catch (e) {
        console.warn('[jazz] createJazzTournament failed', e)
      }
    }

    // Backfill jazzId for owned history tournaments that were finished before Jazz initialised
    const { tournaments, updateTournamentJazzId } = useHistoryStore.getState()
    const { ownedTournamentIds } = useSettingsStore.getState()
    for (const t of tournaments) {
      if (t.jazzId) continue
      if (ownedTournamentIds.length > 0 && !ownedTournamentIds.includes(t.id)) continue
      try {
        const jazzId = createJazzTournament(t)
        updateTournamentJazzId(t.id, jazzId)
      } catch (e) {
        console.warn('[jazz] createJazzTournament for history tournament failed', t.id, e)
      }
    }
  // Only re-run when account or active tournament changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, activeTournament?.id])

  return null
}
