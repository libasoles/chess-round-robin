import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { PointSelector } from "@/components/settings/PointSelector";
import { TiebreakInfo } from "@/components/settings/TiebreakInfo";
import { TiebreakList } from "@/components/settings/TiebreakList";
import {
  TournamentParticipantsList,
  type ParticipantsListState,
} from "@/components/settings/TournamentParticipantsList";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { findTargetGroup } from "@/domain/addParticipant";
import type {
  TiebreakMethod,
  Tournament,
  TournamentSettings,
} from "@/domain/types";
import { isRoundComplete } from "@/hooks/useCurrentRound";
import { useHistoryStore } from "@/store/historyStore";
import type { Theme } from "@/store/settingsStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { ArrowLeft, Lock, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const THEME_OPTIONS: Array<{ value: Theme; icon: typeof Sun; label: string }> =
  [
    { value: "light", icon: Sun, label: "Claro" },
    { value: "dark", icon: Moon, label: "Oscuro" },
  ];

type Mode = "template" | "active" | "readonly";

export function TournamentConfigPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id } = useParams<{ id: string }>();

  const isTemplateRoute = pathname.includes("/new/settings");
  const isHistoryRoute = pathname.includes("/history/");

  const [hydrated, setHydrated] = useState(
    () =>
      useTournamentStore.persist.hasHydrated() &&
      useHistoryStore.persist.hasHydrated(),
  );
  useEffect(() => {
    const unsubA = useTournamentStore.persist.onFinishHydration(() => {
      if (useHistoryStore.persist.hasHydrated()) setHydrated(true);
    });
    const unsubB = useHistoryStore.persist.onFinishHydration(() => {
      if (useTournamentStore.persist.hasHydrated()) setHydrated(true);
    });
    if (
      useTournamentStore.persist.hasHydrated() &&
      useHistoryStore.persist.hasHydrated()
    ) {
      setHydrated(true);
    }
    return () => {
      unsubA();
      unsubB();
    };
  }, []);

  const { lastTournamentSettings, setLastTournamentSettings, theme, setTheme } =
    useSettingsStore();
  const {
    activeTournament,
    updateActiveTournamentSettings,
    addParticipantToActiveTournament,
    setDraftParticipants,
    abandonTournament,
  } = useTournamentStore();
  const [addError, setAddError] = useState<string | null>(null);
  const historyTournament = useHistoryStore((s) =>
    s.tournaments.find((t) => t.id === id),
  );

  const selectedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  // Resolve mode + source settings
  let mode: Mode;
  let settings: TournamentSettings | null;
  if (isTemplateRoute) {
    mode = "template";
    settings = lastTournamentSettings;
  } else if (isHistoryRoute) {
    mode = "readonly";
    settings = historyTournament?.settings ?? null;
  } else {
    const matched =
      activeTournament && activeTournament.id === id ? activeTournament : null;
    settings = matched?.settings ?? null;
    mode = matched?.status === "finished" ? "readonly" : "active";
  }

  // Redirect if hydrated and no settings found (active route with no matching tournament)
  useEffect(() => {
    if (!hydrated) return;
    if (mode === "template") return;
    if (!settings) navigate("/", { replace: true });
  }, [hydrated, mode, settings, navigate]);

  if (!hydrated || !settings) return null;

  const readonly = mode === "readonly";

  function updateByePoints(value: 0 | 0.5 | 1) {
    if (mode === "template") {
      setLastTournamentSettings({
        ...lastTournamentSettings,
        byePoints: value,
      });
    } else if (mode === "active") {
      updateActiveTournamentSettings({ byePoints: value });
    }
  }

  function handleAddParticipant(name: string) {
    setAddError(null);
    const res = addParticipantToActiveTournament(name);
    if (!res.ok) {
      const messages: Record<string, string> = {
        "duplicate-name": "Ya hay un participante con ese nombre.",
        "invalid-name": "El nombre no puede estar vacío.",
        "round1-complete": "La primera ronda ya está completa.",
        "groups-full": "No hay cupo en ningún grupo.",
        "no-active-phase": "No hay un torneo activo.",
      };
      setAddError(messages[res.reason] ?? "No se pudo agregar.");
    }
  }

  function handleStartNewTournamentWithSamePeople(t: Tournament) {
    const names = t.phases[0]!.groups.flatMap((g) =>
      g.participants.filter((p) => !p.isBye).map((p) => p.name),
    );
    setDraftParticipants(names);
    abandonTournament();
    navigate("/tournament/new");
  }

  function updateTiebreakOrder(order: TiebreakMethod[]) {
    if (mode === "template") {
      setLastTournamentSettings({
        ...lastTournamentSettings,
        tiebreakOrder: order,
      });
    } else if (mode === "active") {
      updateActiveTournamentSettings({ tiebreakOrder: order });
    }
  }

  return (
    <AppShell
      topBar={
        <TopBar
          left={
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-foreground"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          }
          title="Configuración"
          right={
            <div className="flex rounded-md border border-border overflow-hidden">
              {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-label={label}
                  className={`p-2 transition-colors ${
                    selectedTheme === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          }
        />
      }
    >
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="space-y-6 pb-8">
        {readonly && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            <p>Torneo finalizado. La configuración no es editable.</p>
          </div>
        )}

        {mode !== "template" &&
          (() => {
            const sourceTournament =
              mode === "active"
                ? activeTournament
                : isHistoryRoute
                  ? (historyTournament ?? null)
                  : null;
            if (!sourceTournament) return null;

            const phase0 = sourceTournament.phases[0];
            if (!phase0) return null;

            let listState: ParticipantsListState;
            if (mode === "readonly") {
              listState = "readonly-finished";
            } else if (!isRoundComplete(sourceTournament.phases, 1)) {
              const target = findTargetGroup(sourceTournament);
              listState = target.full ? "groups-full" : "editable";
            } else {
              listState = "readonly-round1-complete";
            }

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Participantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TournamentParticipantsList
                    groups={phase0.groups}
                    state={listState}
                    groupSize={sourceTournament.settings.groupSize}
                    onAdd={handleAddParticipant}
                    onStartNewTournament={() =>
                      handleStartNewTournamentWithSamePeople(sourceTournament)
                    }
                    errorMessage={addError}
                  />
                </CardContent>
              </Card>
            );
          })()}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Desempates
            </CardTitle>
            <CardAction className="-mr-2">
              <TiebreakInfo />
            </CardAction>
          </CardHeader>
          <CardContent>
            <div
              className={readonly ? "pointer-events-none opacity-60" : ""}
              aria-disabled={readonly}
            >
              <TiebreakList
                order={settings.tiebreakOrder}
                onChange={updateTiebreakOrder}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Puntos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={readonly ? "pointer-events-none opacity-60" : ""}
              aria-disabled={readonly}
            >
              <PointSelector
                label="Por bye de número impar"
                value={settings.byePoints}
                onChange={updateByePoints}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
