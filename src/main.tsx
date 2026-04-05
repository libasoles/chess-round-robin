import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { JazzReactProvider, useJazzContextValue } from 'jazz-tools/react'
import type { Account } from 'jazz-tools'
import { router } from './router'
import { useSettingsStore } from './store/settingsStore'
import { setJazzMe } from './lib/jazzAgent'
import { createJazzTournament } from './lib/jazzSync'
import { useTournamentStore } from './store/tournamentStore'
import './index.css'

const JAZZ_PEER = `wss://cloud.jazz.tools/?key=${import.meta.env.VITE_JAZZ_API_KEY}` as const

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
  // Only re-run when account or active tournament changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, activeTournament?.id])

  return null
}

export function Root() {
  const theme = useSettingsStore((s) => s.theme)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)

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
    <JazzReactProvider sync={{ peer: JAZZ_PEER, when: 'always' }}>
      <Root />
    </JazzReactProvider>
  </StrictMode>,
)
