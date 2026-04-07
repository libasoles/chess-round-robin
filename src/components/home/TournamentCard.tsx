import { ParticipantName } from "@/components/participants/ParticipantName";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { computeRankedStandings } from "@/domain/tiebreaks";
import type { Tournament } from "@/domain/types";
import { formatNameList } from "@/lib/formatNameList";
import { Trophy, X } from "lucide-react";
import { useState, type MouseEvent } from "react";

interface TournamentCardProps {
  tournament: Tournament;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateAndTimeParts(
  startIso: string,
  endIso?: string,
): { date: string; time: string } {
  const startDate = formatDate(startIso);
  const startTime = formatTime(startIso);

  if (!endIso)
    return { date: startDate, time: `Inicio ${startTime} hs · En curso` };

  return { date: startDate, time: `Inicio ${startTime} hs` };
}

function getRoundCount(tournament: Tournament): number {
  let max = 0;
  for (const phase of tournament.phases) {
    for (const group of phase.groups) {
      for (const match of group.matches) {
        if (match.round > max) max = match.round;
      }
    }
  }
  return max;
}

function getWinners(tournament: Tournament): string[] {
  const lastPhase = tournament.phases[tournament.phases.length - 1];
  if (!lastPhase) return [];

  const winners: string[] = [];
  for (const group of lastPhase.groups) {
    const entries = computeRankedStandings(group, tournament.settings);
    const firstPlace = entries.filter((e) => e.rank === 1);
    const nameMap = new Map(group.participants.map((p) => [p.id, p.name]));
    for (const e of firstPlace) {
      const name = nameMap.get(e.participantId);
      if (name) winners.push(name);
    }
  }
  return winners;
}

export function TournamentCard({
  tournament,
  onClick,
  onDelete,
}: TournamentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const rounds = getRoundCount(tournament);
  const phases = tournament.phases.length;
  const winners = getWinners(tournament);
  const dateTime = formatDateAndTimeParts(
    tournament.createdAt,
    tournament.finishedAt,
  );

  function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setShowDeleteDialog(true);
  }

  function confirmDelete() {
    onDelete?.(tournament.id);
    setShowDeleteDialog(false);
  }

  return (
    <>
      <div
        className={`rounded-lg border border-border bg-card px-4 py-3 space-y-1${onClick ? " cursor-pointer hover:bg-muted transition-colors" : ""}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">
              {dateTime.date}
            </span>
            <span className="text-xs text-muted-foreground/75">
              {dateTime.time}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 -mr-2 text-muted-foreground/45 hover:text-muted-foreground/70 dark:text-muted-foreground/45 dark:hover:text-muted-foreground/70"
                aria-label="Eliminar torneo"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {rounds} {rounds === 1 ? "ronda" : "rondas"}
          {phases > 1 && ` · ${phases} fases`}
        </p>
        {winners.length > 0 && (
          <p className="text-sm flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-primary shrink-0" />
            {winners.length === 1 ? "Ganó" : "Ganaron"}{" "}
            <ParticipantName>{formatNameList(winners)}</ParticipantName>
          </p>
        )}
      </div>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar torneo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Este torneo se eliminará del historial local. Esta acción no se
            puede deshacer.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
