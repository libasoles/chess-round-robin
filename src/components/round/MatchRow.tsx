import type { Match, MatchResult, Participant } from '@/domain/types'
import { ResultButtons } from './ResultButtons'
import { Trophy } from 'lucide-react'

interface MatchRowProps {
  match: Match
  participants: Map<string, Participant>
  onResult: (matchId: string, result: MatchResult | null) => void
  readonly?: boolean
}

export function MatchRow({ match, participants, onResult, readonly = false }: MatchRowProps) {
  const white = participants.get(match.white)
  const black = participants.get(match.black)

  if (!white || !black) return null

  const isBye = white.isBye || black.isBye

  if (isBye) {
    const whiteName = white.isBye ? 'Libre' : white.name
    const blackName = black.isBye ? 'Libre' : black.name

    return (
      <div className="rounded-md bg-muted/40 px-2 py-2">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
          <div className="min-w-0">
            <span className="font-medium break-words">{whiteName}</span>
          </div>
          <span className="text-muted-foreground text-xs text-center">vs</span>
          <div className="min-w-0 text-right">
            <span className="font-medium break-words">{blackName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center justify-center p-1 rounded-md bg-primary text-primary-foreground">
            <Trophy className="h-4 w-4" />
          </span>
          <span>punto de bye</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md bg-muted/40 px-2 py-2">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
        <div className="min-w-0">
          <span className="font-medium break-words text-chart-3">{white.name}</span>
        </div>
        <span className="text-muted-foreground text-xs text-center">vs</span>
        <div className="min-w-0 text-right">
          <span className="font-medium text-right break-words text-chart-3">{black.name}</span>
        </div>
      </div>
      {!readonly && (
        <ResultButtons
          current={match.result === 'auto_bye' ? null : match.result}
          onChange={(result) => onResult(match.id, result)}
        />
      )}
      {readonly && match.result && match.result !== 'auto_bye' && (
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {resultLabel(match.result)}
        </p>
      )}
    </div>
  )
}

function resultLabel(result: MatchResult): string {
  switch (result) {
    case 'white_win': return 'Ganan blancas'
    case 'black_win': return 'Ganan negras'
    case 'draw': return 'Tablas'
    case 'forfeit_white': return 'Abandono blancas'
    case 'forfeit_black': return 'Abandono negras'
    case 'auto_bye': return 'Bye'
  }
}
