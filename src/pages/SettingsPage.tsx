import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { ArbitratorField } from "@/components/settings/ArbitratorField";
import { ParticipantsPool } from "@/components/settings/ParticipantsPool";
import { PointSelector } from "@/components/settings/PointSelector";
import { TiebreakList } from "@/components/settings/TiebreakList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TiebreakMethod } from "@/domain/types";
import type { Theme } from "@/store/settingsStore";
import { useSettingsStore } from "@/store/settingsStore";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

const THEME_OPTIONS: Array<{ value: Theme; icon: typeof Sun; label: string }> =
  [
    { value: "light", icon: Sun, label: "Claro" },
    { value: "dark", icon: Moon, label: "Oscuro" },
  ];

export function SettingsPage() {
  const navigate = useNavigate();
  const {
    arbitratorName,
    lastTournamentSettings,
    participantsPool,
    theme,
    setArbitratorName,
    setLastTournamentSettings,
    setTheme,
    addToParticipantsPool,
    removeFromParticipantsPool,
  } = useSettingsStore();
  const selectedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  function updateSettings<K extends keyof typeof lastTournamentSettings>(
    key: K,
    value: (typeof lastTournamentSettings)[K],
  ) {
    setLastTournamentSettings({ ...lastTournamentSettings, [key]: value });
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
      <div className="space-y-6 pb-8">
        <Card>
          <CardContent>
            <ArbitratorField
              value={arbitratorName ?? ""}
              onChange={setArbitratorName}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Desempates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TiebreakList
              order={lastTournamentSettings.tiebreakOrder}
              onChange={(order: TiebreakMethod[]) =>
                updateSettings("tiebreakOrder", order)
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Puntos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PointSelector
              label="Por bye de número impar"
              value={lastTournamentSettings.byePoints}
              onChange={(v) => updateSettings("byePoints", v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Participantes guardados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ParticipantsPool
              pool={participantsPool}
              onAdd={addToParticipantsPool}
              onRemove={removeFromParticipantsPool}
            />
          </CardContent>
        </Card>

        <p className="px-1 text-right text-xs text-muted-foreground">
          Versión {__APP_VERSION__}
        </p>
      </div>
    </AppShell>
  );
}
