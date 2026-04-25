import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { PointSelector } from "@/components/settings/PointSelector";
import { TiebreakList } from "@/components/settings/TiebreakList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TiebreakMethod, TournamentSettings } from "@/domain/types";
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

  const {
    lastTournamentSettings,
    setLastTournamentSettings,
    theme,
    setTheme,
  } = useSettingsStore();
  const { activeTournament, updateActiveTournamentSettings } =
    useTournamentStore();
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
            <p>Torneo finalizado — configuración solo lectura.</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Desempates
            </CardTitle>
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
