import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { HomePage } from '@/pages/HomePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NewTournamentPage } from '@/pages/NewTournamentPage'
import { RoundPage } from '@/pages/RoundPage'
import { StandingsPage } from '@/pages/StandingsPage'
import { TournamentResultsPage } from '@/pages/TournamentResultsPage'
import { SharedRoundPage } from '@/pages/SharedRoundPage'
import { SharedStandingsPage } from '@/pages/SharedStandingsPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/tournament/new', element: <NewTournamentPage /> },
      { path: '/tournament/:id/round/:round', element: <RoundPage /> },
      { path: '/tournament/:id/standings', element: <StandingsPage /> },
      { path: '/tournament/history/:id', element: <TournamentResultsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/t/:jazzId/round/:round', element: <SharedRoundPage /> },
  { path: '/t/:jazzId/standings', element: <SharedStandingsPage /> },
])
