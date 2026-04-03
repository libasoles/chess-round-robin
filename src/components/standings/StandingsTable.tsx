import { Check } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { Group, StandingEntry, TiebreakMethod, TournamentSettings } from '@/domain/types'
import { computeRankedStandings } from '@/domain/tiebreaks'

interface StandingsTableProps {
  group: Group
  settings: TournamentSettings
  showAdvanceSelector?: boolean
  selectedIds?: Set<string>
  onToggleAdvance?: (id: string) => void
}

function ordinal(rank: number): string {
  return `${rank}°`
}

export function StandingsTable({
  group,
  settings,
  showAdvanceSelector = false,
  selectedIds,
  onToggleAdvance,
}: StandingsTableProps) {
  const entries = computeRankedStandings(group, settings)

  // Non-DE tiebreak columns to show
  const tiebreakCols = settings.tiebreakOrder.filter((m): m is Exclude<TiebreakMethod, 'DE'> => m !== 'DE')

  // Build participant name lookup
  const nameMap = new Map(group.participants.map((p) => [p.id, p.name]))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="text-muted-foreground border-b border-border">
            {showAdvanceSelector && <th className="w-8 pb-2 text-left" />}
            <th className="text-left pb-2 font-medium">Nombre</th>
            <th className="w-12 text-center pb-2 font-medium">Pts</th>
            {tiebreakCols.map((m) => (
              <th key={m} className="w-12 text-center pb-2 font-medium">
                {m}
              </th>
            ))}
            <th className="w-12 text-right pb-2 font-medium">Pos.</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry: StandingEntry) => {
            const name = nameMap.get(entry.participantId) ?? entry.participantId
            const isSelected = selectedIds?.has(entry.participantId) ?? false

            return (
              <tr key={entry.participantId} className="border-b border-border last:border-0">
                {showAdvanceSelector && (
                  <td className="py-2 pr-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleAdvance?.(entry.participantId)}
                    />
                  </td>
                )}
                <td className="py-2 font-medium truncate text-chart-3">{name}</td>
                <td className="py-2 text-center">
                  {entry.points % 1 === 0 ? entry.points : entry.points.toFixed(1)}
                </td>
                {tiebreakCols.map((m) => {
                  const score = entry.tiebreakScores[m]
                  const isDeciding = entry.tiebreakUsed === m
                  if (m === 'SB') {
                    return (
                      <td key={m} className="py-2 text-center">
                        {score !== undefined && score > 0 ? (
                          <Check className={`h-4 w-4 mx-auto${isDeciding ? ' text-primary' : ' text-muted-foreground'}`} />
                        ) : null}
                      </td>
                    )
                  }
                  return (
                    <td key={m} className={`py-2 text-center${isDeciding ? ' font-semibold text-foreground' : ' text-muted-foreground'}`}>
                      {score !== undefined
                        ? (score % 1 === 0 ? score : score.toFixed(1))
                        : null}
                      {isDeciding && <span className="ml-0.5 text-primary">✓</span>}
                    </td>
                  )
                })}
                <td className="py-2 text-right text-muted-foreground">
                  {ordinal(entry.rank)}
                  {entry.tiebreakUsed === 'DE' && (
                    <span className="ml-1 text-xs font-medium text-primary">DE</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
