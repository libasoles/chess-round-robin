import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { NewTournamentPage } from "@/pages/NewTournamentPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RoundPage } from "@/pages/RoundPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SharedRoundPage } from "@/pages/SharedRoundPage";
import { SharedStandingsPage } from "@/pages/SharedStandingsPage";
import { StandingsPage } from "@/pages/StandingsPage";
import { TournamentResultsPage } from "@/pages/TournamentResultsPage";
import { TutorialPage } from "@/pages/TutorialPage";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/tournament/new", element: <NewTournamentPage /> },
      { path: "/tournament/:id/round/:round", element: <RoundPage /> },
      { path: "/tournament/:id/standings", element: <StandingsPage /> },
      { path: "/tournament/history/:id", element: <TournamentResultsPage /> },
      { path: "/tutorial", element: <TutorialPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  { path: "/t/:jazzId/round/:round", element: <SharedRoundPage />, errorElement: <RouteErrorPage /> },
  { path: "/t/:jazzId/standings", element: <SharedStandingsPage />, errorElement: <RouteErrorPage /> },
]);
