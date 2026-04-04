import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { NotFoundPage } from '@/pages/NotFoundPage'

const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const NewTournamentPage = lazy(() => import('@/pages/NewTournamentPage').then(m => ({ default: m.NewTournamentPage })))
const RoundPage = lazy(() => import('@/pages/RoundPage').then(m => ({ default: m.RoundPage })))
const StandingsPage = lazy(() => import('@/pages/StandingsPage').then(m => ({ default: m.StandingsPage })))
const TournamentResultsPage = lazy(() => import('@/pages/TournamentResultsPage').then(m => ({ default: m.TournamentResultsPage })))
const SharedRoundPage = lazy(() => import('@/pages/SharedRoundPage').then(m => ({ default: m.SharedRoundPage })))
const SharedStandingsPage = lazy(() => import('@/pages/SharedStandingsPage').then(m => ({ default: m.SharedStandingsPage })))

const pagesSuspense = (element: React.ReactElement) => (
  <Suspense fallback={null}>
    {element}
  </Suspense>
)

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: pagesSuspense(<HomePage />) },
      { path: '/settings', element: pagesSuspense(<SettingsPage />) },
      { path: '/tournament/new', element: pagesSuspense(<NewTournamentPage />) },
      { path: '/tournament/:id/round/:round', element: pagesSuspense(<RoundPage />) },
      { path: '/tournament/:id/standings', element: pagesSuspense(<StandingsPage />) },
      { path: '/tournament/history/:id', element: pagesSuspense(<TournamentResultsPage />) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/t/:jazzId/round/:round', element: pagesSuspense(<SharedRoundPage />) },
  { path: '/t/:jazzId/standings', element: pagesSuspense(<SharedStandingsPage />) },
])
