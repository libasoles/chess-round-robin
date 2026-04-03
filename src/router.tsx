import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NewTournamentPage } from '@/pages/NewTournamentPage'
import { RoundPage } from '@/pages/RoundPage'
import { StandingsPage } from '@/pages/StandingsPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/tournament/new', element: <NewTournamentPage /> },
  { path: '/tournament/round/:round', element: <RoundPage /> },
  { path: '/tournament/standings', element: <StandingsPage /> },
])
