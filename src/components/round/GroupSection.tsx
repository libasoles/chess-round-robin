import type { Match, MatchResult, Participant } from '@/domain/types'
import { MatchRow } from './MatchRow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChessKnight } from 'lucide-react'

interface GroupSectionProps {
  groupName: string
  showGroupName: boolean
  matches: Match[]
  participants: Map<string, Participant>
  onResult: (matchId: string, result: MatchResult | null) => void
  readonly?: boolean
}

export function GroupSection({
  groupName,
  showGroupName,
  matches,
  participants,
  onResult,
  readonly = false,
}: GroupSectionProps) {
  const sortedMatches = [...matches].sort((a, b) => {
    const aWhite = participants.get(a.white)
    const aBlack = participants.get(a.black)
    const bWhite = participants.get(b.white)
    const bBlack = participants.get(b.black)

    const aIsBye = Boolean(aWhite?.isBye || aBlack?.isBye || a.result === 'auto_bye')
    const bIsBye = Boolean(bWhite?.isBye || bBlack?.isBye || b.result === 'auto_bye')
    if (aIsBye === bIsBye) return 0
    return aIsBye ? 1 : -1
  })

  return (
    <Card size="sm" className="mb-4">
      {showGroupName && (
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-primary">
            Grupo {groupName}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        <div className="rounded-md bg-muted/50 px-2 py-1.5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs text-muted-foreground">
            <div className="min-w-0 flex items-center gap-1">
              <ChessKnight className="h-5 w-5 shrink-0 text-foreground" />
              <span>Blancas</span>
            </div>
            <span className="text-center"> </span>
            <div className="min-w-0 flex items-center justify-end gap-1">
              <span>Negras</span>
              <ChessKnight className="h-5 w-5 shrink-0 scale-x-[-1] text-foreground" />
            </div>
          </div>
        </div>
        {sortedMatches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            participants={participants}
            onResult={onResult}
            readonly={readonly}
          />
        ))}
      </CardContent>
    </Card>
  )
}
