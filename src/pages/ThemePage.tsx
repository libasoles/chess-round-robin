import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import type { Theme } from "@/store/settingsStore";
import { useSettingsStore } from "@/store/settingsStore";
import {
  ArrowLeft,
  Award,
  ChevronRight,
  Crown,
  Flag,
  Handshake,
  Moon,
  Settings,
  Star,
  Sun,
  Trophy,
  Users,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

const THEME_OPTIONS: Array<{ value: Theme; icon: typeof Sun; label: string }> =
  [
    { value: "light", icon: Sun, label: "Claro" },
    { value: "dark", icon: Moon, label: "Oscuro" },
  ];

// ─── Color token definitions ──────────────────────────────────────────────────

type ColorToken = {
  name: string;
  bg: string;
  fgLabel?: string;
  fgClass?: string;
  description: string;
  lightValue: string;
  darkValue: string;
};

const SURFACE_TOKENS: ColorToken[] = [
  {
    name: "background",
    bg: "bg-background",
    fgLabel: "foreground",
    fgClass: "text-foreground",
    description: "Fondo de página",
    lightValue: "oklch(0.97 0.01 267) — gris azulado claro",
    darkValue: "oklch(0.22 0 0) — gris muy oscuro",
  },
  {
    name: "card",
    bg: "bg-card",
    fgLabel: "card-foreground",
    fgClass: "text-card-foreground",
    description: "Superficies / tarjetas",
    lightValue: "oklch(1 0 0) — blanco",
    darkValue: "oklch(0.29 0 0) — gris carbón",
  },
  {
    name: "muted",
    bg: "bg-muted",
    fgLabel: "muted-foreground",
    fgClass: "text-muted-foreground",
    description: "Fondo sutil / controles desactivados",
    lightValue: "oklch(0.92 0.01 273) — gris muy suave",
    darkValue: "oklch(0.32 0 0) — gris medio oscuro",
  },
  {
    name: "header-bg",
    bg: "bg-header-bg",
    fgLabel: "foreground",
    fgClass: "text-foreground",
    description: "Fondo del header (siempre azulado)",
    lightValue: "oklch(0.99 0.01 248) — blanco azulado",
    darkValue: "oklch(0.18 0.02 248) — azul muy oscuro",
  },
];

const BRAND_TOKENS: ColorToken[] = [
  {
    name: "primary",
    bg: "bg-primary",
    fgLabel: "primary-foreground",
    fgClass: "text-primary-foreground",
    description: "Acción principal / CTA",
    lightValue: "oklch(0.8 0.14 349) — lila / rosa",
    darkValue: "oklch(0.68 0.16 277) — violeta",
  },
  {
    name: "secondary",
    bg: "bg-secondary",
    fgLabel: "secondary-foreground",
    fgClass: "text-secondary-foreground",
    description: "Acción secundaria",
    lightValue: "oklch(0.94 0.07 98) — amarillo cálido",
    darkValue: "oklch(0.77 0.15 306) — magenta-violeta",
  },
  {
    name: "accent",
    bg: "bg-accent",
    fgLabel: "accent-foreground",
    fgClass: "text-accent-foreground",
    description: "Énfasis / resaltado (azul ↔ dorado)",
    lightValue: "oklch(0.83 0.09 248) — azul claro",
    darkValue: "oklch(0.88 0.15 92) — dorado",
  },
  {
    name: "destructive",
    bg: "bg-destructive",
    fgLabel: "(white)",
    fgClass: "text-white",
    description: "Peligro / eliminar",
    lightValue: "oklch(0.7 0.19 23) — rojo-naranja",
    darkValue: "oklch(0.71 0.17 22) — rojo-naranja",
  },
];

const CHART_TOKENS = [
  {
    name: "chart-1",
    bg: "bg-chart-1",
    lightDesc: "lila/rosa",
    darkDesc: "violeta",
  },
  {
    name: "chart-2",
    bg: "bg-chart-2",
    lightDesc: "magenta",
    darkDesc: "turquesa",
  },
  { name: "chart-3", bg: "bg-chart-3", lightDesc: "azul", darkDesc: "dorado" },
  { name: "chart-4", bg: "bg-chart-4", lightDesc: "ámbar", darkDesc: "rosa" },
  {
    name: "chart-5",
    bg: "bg-chart-5",
    lightDesc: "verde lima",
    darkDesc: "verde esmeralda",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 mt-6">
      {children}
    </h2>
  );
}

function ColorSwatch({ token }: { token: ColorToken }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={`${token.bg} rounded border border-border h-16 flex items-end p-2`}
      >
        <span
          className={`${token.fgClass} text-xs font-mono font-semibold leading-tight`}
        >
          {token.fgLabel}
        </span>
      </div>
      <div className="px-0.5">
        <p className="text-foreground text-xs font-mono font-bold">
          {token.name}
        </p>
        <p className="text-muted-foreground text-xs">{token.description}</p>
      </div>
    </div>
  );
}

