import { AppShell } from "@/components/layout/AppShell";
import { BottomAction } from "@/components/layout/BottomAction";
import { TopBar } from "@/components/layout/TopBar";
import { GroupSection } from "@/components/round/GroupSection";
import { SharedTournamentState } from "@/components/tournament/SharedTournamentState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BYE_PARTICIPANT } from "@/domain/participants";
import type { Participant, Tournament } from "@/domain/types";
import {
  getCurrentRoundMatches,
  getTotalRounds,
  isRoundComplete,
} from "@/hooks/useCurrentRound";
import { JazzTournament } from "@/lib/jazz";
import { jazzTournamentToDomain } from "@/lib/jazzConvert";
import { useGesture } from "@use-gesture/react";
import { CoValueLoadingState } from "jazz-tools";
import { useCoState } from "jazz-tools/react";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const DEEP_RESOLVE = {
  settings: true,
  phases: {
    $each: {
      groups: {
        $each: { participants: { $each: true }, matches: { $each: true } },
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export function SharedRoundPage() {
  const navigate = useNavigate();
  const { jazzId, round: roundParam } = useParams<{
    jazzId: string;
    round: string;
  }>();
  const routeRound = Number(roundParam) || 1;

  // Use local state for the displayed round so that tab/swipe navigation is
  // instant while React Router commits the URL update synchronously.
  const [displayRound, setDisplayRound] = useState(routeRound);

  useEffect(() => {
    setDisplayRound(routeRound);
  }, [routeRound]);

  const jazzTournament = useCoState(JazzTournament, jazzId, {
    resolve: DEEP_RESOLVE,
  });

  // Keep the last valid conversion so live updates never flash to "loading/unavailable"
  // while Jazz briefly re-resolves nested CoValues after a mutation.
  const [lastValidTournament, setLastValidTournament] =
    useState<Tournament | null>(null);
  const rawTournament = jazzTournamentToDomain(jazzTournament);
  useEffect(() => {
    if (rawTournament !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Keep the last resolved tournament while Jazz briefly re-resolves nested values.
      setLastValidTournament(rawTournament);
    }
  }, [rawTournament]);
  const tournament = rawTournament ?? lastValidTournament;
  const isTournamentLoading =
    !tournament &&
    jazzTournament?.$jazz.loadingState === CoValueLoadingState.LOADING;

  useEffect(() => {
    const t = rawTournament ?? lastValidTournament;
    if (!t) return;
    const total = getTotalRounds(t.phases);
    if (total > 0 && displayRound > total) {
      goToRound(total);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawTournament, lastValidTournament, displayRound]);

  // Navigate to a round: update local state immediately and keep React Router
  // in sync so route changes can render the matching shared page.
  function goToRound(round: number) {
    setDisplayRound(round);
    navigate(`/t/${jazzId}/round/${round}`, { replace: true, flushSync: true });
  }

  function goToStandings() {
    navigate(`/t/${jazzId}/standings`, { flushSync: true });
  }

  const bind = useGesture({
    onDrag: ({ swipe: [swipeX] }) => {
      const t = rawTournament ?? lastValidTournament;
      if (!t) return;
      const total = getTotalRounds(t.phases);
      if (swipeX === -1) {
        if (displayRound < total) goToRound(displayRound + 1);
        else goToStandings();
      } else if (swipeX === 1) {
        if (displayRound > 1) goToRound(displayRound - 1);
      }
    },
  });

  if (isTournamentLoading) {
    return (
      <AppShell topBar={<TopBar title="Cargando…" />}>
        <SharedTournamentState alt="Cargando torneo">
          Cargando torneo…
        </SharedTournamentState>
      </AppShell>
    );
  }

  if (!tournament) {
    return (
      <AppShell topBar={<TopBar title="No disponible" />}>
        <SharedTournamentState alt="Torneo no disponible">
          Este torneo no está disponible o el link es incorrecto.
        </SharedTournamentState>
      </AppShell>
    );
  }

  const totalRounds = getTotalRounds(tournament.phases);
  const roundMatches = getCurrentRoundMatches(tournament.phases, displayRound);

  const participants = new Map<string, Participant>();
  participants.set(BYE_PARTICIPANT.id, BYE_PARTICIPANT);
  for (const phase of tournament.phases) {
    for (const group of phase.groups) {
      for (const p of group.participants) {
        participants.set(p.id, p);
      }
    }
  }

  const title = `Ronda ${displayRound}`;

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <AppShell
        mainProps={bind()}
        topBar={
          <TopBar
            title={title}
            right={
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 pr-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                En vivo
              </span>
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
                showGroupName={tournament.settings.useGroups}
                matches={matches}
                participants={participants}
                onResult={() => {}}
                readonly
              />
            ))
          )}
        </div>
      </AppShell>

      <BottomAction>
        <Tabs
          value={String(displayRound)}
          onValueChange={(val) => {
            if (val === "fin") {
              goToStandings();
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
              const done = isRoundComplete(tournament.phases, r);
              const triggerLabel =
                totalRounds > 4 ? r : r === displayRound ? `Ronda ${r}` : r;
              const isDenseModeCurrent = totalRounds > 4 && r === displayRound;
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
    </div>
  );
}
