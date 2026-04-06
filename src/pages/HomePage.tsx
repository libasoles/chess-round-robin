import { EmptyHistory } from "@/components/home/EmptyHistory";
import { InfoButton } from "@/components/home/InfoButton";
import { TournamentCard } from "@/components/home/TournamentCard";
import { AppShell } from "@/components/layout/AppShell";
import { BottomAction } from "@/components/layout/BottomAction";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { getTotalRounds, isRoundComplete } from "@/hooks/useCurrentRound";
import { useHistoryStore } from "@/store/historyStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { ArrowRight, Play, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();
  const { tournaments, removeTournament } = useHistoryStore();
  const { activeTournament, currentRound, setCurrentRound } =
    useTournamentStore();

  const totalRounds = activeTournament
    ? getTotalRounds(activeTournament.phases)
    : 0;
  const displayRound = activeTournament
    ? (Array.from({ length: totalRounds }, (_, i) => i + 1).find(
        (r) => !isRoundComplete(activeTournament.phases, r),
      ) ?? totalRounds)
    : currentRound;

  function resumeTournament() {
    if (!activeTournament) return;
    setCurrentRound(displayRound);
    navigate(`/tournament/${activeTournament.id}/round/${displayRound}`);
  }

  return (
    <>
      <AppShell
        topBar={
          <TopBar
            right={
              <div className="flex items-center gap-1 -mr-1">
                <InfoButton />
                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="md:hidden p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Configuración"
                >
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            }
          />
        }
        hasBottomAction
      >
        <div className="space-y-3">
          {activeTournament && (
            <div className="rounded-lg border border-primary bg-primary/5 px-4 py-3 space-y-2">
              <p
                className="text-sm font-semibold text-primary flex items-center gap-1.5 cursor-pointer"
                onClick={resumeTournament}
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Torneo en curso
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ronda {displayRound} de{" "}
                  {getTotalRounds(activeTournament.phases)}
                </p>
                <Button
                  onClick={resumeTournament}
                  className="w-full h-12 text-base gap-1.5 border border-primary/50 bg-primary/15 text-foreground hover:bg-primary/25"
                >
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {tournaments.length === 0 && !activeTournament ? (
            <EmptyHistory />
          ) : (
            <div className="space-y-2">
              {tournaments.map((t) => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  onDelete={removeTournament}
                  onClick={() => navigate(`/tournament/history/${t.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </AppShell>

      <BottomAction>
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full h-12 text-base"
            onClick={() => navigate("/tournament/new")}
          >
            Nuevo Torneo
          </Button>
        </div>
      </BottomAction>
    </>
  );
}