function TokenRow({ token }: { token: ColorToken }) {
  return (
    <div className="flex gap-3 items-start py-2 border-b border-border last:border-0">
      <div
        className={`${token.bg} w-10 h-10 rounded border border-border shrink-0 mt-0.5`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-mono font-semibold">
          bg-{token.name}
        </p>
        <p className="text-muted-foreground text-xs">{token.description}</p>
        <p className="text-muted-foreground text-xs mt-0.5 truncate">
          ☀ {token.lightValue}
        </p>
        <p className="text-muted-foreground text-xs truncate">
          🌙 {token.darkValue}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ThemePage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useSettingsStore();
  const selectedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  return (
    <>
      <Helmet>
        <title>Theme Reference</title>
      </Helmet>

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
            title="Theme Reference"
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
        {/* ── Paleta de superficies ── */}
        <SectionTitle>Superficies</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {SURFACE_TOKENS.map((t) => (
            <ColorSwatch key={t.name} token={t} />
          ))}
        </div>

        {/* ── Paleta de marca ── */}
        <SectionTitle>Colores de marca</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {BRAND_TOKENS.map((t) => (
            <ColorSwatch key={t.name} token={t} />
          ))}
        </div>

        {/* ── Detalles (valores oklch) ── */}
        <SectionTitle>Valores por token</SectionTitle>
        <div className="bg-card rounded border border-border px-3 divide-y divide-border">
          {[...SURFACE_TOKENS, ...BRAND_TOKENS].map((t) => (
            <TokenRow key={t.name} token={t} />
          ))}
        </div>

        {/* ── Colores de gráficas ── */}
        <SectionTitle>Chart colors</SectionTitle>
        <div className="flex gap-2">
          {CHART_TOKENS.map((c) => (
            <div
              key={c.name}
              className="flex-1 flex flex-col gap-1 items-center"
            >
              <div className={`${c.bg} w-full h-10 rounded`} />
              <span className="text-foreground text-[10px] font-mono text-center leading-tight">
                {c.name}
              </span>
              <span className="text-muted-foreground text-[10px] text-center leading-tight">
                ☀ {c.lightDesc}
              </span>
              <span className="text-muted-foreground text-[10px] text-center leading-tight">
                🌙 {c.darkDesc}
              </span>
            </div>
          ))}
        </div>

        {/* ── Textos ── */}
        <SectionTitle>Texto</SectionTitle>
        <div className="bg-card rounded border border-border px-4 py-3 flex flex-col gap-2">
          <p className="text-foreground text-base font-semibold">
            text-foreground — texto principal
          </p>
          <p className="text-muted-foreground text-sm">
            text-muted-foreground — secundario / ayuda
          </p>
          <p className="text-primary text-sm font-semibold">
            text-primary — énfasis de marca
          </p>
          <p className="text-secondary text-sm font-semibold">
            text-secondary — énfasis secundario
          </p>
          <p className="text-accent text-sm font-semibold">
            text-accent — énfasis de acento
          </p>
          <p className="text-destructive text-sm font-semibold">
            text-destructive — peligro / error
          </p>
        </div>

        {/* ── Iconos ── */}
        <SectionTitle>Iconos</SectionTitle>
        <div className="bg-card rounded border border-border px-4 py-3">
          <div className="flex flex-wrap gap-4">
            {(
              [
                ["text-foreground", "foreground", Trophy],
                ["text-muted-foreground", "muted-fg", Settings],
                ["text-primary", "primary", Crown],
                ["text-secondary", "secondary", Star],
                ["text-accent", "accent", Award],
                ["text-destructive", "destructive", Flag],
              ] as [string, string, React.ElementType][]
            ).map(([cls, label, Icon]) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon className={`${cls} size-6`} />
                <span className="text-muted-foreground text-[10px] font-mono">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Botones con texto ── */}
        <SectionTitle>Botones — texto</SectionTitle>
        <div className="bg-card rounded border border-border px-4 py-4 flex flex-wrap gap-2">
          <Button variant="default">primary</Button>
          <Button variant="secondary">secondary</Button>
          <Button variant="outline">outline</Button>
          <Button variant="ghost">ghost</Button>
          <Button variant="destructive">destructive</Button>
          <Button variant="link">link</Button>
        </div>

        {/* ── Botones con iconos ── */}
        <SectionTitle>Botones — iconos</SectionTitle>
        <div className="bg-card rounded border border-border px-4 py-4 flex flex-wrap gap-2">
          <Button variant="default" size="icon">
            <Trophy />
          </Button>
          <Button variant="secondary" size="icon">
            <Crown />
          </Button>
          <Button variant="outline" size="icon">
            <Settings />
          </Button>
          <Button variant="ghost" size="icon">
            <Users />
          </Button>
          <Button variant="destructive" size="icon">
            <Flag />
          </Button>
        </div>

        {/* ── Botones con icono + texto ── */}
        <SectionTitle>Botones — icono + texto</SectionTitle>
        <div className="bg-card rounded border border-border px-4 py-4 flex flex-col gap-2">
          <Button variant="default" className="w-full justify-start gap-2">
            <Trophy /> Nuevo Torneo (default)
          </Button>
          <Button variant="secondary" className="w-full justify-start gap-2">
            <Crown /> Secondary
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Settings /> Outline
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Handshake /> Ghost
          </Button>
          <Button variant="destructive" className="w-full justify-start gap-2">
            <Flag /> Destructive
          </Button>
          <Button variant="link" className="w-full justify-start gap-2">
            <ChevronRight /> Link
          </Button>
        </div>

        {/* ── Bordes y separadores ── */}
        <SectionTitle>Bordes</SectionTitle>
        <div className="bg-card rounded border border-border px-4 py-3 flex flex-col gap-3">
          <div className="border border-border rounded p-2">
            <span className="text-muted-foreground text-xs font-mono">
              border-border
            </span>
          </div>
          <div className="border-2 border-primary rounded p-2">
            <span className="text-muted-foreground text-xs font-mono">
              border-primary
            </span>
          </div>
          <div className="border-2 border-accent rounded p-2">
            <span className="text-muted-foreground text-xs font-mono">
              border-accent
            </span>
          </div>
          <div className="border-2 border-destructive rounded p-2">
            <span className="text-muted-foreground text-xs font-mono">
              border-destructive
            </span>
          </div>
        </div>

        {/* ── Ring (focus) ── */}
        <SectionTitle>Ring (focus)</SectionTitle>
        <div className="bg-card rounded border border-border px-4 py-3 flex flex-col gap-3">
          <div className="outline-none ring-2 ring-ring rounded p-2">
            <span className="text-muted-foreground text-xs font-mono">
              ring-ring — igual que accent en cada tema
            </span>
          </div>
          <div className="outline-none ring-2 ring-primary rounded p-2">
            <span className="text-muted-foreground text-xs font-mono">
              ring-primary
            </span>
          </div>
        </div>

        {/* ── Input ── */}
        <SectionTitle>Input / campo de texto</SectionTitle>
        <div className="bg-card rounded border border-border px-4 py-3">
          <input
            className="w-full border border-input bg-background text-foreground placeholder:text-muted-foreground rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="border-input / bg-background / focus:ring-ring"
            readOnly
          />
        </div>

        <div className="h-8" />
      </AppShell>
    </>
  );
}
