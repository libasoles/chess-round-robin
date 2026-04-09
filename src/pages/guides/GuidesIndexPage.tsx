import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { buildBrandUrl } from "@/lib/brand";
import { ArrowLeft, BookOpen, ChevronRight, Trophy } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const GUIDES = [
  {
    to: "/tutorial",
    icon: <BookOpen className="h-5 w-5 text-primary shrink-0" />,
    title: "Cómo usar la app",
    description:
      "Tutorial interactivo: creá un torneo, ingresá participantes, registrá resultados y consultá la tabla de posiciones.",
  },
  {
    to: "/guia-desempates",
    icon: <Trophy className="h-5 w-5 text-primary shrink-0" />,
    title: "Guía de desempates",
    description:
      "Cómo organizar un cuadrangular de 4 jugadores con desempates garantizados, incluida la composición estratégica del grupo.",
  },
];

export function GuidesIndexPage() {
  return (
    <>
      <Helmet>
        <title>Guías | Ajedrez Round Robin</title>
        <meta
          name="description"
          content="Guías y tutoriales para organizar torneos de ajedrez round robin."
        />
        <link rel="canonical" href={buildBrandUrl("/guias")} />
      </Helmet>

      <AppShell
        topBar={
          <TopBar
            left={
              <Link
                to="/"
                className="p-2 -ml-2 text-foreground"
                aria-label="Volver al inicio"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            }
            title="Guías"
          />
        }
      >
        <div className="space-y-3 py-2">
          {GUIDES.map(({ to, icon, title, description }) => (
            <Link
              key={to}
              to={to}
              className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            </Link>
          ))}
        </div>
      </AppShell>
    </>
  );
}
