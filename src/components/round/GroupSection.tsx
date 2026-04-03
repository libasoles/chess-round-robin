import type { Match, MatchResult, Participant } from '@/domain/types'
import { MatchRow } from './MatchRow'

const WHITE_KNIGHT = '♘'
const BLACK_KNIGHT = '♞'

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
    <div className="mb-4">
      {showGroupName && (
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Grupo {groupName}</h3>
      )}
      <div className="rounded-lg border border-border bg-card px-3">
        <div className="py-2 border-b border-border">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs text-muted-foreground">
            <div className="min-w-0 flex items-center gap-1">
              <span className="text-base leading-none shrink-0">{WHITE_KNIGHT}</span>
              <span>Blancas</span>
            </div>
            <span className="text-center"> </span>
            <div className="min-w-0 flex items-center justify-end gap-1">
              <span>Negras</span>
              <span className="text-base leading-none shrink-0">{BLACK_KNIGHT}</span>
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
      </div>
    </div>
  )
}
