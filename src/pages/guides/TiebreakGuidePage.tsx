import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Crown,
  Handshake,
  Trophy,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionNumber({ n }: { n: number | string }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
      {n}
    </span>
  );
}

function SectionHeading({
  n,
  children,
}: {
  n: string | number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <SectionNumber n={n} />
      <h2 className="text-lg font-semibold leading-snug">{children}</h2>
    </div>
  );
}

function CriterionBlock({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <span className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-primary text-primary text-sm font-bold">
          {n}
        </span>
        {n < 3 && <div className="w-px flex-1 mt-1 bg-border" />}
      </div>
      <div className="pb-5 min-w-0">
        <p className="font-semibold text-foreground mb-1">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {children}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TiebreakGuidePage() {

  return (
    <>
      <Helmet>
        <title>Guía de Desempates: Round Robin 4 Jugadores</title>
        <meta
          name="description"
          content="Cómo organizar un cuadrangular de ajedrez con desempates garantizados. Sistema de criterios que resuelve cualquier empate entre dos jugadores al 100%."
        />
        <link
          rel="canonical"
          href="https://ajedrezroundrobin.com.ar/guia-desempates"
        />
      </Helmet>

      <AppShell
        topBar={
          <TopBar
            left={
              <Link
                to="/guias"
                className="p-2 -ml-2 text-foreground"
                aria-label="Volver a guías"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            }
            title="Guía de desempates"
          />
        }
      >
        <article className="space-y-6 pb-10">
          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <header className="space-y-3 pt-1">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Round Robin</Badge>
              <Badge variant="outline">4 jugadores</Badge>
            </div>
            <h1 className="text-2xl font-bold leading-tight">
              Guía de desempate en grupos de 4
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Cómo minimizar los empates, garantizar un campeón y aprovechar al
              máximo el formato de todos contra todos con cuatro participantes.
            </p>
            <Separator />
          </header>

          {/* ── Sección 1: Características ────────────────────────────── */}
          <section className="space-y-3">
            <SectionHeading n="a">Composición estratégica</SectionHeading>

            <p>
              Se recomienda que uno de los cuatro jugadores (el{" "}
              <span className="text-foreground font-medium">
                «jugador semilla»
              </span>
              ) tenga un nivel sensiblemente inferior a los otros tres.
            </p>
            <p>
              Si el jugador semilla no supera 1 punto, el empate cuádruple en la
              cima se vuelve{" "}
              <span className="text-foreground font-medium">
                matemáticamente imposible
              </span>
              , porque el total de puntos disponibles (6) no puede dividirse en
              cuatro partes iguales de 1.5 cuando algún jugador tiene ≤ 1 punto.
            </p>
          </section>

          {/* ── Sección 2: Puntuación ─────────────────────────────────── */}
          <section className="space-y-3">
            <SectionHeading n="b">Sistema de puntuación</SectionHeading>

            <p>Estandar.</p>

            <div className="space-y-2">
              {[
                {
                  icon: <Trophy className="h-4 w-4 text-chart-2" />,
                  label: "Victoria",
                  points: "1 punto",
                  color: "text-chart-2",
                },
                {
                  icon: <Handshake className="h-4 w-4 text-chart-4" />,
                  label: "Tablas",
                  points: "0.5 puntos",
                  color: "text-chart-4",
                },
                {
                  icon: (
                    <span className="h-4 w-4 flex items-center justify-center text-muted-foreground font-bold text-xs">
                      0
                    </span>
                  ),
                  label: "Derrota",
                  points: "0 puntos",
                  color: "text-muted-foreground",
                },
              ].map(({ icon, label, points, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border"
                >
                  {icon}
                  <span className="flex-1 text-sm">{label}</span>
                  <span
                    className={`text-sm font-semibold tabular-nums ${color}`}
                  >
                    {points}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Sección 3: Desempates ─────────────────────────────────── */}
          <section className="space-y-3">
            <SectionHeading n="c">Sistema de desempate</SectionHeading>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-chart-2/40 text-sm">
              <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0" />
              <span className="text-chart-2-foreground">
                Efectividad del 100% para empates entre dos jugadores.
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              Aplicá estos criterios en orden hasta que el empate quede
              resuelto:
            </p>

            <div className="mt-1">
              <CriterionBlock n={1} title="Encuentro directo">
                Si dos jugadores están empatados en puntos, el ganador de la
                partida que disputaron entre sí ocupa la posición superior. Es
                el criterio más intuitivo y el más usado en competencias.
              </CriterionBlock>

              <CriterionBlock n={2} title="Tablas con negras">
                Si el encuentro directo terminó en tablas, gana el desempate
                quien condujo las piezas negras. Este criterio premia el
                esfuerzo de igualar con la ligera desventaja teórica del segundo
                movimiento y garantiza que{" "}
                <span className="text-foreground">
                  cualquier duelo entre dos jugadores se resuelve al instante
                </span>
                : el color de las piezas siempre está asignado y nunca empata.
              </CriterionBlock>

              <CriterionBlock n={3} title="Playoff (Blitz o Armagedón)">
                Reservado exclusivamente para empates triples o cuádruples,
                situaciones poco probables bajo esta estructura. Al ser empates
                «estructurales», se definen en el tablero: partidas rápidas o
                una partida de Armagedón para el ganador inmediato.
              </CriterionBlock>
            </div>
          </section>

          {/* ── Sección 4: Jugador semilla ────────────────────────────── */}
          <section className="space-y-3">
            <SectionHeading n="d">El jugador semilla</SectionHeading>

            <p className="text-sm text-muted-foreground">
              Podría parecer injusto invitar a un jugador de menor nivel, pero
              este formato ofrece beneficios únicos para quien acepta ese rol:
            </p>

            <div className="space-y-2">
              {[
                {
                  title: "Bautismo de fuego",
                  body: "Jugar contra rivales superiores es la forma más rápida de detectar debilidades en la propia apertura y táctica.",
                },
                {
                  title: "Análisis post-partida",
                  body: "En torneos pequeños es habitual que los jugadores analicen la partida al terminar. Recibir feedback de tres rivales más fuertes en un solo día equivale a una masterclass intensiva.",
                },
                {
                  title: "Sin presión, máxima ganancia",
                  body: "Mientras los otros tres luchan bajo la presión de no cometer errores entre iguales, el jugador semilla juega con libertad. Cualquier empate o punto que logre será el gran hito del torneo.",
                },
                {
                  title: "Entorno controlado",
                  body: "A diferencia de un torneo masivo, en un cuadrangular recibe atención personalizada y entiende mejor la estructura de la competición.",
                },
              ].map(({ title, body }) => (
                <Card key={title} className="bg-card">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex gap-2.5">
                      <Crown className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {body}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* ── Sección 5: Probabilidades ─────────────────────────────── */}
          <section className="space-y-3">
            <SectionHeading n="e">Resumen de probabilidades</SectionHeading>

            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Escenario
                    </th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Probabilidad
                    </th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Resolución
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      scenario: "Empate de 2",
                      prob: "Media–alta",
                      resolution: "Directo / Negras",
                      probColor: "text-chart-4",
                    },
                    {
                      scenario: "Empate de 3",
                      prob: "Muy baja",
                      resolution: "Playoff",
                      probColor: "text-chart-2",
                    },
                    {
                      scenario: "Empate de 4",
                      prob: "Descartado*",
                      resolution: "—",
                      probColor: "text-muted-foreground",
                    },
                  ].map(({ scenario, prob, resolution, probColor }, i) => (
                    <tr
                      key={scenario}
                      className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                    >
                      <td className="px-3 py-2.5 font-medium">{scenario}</td>
                      <td className={`px-3 py-2.5 ${probColor}`}>{prob}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {resolution}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground pl-1">
              * Si el jugador semilla no supera 1 punto, un empate cuádruple es
              matemáticamente imposible: la suma total de los cuatro puntajes
              debería ser 6, pero con alguno ≤ 1 los otros tres no pueden
              completar 1.5 cada uno (3 × 1.5 = 4.5 ≠ 5 o también ≠ 6).
            </p>
          </section>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Probá el formato en la aplicación y llevá el registro de tus
              torneos cuadrangulares.
            </Link>
          </div>
        </article>
      </AppShell>
    </>
  );
}
