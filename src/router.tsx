import { lazy, Suspense } from 'react'
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { NewTournamentPage } from "@/pages/NewTournamentPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RoundPage } from "@/pages/RoundPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { StandingsPage } from "@/pages/StandingsPage";
import { GuidesIndexPage } from "@/pages/guides/GuidesIndexPage";
import { ThemePage } from "@/pages/ThemePage";
import { TiebreakGuidePage } from "@/pages/guides/TiebreakGuidePage";
import { TournamentConfigPage } from "@/pages/TournamentConfigPage";
import { TournamentResultsPage } from "@/pages/TournamentResultsPage";
import { TutorialPage } from "@/pages/guides/TutorialPage";
import { createBrowserRouter } from "react-router-dom";

const JazzLayout = lazy(() => import('@/components/jazz/JazzLayout'))
const SharedRoundPage = lazy(() =>
  import('@/pages/SharedRoundPage').then(m => ({ default: m.SharedRoundPage }))
)
const SharedStandingsPage = lazy(() =>
  import('@/pages/SharedStandingsPage').then(m => ({ default: m.SharedStandingsPage }))
)

function JazzSuspense() {
  return (
    <Suspense fallback={null}>
      <JazzLayout />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/tournament/new", element: <NewTournamentPage /> },
      { path: "/tournament/new/settings", element: <TournamentConfigPage /> },
      {
        element: <JazzSuspense />,
        children: [
          { path: "/tournament/:id/round/:round", element: <RoundPage /> },
          { path: "/tournament/:id/standings", element: <StandingsPage /> },
          { path: "/tournament/:id/settings", element: <TournamentConfigPage /> },
          { path: "/tournament/history/:id", element: <TournamentResultsPage /> },
          { path: "/tournament/history/:id/settings", element: <TournamentConfigPage /> },
        ],
      },
      { path: "/guias", element: <GuidesIndexPage /> },
      { path: "/tutorial", element: <TutorialPage /> },
      { path: "/guia-desempates", element: <TiebreakGuidePage /> },
      { path: "/theme", element: <ThemePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    element: <JazzSuspense />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: "/t/:jazzId/round/:round", element: <SharedRoundPage /> },
      { path: "/t/:jazzId/standings", element: <SharedStandingsPage /> },
    ],
  },
]);
