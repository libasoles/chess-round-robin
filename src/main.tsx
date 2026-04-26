import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ReactGA from 'react-ga4'
import { router } from './router'
import { useSettingsStore } from './store/settingsStore'
import './index.css'

const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

if (gaMeasurementId) {
  ReactGA.initialize(gaMeasurementId)
}

function hideStartupSplash() {
  const splash = document.getElementById('pwa-splash')
  if (!splash) return

  splash.setAttribute('data-state', 'hidden')
  window.setTimeout(() => splash.remove(), 260)
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

  return <RouterProvider router={router} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <Root />
    </HelmetProvider>
  </StrictMode>,
)
