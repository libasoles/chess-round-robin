import { EmptyHistory } from "@/components/home/EmptyHistory";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { TopBarShareAction } from "@/components/layout/TopBarShareAction";
import { GroupSection } from "@/components/round/GroupSection";
import { ResultButtons } from "@/components/round/ResultButtons";
import { ArbitratorField } from "@/components/settings/ArbitratorField";
import { ParticipantsPool } from "@/components/settings/ParticipantsPool";
import { TiebreakInfo } from "@/components/settings/TiebreakInfo";
import { TiebreakList } from "@/components/settings/TiebreakList";
import { StandingsTable } from "@/components/standings/StandingsTable";
import { ParticipantInput } from "@/components/tournament/ParticipantInput";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BYE_PARTICIPANT } from "@/domain/participants";
import type {
  Group,
  MatchResult,
  Participant,
  TiebreakMethod,
  TournamentSettings,
} from "@/domain/types";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  GripVertical,
  Handshake,
  Plus,
  Settings,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { MdDirectionsRun } from "react-icons/md";
import { Link } from "react-router-dom";

type OrderRow = { id: string; name: string };

const INITIAL_ORDER_ROWS: OrderRow[] = [
  { id: "p1", name: "Ana" },
  { id: "p2", name: "Bruno" },
  { id: "p3", name: "Carla" },
  { id: "p4", name: "Diego" },
];
function genOrderRowId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function SortableOrderRow({
  row,
  onChange,
  onAdd,
  onRemove,
  showAdd,
  showRemove,
}: {
  row: OrderRow;
  onChange: (value: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  showAdd: boolean;
  showRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="shrink-0 touch-none select-none p-1 rounded cursor-grab text-muted-foreground active:cursor-grabbing"
          aria-label={`Reordenar ${row.name}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <ParticipantInput
            value={row.name}
            onChange={onChange}
            onRemove={() => {}}
            canRemove={false}
            suggestions={[]}
          />
        </div>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label={`Eliminar ${row.name || "participante"}`}
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {showAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label={`Agregar fila después de ${row.name || "participante"}`}
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ParticipantOrderDemo() {
  const [rows, setRows] = useState(INITIAL_ORDER_ROWS);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rows.findIndex((row) => row.id === active.id);
    const newIndex = rows.findIndex((row) => row.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setRows((prev) => arrayMove(prev, oldIndex, newIndex));
  }
  function addRowAfter(targetId: string) {
    setRows((prev) => {
      const index = prev.findIndex((row) => row.id === targetId);
      if (index === -1) return prev;
      const next = [...prev];
      next.splice(index + 1, 0, { id: genOrderRowId(), name: "" });
      return next;
    });
  }

  function removeRow(targetId: string) {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((row) => row.id !== targetId);
    });
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Arrastrá desde el ícono <GripVertical className="inline h-3.5 w-3.5" />{" "}
        para definir el orden de emparejamiento inicial.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rows.map((row) => row.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={row.id} className="space-y-1">
                {(() => {
                  const isLastRow = index === rows.length - 1;
                  return (
                    <SortableOrderRow
                      row={row}
                      onChange={(value) => {
                        setRows((prev) =>
                          prev.map((current) =>
                            current.id === row.id
                              ? { ...current, name: value }
                              : current,
                          ),
                        );
                      }}
                      onAdd={() => addRowAfter(row.id)}
                      onRemove={() => removeRow(row.id)}
                      showAdd={isLastRow}
                      showRemove={!isLastRow}
                    />
                  );
                })()}
                <p className="text-[11px] text-chart-4 pl-8">
                  Posición {index + 1}
                </p>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export function TutorialPage() {
  const [arbitratorName, setArbitratorName] = useState("");
  const [tiebreakOrder, setTiebreakOrder] = useState<TiebreakMethod[]>([
    "DE",
    "PN",
  ]);
  const [participantsPool, setParticipantsPool] = useState<string[]>([
    "Alonso",
    "Beatriz",
    "Carlos",
    "Diana",
  ]);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [useGroups, setUseGroups] = useState(true);
  const standingsSettings: TournamentSettings = {
    arbitratorName: "Árbitro Demo",
    organizerName: "Organizador Demo",
    forfeitPoints: 0,
    byePoints: 1,
    tiebreakOrder: ["DE", "PN"],
    useGroups: false,
    groupSize: 4,
  };

  const standingsExampleGroup: Group = {
    name: "A",
    participants: [
      { id: "s1", name: "Ana", isBye: false },
      { id: "s2", name: "Bruno", isBye: false },
      { id: "s3", name: "Carla", isBye: false },
      { id: "s4", name: "Diego", isBye: false },
    ],
    matches: [
      { id: "sm1", white: "s1", black: "s2", round: 1, result: "black_win" },
      { id: "sm2", white: "s3", black: "s4", round: 1, result: "black_win" },
      { id: "sm3", white: "s1", black: "s3", round: 2, result: "black_win" },
      { id: "sm4", white: "s2", black: "s4", round: 2, result: "white_win" },
      { id: "sm5", white: "s1", black: "s4", round: 3, result: "black_win" },
      { id: "sm6", white: "s2", black: "s3", round: 3, result: "white_win" },
    ],
  };

  const standingsTieResolvedGroup: Group = {
    name: "B",
    participants: [
      { id: "t1", name: "Elena", isBye: false },
      { id: "t2", name: "Facundo", isBye: false },
      { id: "t3", name: "Gina", isBye: false },
      { id: "t4", name: "Hugo", isBye: false },
    ],
    matches: [
      { id: "tm1", white: "t1", black: "t2", round: 1, result: "black_win" },
      { id: "tm2", white: "t3", black: "t4", round: 1, result: "draw" },
      { id: "tm3", white: "t1", black: "t3", round: 2, result: "white_win" },
      { id: "tm4", white: "t2", black: "t4", round: 2, result: "white_win" },
      { id: "tm5", white: "t1", black: "t4", round: 3, result: "white_win" },
      { id: "tm6", white: "t2", black: "t3", round: 3, result: "black_win" },
    ],
  };

  // Elena and Facundo both finish at 2.5 pts.
  // Their direct match was a draw (DE unresolved) and both have 1 PN win → tie stands.
  const standingsTieUnresolvedGroup: Group = {
    name: "C",
    participants: [
      { id: "u1", name: "Elena", isBye: false },
      { id: "u2", name: "Facundo", isBye: false },
      { id: "u3", name: "Gina", isBye: false },
      { id: "u4", name: "Hugo", isBye: false },
    ],
    matches: [
      { id: "um1", white: "u1", black: "u2", round: 1, result: "draw" },
      { id: "um2", white: "u3", black: "u4", round: 1, result: "white_win" },
      { id: "um3", white: "u1", black: "u3", round: 2, result: "white_win" },
      { id: "um4", white: "u2", black: "u4", round: 2, result: "white_win" },
      { id: "um5", white: "u4", black: "u1", round: 3, result: "black_win" },
      { id: "um6", white: "u3", black: "u2", round: 3, result: "black_win" },
    ],
  };

  const readonlyParticipants = useMemo(() => {
    const map = new Map<string, Participant>();
    map.set(BYE_PARTICIPANT.id, BYE_PARTICIPANT);
    map.set("a", { id: "a", name: "Ana", isBye: false });
    map.set("b", { id: "b", name: "Bruno", isBye: false });
    map.set("c", { id: "c", name: "Carla", isBye: false });
    return map;
  }, []);

  return (
    <>
      <Helmet>
        <title>Cómo usar Round Robin | Tutorial</title>
        <meta
          name="description"
          content="Aprendé a crear un torneo de ajedrez round robin: ingresá participantes, avanzá rondas y consultá la tabla de posiciones. Tutorial interactivo."
        />
        <link
          rel="canonical"
          href="https://ajedrezroundrobin.com.ar/tutorial"
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
            title="Tutorial"
          />
        }
      >
        <div className="space-y-4 pb-8">
          <h2>Torneos</h2>

          <Card>
            <CardHeader>
              <CardTitle>Historial vacío</CardTitle>
              <CardDescription>
                Si no hay torneos guardados, la primer pantalla muestra este
                estado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyHistory />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Creación de torneo</CardTitle>
              <CardDescription>
                <p>
                  Los nombres de árbitro y organizador son{" "}
                  <span className="text-chart-1">opcionales</span>. Si se
                  completan, se guardan para autocompletar en torneos futuros.
                </p>
                <br />
                <p>
                  Si configuras tu nombre en la{" "}
                  <span className="text-chart-1">
                    <Settings className="h-4 w-4 text-inherit inline" /> pestaña
                    de Configuración
                  </span>
                  , se usará por defecto como árbitro. Esto es así porque se
                  espera que los usuarios principales de la app sean árbitros.
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="tutorial-arbitrator">Árbitro</Label>
                <Input
                  id="tutorial-arbitrator"
                  placeholder="José Raúl Capablanca"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tutorial-organizer">Organizador</Label>
                <Input
                  id="tutorial-organizer"
                  placeholder="Club de Ajedrez"
                  className="h-12 text-base"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inscripción de participantes</CardTitle>
              <CardDescription>
                <p>
                  Agregas nuevos participantes escribiendo su nombre y tocando
                  el botón <Plus className="h-5 w-5 inline" />.
                </p>
                <br />
                <p>
                  Si ya cargaste participantes en torneos anteriores, los vas a
                  encontrar aquí, en un menú desplegable. Esto te permite
                  agregarlos rápidamente sin tener que escribir sus nombres de
                  nuevo.
                </p>
                <br />
                <p>
                  El <span className="text-chart-1">orden</span> de carga es
                  importante para los torneos en grupo. Los primeros 4 irán al
                  primero grupo.
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParticipantOrderDemo />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agregado de participantes</CardTitle>
              <CardDescription>
                <p>
                  A veces alguien llega tarde. Si aún no terminó la primer
                  ronda, puedes agregar más participantes desde el ícono{" "}
                  <Settings className="h-4 w-4 text-chart-1 inline" />.
                </p>
                <br />
                <p>
                  También puedes corregir los métodos de desempate y el puntaje
                  de bye durante el torneo. Una vez que el torneo finalice, la
                  configuración no será editable.
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              Agregar participantes implica{" "}
              <span className="text-chart-1">
                recalcular los emparejamientos
              </span>{" "}
              de las rondas. Pero como algunos jugadores pueden haber comenzado
              sus partidas, decidimos no modificar la primer ronda, y recalcular
              solo las siguientes. Si cargaste datos en esas rondas, se
              perderán.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Torneo por grupos</CardTitle>
              <CardDescription>
                <p>
                  Cuando hay muchos participantes, conviene separarlos en grupos
                  para que jueguen menos partidas. De otra manera, jugarían
                  todos contra todos.
                </p>
                <br />
                <p>
                  Al final, tienes la opción de seleccionar los mejores de cada
                  grupo, o simplemente quienes quieran seguir jugando, para
                  avanzar a otra <span className="text-chart-1">fase</span> del
                  torneo.
                </p>

                <br />
                <p className="text-xs text-muted-foreground">
                  El mínimo de participantes para activar esta opción es 6.
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="tutorial-groups"
                  checked={useGroups}
                  onCheckedChange={(checked) => setUseGroups(checked === true)}
                />
                <Label htmlFor="tutorial-groups">
                  Separar participantes en grupos de 4
                </Label>
              </div>
            </CardContent>
          </Card>

          <h2 className="flex items-center gap-2">
            Configuración
            <Settings className="h-4 w-4 text-muted-foreground" />
          </h2>

          <Card>
            <CardHeader>
              <CardTitle>Base de datos local</CardTitle>
              <CardDescription>
                Los datos se guardan solo en tu navegador, no en una base de
                datos remota.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-bold">
                Esto significa que si cambias de dispositivo, o borras los datos
                del navegador, no tendrás la información de tus torneos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nombre</CardTitle>
              <CardDescription>
                Si completás este campo, tu nombre se usará por defecto como
                árbitro en torneos futuros.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArbitratorField
                value={arbitratorName}
                onChange={setArbitratorName}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Desempates <TiebreakInfo />
              </CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                Muchas veces 2 o más participantes terminan las rondas con el
                mismo puntaje. Hay varios algoritmos estandar para desempatar.
                Aunque ninguno garantiza el desempate.
              </p>

              <p>
                Como organizador, podés elegir qué métodos usar y en qué orden
                de prioridad. Si el primer método no logra desempatar a todos
                los participantes, se usa el siguiente método para los que
                siguen empatados, y así sucesivamente.
              </p>
              <p className="text-xs text-muted-foreground">
                Marcá qué métodos usar y arrastrá para cambiar prioridad.
              </p>
              <TiebreakList order={tiebreakOrder} onChange={setTiebreakOrder} />
              <p className="text-xs text-muted-foreground">
                Orden actual:{" "}
                {tiebreakOrder.length > 0
                  ? tiebreakOrder.join(" -> ")
                  : "sin métodos activos"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de participantes guardados</CardTitle>
              <CardDescription>
                <p>
                  Si ya creaste torneos, los participantes anotados aparecerán
                  aquí.
                </p>
                <br />
                <p>
                  También puedes agregar otros o limpiar la lista desde este
                  panel. Esta lista te permite agregar rápidamente participantes
                  a nuevos torneos sin tener que escribir sus nombres de nuevo.
                </p>
                <br />
                <p className="text-xs text-muted-foreground">
                  La lista solo existe en tu navegador. Noy hay una base de
                  datos compartida.
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParticipantsPool
                pool={participantsPool}
                onAdd={(names) => {
                  setParticipantsPool((prev) => {
                    const merged = new Set(prev);
                    for (const name of names) merged.add(name);
                    return Array.from(merged);
                  });
                }}
                onRemove={(name) => {
                  setParticipantsPool((prev) =>
                    prev.filter((value) => value !== name),
                  );
                }}
              />
            </CardContent>
          </Card>

          <h2>Rondas</h2>

          <Card>
            <CardHeader>
              <CardTitle>Qué significa cada ícono de partida</CardTitle>
              <CardDescription>
                Click en un ícono para marcarlo. Si marcas otro, el anterior se
                desmarca.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResultButtons current={result} onChange={setResult} />
              <div className="flex flex-col text-xs gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span>
                    Trofeo a la izquierda:{" "}
                    <span className="text-chart-2">ganan blancas</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 scale-x-[-1]" />
                  <span>
                    Trofeo espejado:{" "}
                    <span className="text-chart-2">ganan negras</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Handshake className="h-4 w-4" />
                  <span>
                    Apretón de manos:{" "}
                    <span className="text-chart-2">tablas</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MdDirectionsRun className="h-4 w-4" />
                  <span>
                    Corredor:{" "}
                    <span className="text-chart-2">abandono de blancas</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MdDirectionsRun className="h-4 w-4 scale-x-[-1]" />
                  <span>
                    Corredor espejado:{" "}
                    <span className="text-chart-2">abandono de negras</span>
                  </span>
                </div>
              </div>
              <div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tocar el mismo ícono activo lo desmarca y deja la partida sin
                  resultado cargado.
                </p>
              </div>
            </CardContent>
          </Card>

          <h2>Resultados</h2>

          <Card>
            <CardHeader>
              <CardTitle>Tabla de resultados</CardTitle>
              <CardDescription>
                Si no hay empates, verás solo la columna de puntos, y la
                posición en el ranking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandingsTable
                group={standingsExampleGroup}
                settings={standingsSettings}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Empates resueltos</CardTitle>
              <CardDescription>
                Elena y Facundo terminan con los mismos puntos, y se desempata
                por encuentro directo (<span className="text-chart-1">DE</span>
                ). En estos casos, verás columnas adicionales por cada algoritmo
                de desempate usado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandingsTable
                group={standingsTieResolvedGroup}
                settings={standingsSettings}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Empates no resueltos</CardTitle>
              <CardDescription>
                Elena y Facundo terminan con los mismos puntos, y no es posible
                desempatar con ninguno de los algoritmos. En este caso, se
                muestra la posición compartida, y aparece un detalle de por qué
                no se puede resolver el empate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandingsTable
                group={standingsTieUnresolvedGroup}
                settings={standingsSettings}
              />
            </CardContent>
          </Card>

          <h2>Compartir</h2>

          <Card>
            <CardHeader>
              <CardTitle>Compartir torneo</CardTitle>
              <CardDescription>
                <TopBarShareAction
                  jazzId="demo-jazz-id"
                  currentRound={2}
                  className="inline"
                />{" "}
                El botón genera un link público para ver el torneo en tiempo
                real, que puedes compartir fácilmente por whatsapp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              Como los datos solo existen en tu navegador, si borras un torneo
              dejará de estar disponible.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Qué ve quien entra al link</CardTitle>
              <CardDescription>
                En links compartidos no aparecen botones para editar resultados.
                Los datos son de solo lectura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <GroupSection
                groupName="A"
                showGroupName
                participants={readonlyParticipants}
                onResult={() => {}}
                readonly
                showMissingResultMessage
                matches={[
                  {
                    id: "m1",
                    white: "a",
                    black: "b",
                    round: 1,
                    result: "white_win",
                  },
                  { id: "m2", white: "c", black: "a", round: 1, result: null },
                  {
                    id: "m3",
                    white: "b",
                    black: BYE_PARTICIPANT.id,
                    round: 1,
                    result: "auto_bye",
                  },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                El visitante puede navegar rondas y ver posiciones, pero no
                modificar datos.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </>
  );
}
