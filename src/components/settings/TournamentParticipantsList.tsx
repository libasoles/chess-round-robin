import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GroupView {
  name: string;
  participants: Array<{ id: string; name: string; isBye: boolean }>;
}

export type ParticipantsListState =
  | "editable"
  | "readonly-finished"
  | "readonly-round1-complete"
  | "groups-full";

interface Props {
  groups: GroupView[];
  state: ParticipantsListState;
  groupSize: number;
  onAdd?: (name: string) => void;
  onStartNewTournament?: () => void;
  errorMessage?: string | null;
}

export function TournamentParticipantsList({
  groups,
  state,
  groupSize,
  onAdd,
  onStartNewTournament,
  errorMessage,
}: Props) {
  const [newName, setNewName] = useState("");
  const [confirmNewTournament, setConfirmNewTournament] = useState(false);

  const realCount = groups.reduce(
    (acc, g) => acc + g.participants.filter((p) => !p.isBye).length,
    0,
  );
  const showGroupHeaders = groups.length > 1;

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAdd?.(trimmed);
    setNewName("");
  }

  function handleConfirmNewTournament() {
    setConfirmNewTournament(false);
    onStartNewTournament?.();
  }

  return (
    <div className="space-y-3">
      {state !== "readonly-finished" &&
        state !== "readonly-round1-complete" &&
        state !== "groups-full" && (
          <>
            <div
              className="rounded-lg px-4 py-3 text-sm [&_svg]:pointer-events-none [&_svg]:shrink-0
            [&_svg:not([class*='size-'])]:size-4 
            bg-destructive/10 
            text-foreground
            dark:bg-destructive/20
            dark:hover:bg-destructive/30
            flex justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-flag mt-1 text-destructive"
                aria-hidden="true"
              >
                <path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"></path>
              </svg>
              <p>
                {" "}
                Si agregas participantes ahora, se conservará el emparejamiento
                de la primer ronda pero se recrearán las demás.
              </p>
            </div>
          </>
        )}

      {state === "readonly-round1-complete" && (
        <div className="rounded-lg border border-accent bg-muted px-4 py-3 text-sm text-muted-foreground">
          La primera ronda ya finalizó — no se pueden sumar más jugadores.
        </div>
      )}

      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.name} className="space-y-1">
            {showGroupHeaders && (
              <div className="text-[11px] uppercase tracking-wide text-chart-2">
                GRUPO {g.name}
              </div>
            )}
            <ul className="space-y-1">
              {g.participants
                .filter((p) => !p.isBye)
                .map((p) => (
                  <li key={p.id} className="px-3 py-1.5 text-sm">
                    {p.name}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      {state === "editable" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Nuevo participante"
              className="text-sm h-10 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAdd}
              className="h-10 w-10 shrink-0"
              aria-label="Agregar participante"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {errorMessage && (
            <p className="text-xs text-destructive">{errorMessage}</p>
          )}
        </div>
      )}
      {state === "groups-full" && (
        <div className="space-y-2 rounded-lg border border-accent bg-muted/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Los grupos están llenos ({groupSize}/{groupSize}). Para sumar más
            jugadores, empezá un torneo nuevo. Se conservará la misma gente.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmNewTournament(true)}
            className="w-full"
          >
            Recomenzar torneo
          </Button>
        </div>
      )}

      <Dialog
        open={confirmNewTournament}
        onOpenChange={setConfirmNewTournament}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Empezar un torneo nuevo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se abandonará el torneo en curso y se crearán los campos con los{" "}
            <strong>{realCount} participantes actuales</strong>. Podés agregar
            más antes de comenzar.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmNewTournament(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmNewTournament}>
              Empezar nuevo torneo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
