import { Check } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ParticipantName } from '@/components/participants/ParticipantName'
import type { Group, StandingEntry, TiebreakMethod, TournamentSettings } from '@/domain/types'
import { computeRankedStandings } from '@/domain/tiebreaks'
import { formatNameList } from '@/lib/formatNameList'

type TiebreakReason = { label: string; reason: string }

function explainUnresolvedTie(
  tiedIds: string[],
  group: Group,
  settings: TournamentSettings,
): TiebreakReason[] {
  if (settings.tiebreakOrder.length === 0) {
    return [{ label: '', reason: 'Sin criterios de desempate configurados.' }]
  }

  const results: TiebreakReason[] = []

  for (const method of settings.tiebreakOrder) {
    if (method === 'DE') {
      if (tiedIds.length === 2) {
        const [a, b] = tiedIds
        const match = group.matches.find(
          m => (m.white === a && m.black === b) || (m.white === b && m.black === a),
        )
        if (!match || match.result === null) {
          results.push({ label: 'Encuentro Directo', reason: 'la partida entre estos jugadores aún no se jugó.' })
        } else if (match.result === 'draw') {
          results.push({ label: 'Encuentro Directo', reason: 'su partida enfrentada terminó en tablas.' })
        } else {
          // This shouldn't happen in an unresolved tie, but be safe
          results.push({ label: 'Encuentro Directo', reason: 'su partida enfrentada tiene resultado decisivo.' })
        }
      } else {
        // 3+ players: explain multi-way DE logic
        results.push({
          label: 'Encuentro Directo',
          reason: `los ${tiedIds.length} jugadores quedan igualados al considerar sus partidas mutuas.`,
        })
      }
    } else if (method === 'SB') {
      results.push({
        label: 'Sonneborn-Berger',
        reason: 'tienen la misma puntuación considerando calidad de rivales vencidos.',
      })
    } else if (method === 'Buchholz') {
      results.push({
        label: 'Buchholz',
        reason: 'tienen la misma puntuación acumulada de rivales enfrentados.',
      })
    } else if (method === 'PN') {
      results.push({
        label: 'Partidas con Negras',
        reason: 'todos tienen el mismo número de victorias jugando con negras.',
      })
    } else if (method === 'Koya') {
      results.push({
        label: 'Sistema Koya',
        reason: 'tienen la misma puntuación contra rivales clasificados (≥50% puntos).',
      })
    } else {
      // Unknown method
      results.push({ label: method, reason: 'puntaje igual.' })
    }
  }

  return results
}

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

  // Only show tiebreak columns for methods that actually resolved at least one tie
  const usedTiebreaks = new Set(entries.map(e => e.tiebreakUsed).filter((m): m is TiebreakMethod => m !== null))
  const tiebreakCols = settings.tiebreakOrder.filter(m => usedTiebreaks.has(m))

  // Build participant name lookup
  const nameMap = new Map(group.participants.map((p) => [p.id, p.name]))

  // Detect unresolved ties: groups of 2+ players sharing the same rank
  const rankGroups = new Map<number, StandingEntry[]>()
  for (const entry of entries) {
    const group_ = rankGroups.get(entry.rank) ?? []
    group_.push(entry)
    rankGroups.set(entry.rank, group_)
  }
  const unresolvedTies = [...rankGroups.values()].filter(g => g.length > 1)

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
                <td className="py-2 wrap-break-word">
                  <ParticipantName>{name}</ParticipantName>
                </td>
                <td className="py-2 text-center">
                  {entry.points % 1 === 0 ? entry.points : entry.points.toFixed(1)}
                </td>
                {tiebreakCols.map((m) => {
                  if (m === 'DE') {
                    return (
                      <td key="DE" className="py-2 text-center">
                        {entry.tiebreakUsed === 'DE' && (
                          <Check className="h-4 w-4 mx-auto text-primary" />
                        )}
                      </td>
                    )
                  }
                  const score = entry.tiebreakScores[m]
                  const isDeciding = entry.tiebreakUsed === m
                  if (m === 'SB') {
                    return (
                      <td key={m} className="py-2 text-center">
                        {isDeciding ? (
                          <Check className="h-4 w-4 mx-auto text-primary" />
                        ) : null}
                      </td>
                    )
                  }
                  if (m === 'PN') {
                    return (
                      <td key={m} className="py-2 text-center">
                        {isDeciding ? (
                          <Check className="h-4 w-4 mx-auto text-primary" />
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
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {unresolvedTies.map(tiedEntries => {
        const tiedIds = tiedEntries.map(e => e.participantId)
        const names = formatNameList(tiedIds.map(id => nameMap.get(id) ?? id))
        const reasons = explainUnresolvedTie(tiedIds, group, settings)
        return (
          <div key={tiedIds.join(',')} className="mt-3 rounded-md bg-[--surface-sunken] py-2 text-xs text-muted-foreground leading-snug space-y-1">
            <p className="font-medium text-foreground">Empate sin resolver entre {names}</p>
            {reasons.map((r, i) => (
              <p key={i}>
                {r.label && <span className="text-chart-2 font-medium">{r.label}:</span>} {r.reason}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  )
}
