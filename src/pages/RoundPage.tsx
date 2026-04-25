import { AppShell } from "@/components/layout/AppShell";
import { BottomAction } from "@/components/layout/BottomAction";
import { TopBar } from "@/components/layout/TopBar";
import { TopBarShareAction } from "@/components/layout/TopBarShareAction";
import { GroupSection } from "@/components/round/GroupSection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BYE_PARTICIPANT } from "@/domain/participants";
import type { MatchResult, Participant } from "@/domain/types";
import {
  getCurrentRoundMatches,
  getTotalRounds,
  isRoundComplete,
} from "@/hooks/useCurrentRound";
import { useTournamentStore } from "@/store/tournamentStore";
import { useGesture } from "@use-gesture/react";
import { Check, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export function RoundPage() {
  const navigate = useNavigate();
  const { id, round: roundParam } = useParams<{ id: string; round: string }>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hydrated, setHydrated] = useState(() =>
    useTournamentStore.persist.hasHydrated(),
  );
  const {
    activeTournament,
    setCurrentRound,
    deleteRound,
    recordResult,
    clearResult,
  } = useTournamentStore();

  useEffect(() => {
    const unsub = useTournamentStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    // Check again after subscribing to catch hydration that completed between render and effect
    if (useTournamentStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && !activeTournament) {
      navigate("/", { replace: true });
    }
  }, [hydrated, activeTournament, navigate]);

  const currentRound = Number(roundParam) || 1;
  const totalRounds = activeTournament
    ? getTotalRounds(activeTournament.phases)
    : 1;
  const isFirstRound = currentRound === 1;
  const isLastRound = currentRound === totalRounds;
  const canDeleteRound = totalRounds > 1;

  const roundMatches = activeTournament
    ? getCurrentRoundMatches(activeTournament.phases, currentRound)
    : [];
  const title =
    activeTournament?.status === "finished"
      ? `Resultados Ronda ${currentRound}`
      : `Ronda ${currentRound}`;

  // Build participant lookup map across all phases
  const participants = new Map<string, Participant>();
  participants.set(BYE_PARTICIPANT.id, BYE_PARTICIPANT);
  if (activeTournament) {
    for (const phase of activeTournament.phases) {
      for (const group of phase.groups) {
        for (const p of group.participants) {
          participants.set(p.id, p);
        }
      }
    }
  }

  function goToRound(round: number) {
    setCurrentRound(round);
    navigate(`/tournament/${id}/round/${round}`, { replace: true });
  }

  function goNext() {
    if (!activeTournament) return;
    if (!isLastRound) goToRound(currentRound + 1);
    else navigate(`/tournament/${id}/standings`);
  }

  function goPrev() {
    if (!activeTournament) return;
    if (!isFirstRound) goToRound(currentRound - 1);
  }

  function handleResult(matchId: string, result: MatchResult | null) {
    if (result === null) {
      clearResult(matchId);
    } else {
      recordResult(matchId, result);
    }
  }

  function handleConfirmDeleteRound() {
    if (!id || !canDeleteRound) return;

    const nextRound =
      currentRound === totalRounds ? totalRounds - 1 : currentRound;
    deleteRound(currentRound);
    setCurrentRound(nextRound);
    navigate(`/tournament/${id}/round/${nextRound}`, { replace: true });
    setIsDeleteDialogOpen(false);
  }

  // Swipe gesture
  const bind = useGesture({
    onDrag: ({ swipe: [swipeX] }) => {
      if (swipeX === -1) goNext();
      else if (swipeX === 1) goPrev();
    },
  });

  if (!hydrated || !activeTournament) return null;

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <AppShell
        mainProps={bind()}
        topBar={
          <TopBar
            title={title}
            left={
              <div className="flex items-center -ml-2">
                {canDeleteRound && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Eliminar ronda"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            }
            right={
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigate(`/tournament/${id}/settings`)}
                  className="p-2 text-muted-foreground hover:text-foreground"
                  aria-label="Configuración"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <TopBarShareAction
                  jazzId={activeTournament.jazzId}
                  currentRound={currentRound}
                />
              </div>
            }
          />
        }
        hasBottomAction
      >
        <div className="space-y-2">
          {roundMatches.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No hay partidas en esta ronda.
            </p>
          ) : (
            roundMatches.map(({ groupName, matches }) => (
              <GroupSection
                key={groupName}
                groupName={groupName}
                showGroupName={activeTournament.settings.useGroups}
                matches={matches}
                participants={participants}
                onResult={handleResult}
              />
            ))
          )}
        </div>
      </AppShell>

      <BottomAction>
        <Tabs
          value={String(currentRound)}
          onValueChange={(val) => {
            if (val === "fin") {
              navigate(`/tournament/${id}/standings`);
            } else {
              goToRound(Number(val));
            }
          }}
          className="w-full"
        >
          <TabsList
            variant="line"
            className="w-full h-auto gap-1 flex-wrap justify-start"
          >
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map((r) => {
              const done = isRoundComplete(activeTournament.phases, r);
              const triggerLabel =
                totalRounds > 4 ? r : r === currentRound ? `Ronda ${r}` : r;
              const isDenseModeCurrent = totalRounds > 4 && r === currentRound;
              return (
                <TabsTrigger
                  key={r}
                  value={String(r)}
                  className={`rounded-full min-w-10 shrink-0 gap-1 ${isDenseModeCurrent ? "font-bold text-base" : ""}`}
                >
                  {triggerLabel}
                  {done && <Check className="h-3 w-3 text-primary" />}
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="fin" className="rounded-full shrink-0">
              Fin
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </BottomAction>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Eliminar ronda {currentRound}</DialogTitle>
            <DialogDescription>
              Esta acción elimina la ronda actual y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDeleteRound}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
