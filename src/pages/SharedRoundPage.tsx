import { AppShell } from "@/components/layout/AppShell";
import { BottomAction } from "@/components/layout/BottomAction";
import { TopBar } from "@/components/layout/TopBar";
import { GroupSection } from "@/components/round/GroupSection";
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
  const currentRound = Number(roundParam) || 1;

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

  const bind = useGesture({
    onDrag: ({ swipe: [swipeX] }) => {
      const t = rawTournament ?? lastValidTournament;
      if (!t) return;
      const total = getTotalRounds(t.phases);
      if (swipeX === -1) {
        if (currentRound < total) navigate(`/t/${jazzId}/round/${currentRound + 1}`, { replace: true });
        else navigate(`/t/${jazzId}/standings`);
      } else if (swipeX === 1) {
        if (currentRound > 1) navigate(`/t/${jazzId}/round/${currentRound - 1}`, { replace: true });
      }
    },
  });

  if (!tournament && !jazzTournament) {
    return (
      <AppShell topBar={<TopBar title="Cargando…" />}>
        <p className="text-muted-foreground text-sm text-center pt-8">
          Cargando torneo…
        </p>
      </AppShell>
    );
  }

  if (!tournament) {
    return (
      <AppShell topBar={<TopBar title="No disponible" />}>
        <p className="text-muted-foreground text-sm text-center pt-8">
          Este torneo no está disponible o el link es incorrecto.
        </p>
      </AppShell>
    );
  }

  const totalRounds = getTotalRounds(tournament.phases);
  const roundMatches = getCurrentRoundMatches(tournament.phases, currentRound);

  const participants = new Map<string, Participant>();
  participants.set(BYE_PARTICIPANT.id, BYE_PARTICIPANT);
  for (const phase of tournament.phases) {
    for (const group of phase.groups) {
      for (const p of group.participants) {
        participants.set(p.id, p);
      }
    }
  }

  const title = `Ronda ${currentRound}`;

  function goToRound(round: number) {
    navigate(`/t/${jazzId}/round/${round}`, { replace: true });
  }

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
          value={String(currentRound)}
          onValueChange={(val) => {
            if (val === "fin") {
              navigate(`/t/${jazzId}/standings`);
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
    </div>
  );
}
