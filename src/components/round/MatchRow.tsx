import { ParticipantName } from "@/components/participants/ParticipantName";
import type { Match, MatchResult, Participant } from "@/domain/types";
import { brand } from "@/lib/brand";
import { Trophy } from "lucide-react";
import { ResultButtons } from "./ResultButtons";

interface MatchRowProps {
  match: Match;
  participants: Map<string, Participant>;
  onResult: (matchId: string, result: MatchResult | null) => void;
  readonly?: boolean;
  showMissingResultMessage?: boolean;
}

export function MatchRow({
  match,
  participants,
  onResult,
  readonly = false,
  showMissingResultMessage = false,
}: MatchRowProps) {
  const white = participants.get(match.white);
  const black = participants.get(match.black);

  if (!white || !black) return null;

  const isBye = white.isBye || black.isBye;

  if (isBye) {
    const playerName = white.isBye ? black.name : white.name;

    return (
      <div className="rounded-md bg-muted/40 px-2 py-2">
        {brand.id === "tucuchess" && !readonly ? (
          <div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
              <div className="min-w-0">
                <ParticipantName>{playerName}</ParticipantName>
              </div>
              <span className="text-muted-foreground text-xs text-center">
                vs
              </span>
              <div className="min-w-0 text-right">
                <ParticipantName className="text-right">Libre</ParticipantName>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Trophy className="h-5 w-5" />
              </span>
              <span>Punto de bye por número impar</span>
            </div>
          </div>
        ) : (
          <>
            <div className="min-w-0 mb-1.5 text-sm">
              <ParticipantName>{playerName}</ParticipantName>
            </div>
            {readonly ? (
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Punto de bye por número impar
              </p>
            ) : (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Trophy className="h-5 w-5" />
                </span>
                <span>Punto de bye por número impar</span>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md bg-muted/40 px-2 py-2">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
        <div className="min-w-0">
          <ParticipantName>{white.name}</ParticipantName>
        </div>
        <span className="text-muted-foreground text-xs text-center">vs</span>
        <div className="min-w-0 text-right">
          <ParticipantName className="text-right">{black.name}</ParticipantName>
        </div>
      </div>
      {!readonly && (
        <ResultButtons
          current={match.result === "auto_bye" ? null : match.result}
          onChange={(result) => onResult(match.id, result)}
        />
      )}
      {readonly &&
        (match.result && match.result !== "auto_bye" ? (
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {resultLabel(match.result)}
          </p>
        ) : showMissingResultMessage ? (
          <p className="text-xs text-muted-foreground mt-1 text-center">
            No se cargó resultado para esta partida
          </p>
        ) : null)}
    </div>
  );
}

function resultLabel(result: MatchResult): string {
  switch (result) {
    case "white_win":
      return "Ganan blancas";
    case "black_win":
      return "Ganan negras";
    case "draw":
      return "Tablas";
    case "forfeit_white":
      return "Abandono blancas";
    case "forfeit_black":
      return "Abandono negras";
    case "auto_bye":
      return "Bye";
  }
}
