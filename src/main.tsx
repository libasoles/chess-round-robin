import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { JazzReactProvider, useJazzContextValue } from 'jazz-tools/react'
import { Account } from 'jazz-tools'
import { HelmetProvider } from 'react-helmet-async'
import ReactGA from 'react-ga4'
import { router } from './router'
import { useSettingsStore } from './store/settingsStore'
import { useHistoryStore } from './store/historyStore'
import { setJazzMe } from './lib/jazzAgent'
import { createJazzTournament } from './lib/jazzSync'
import { useTournamentStore } from './store/tournamentStore'
import './index.css'

ReactGA.initialize('G-395HD9FM5T')

const JAZZ_PEER = `wss://cloud.jazz.tools/?key=${import.meta.env.VITE_JAZZ_API_KEY}` as const

function hideStartupSplash() {
  const splash = document.getElementById('pwa-splash')
  if (!splash) return

  splash.setAttribute('data-state', 'hidden')
  window.setTimeout(() => splash.remove(), 260)
}

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

export function Root() {
  const theme = useSettingsStore((s) => s.theme)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)

  useEffect(() => {
    hideStartupSplash()
  }, [])

  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  return (
    <>
      <JazzInit />
      <RouterProvider router={router} />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <JazzReactProvider AccountSchema={Account} sync={{ peer: JAZZ_PEER, when: 'always' }}>
        <Root />
      </JazzReactProvider>
    </HelmetProvider>
  </StrictMode>,
)
