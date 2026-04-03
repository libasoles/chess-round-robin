import type { Match, MatchResult, Participant } from '@/domain/types'
import { ResultButtons } from './ResultButtons'
import { Trophy } from 'lucide-react'

// Unicode chess knight characters
const WHITE_KNIGHT = '♘'
const BLACK_KNIGHT = '♞'

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
  const realPlayer = white.isBye ? black : white

  if (isBye) {
    return (
      <div className="py-3 border-b border-border last:border-0">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xl leading-none shrink-0">{WHITE_KNIGHT}</span>
            <span className="font-medium break-words">{realPlayer.name}</span>
          </div>
          <span className="text-muted-foreground text-xs text-center">vs</span>
          <div className="flex items-center gap-1.5 justify-end min-w-0">
            <span className="text-muted-foreground text-right break-words">Libre</span>
            <span className="text-xl leading-none shrink-0">{BLACK_KNIGHT}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <Trophy className="h-4 w-4" />
          <span>punto de bye</span>
        </div>
      </div>
    )
  }

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xl leading-none shrink-0">{WHITE_KNIGHT}</span>
          <span className="font-medium break-words">{white.name}</span>
        </div>
        <span className="text-muted-foreground text-xs text-center">vs</span>
        <div className="flex items-center gap-1.5 justify-end min-w-0">
          <span className="font-medium text-right break-words">{black.name}</span>
          <span className="text-xl leading-none shrink-0">{BLACK_KNIGHT}</span>
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
