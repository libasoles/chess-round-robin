import { Check } from 'lucide-react'
import { useState } from 'react'
import { ParticipantName } from '@/components/participants/ParticipantName'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TIEBREAK_INFO } from '@/domain/tiebreakInfo'
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
          results.push({ label: TIEBREAK_INFO.DE.name, reason: 'La partida no tiene un resultado registrado.' })
        } else if (match.result === 'draw') {
          results.push({ label: TIEBREAK_INFO.DE.name, reason: 'su partida enfrentada terminó en tablas.' })
        } else {
          // This shouldn't happen in an unresolved tie, but be safe
          results.push({ label: TIEBREAK_INFO.DE.name, reason: 'su partida enfrentada tiene resultado decisivo.' })
        }
      } else {
        // 3+ players: explain multi-way DE logic
        results.push({
          label: TIEBREAK_INFO.DE.name,
          reason: `los ${tiedIds.length} jugadores quedan igualados al considerar sus partidas mutuas.`,
        })
      }
    } else if (method === 'TN') {
      results.push({
        label: TIEBREAK_INFO.TN.name,
        reason: 'quedan igualados al considerar el resultado directo y las tablas con piezas negras.',
      })
    } else if (method === 'SB') {
      results.push({
        label: TIEBREAK_INFO.SB.name,
        reason: 'tienen la misma puntuación considerando calidad de rivales vencidos.',
      })
    } else if (method === 'Buchholz') {
      results.push({
        label: TIEBREAK_INFO.Buchholz.name,
        reason: 'tienen la misma puntuación acumulada de rivales enfrentados.',
      })
    } else if (method === 'PN') {
      results.push({
        label: TIEBREAK_INFO.PN.name,
        reason: 'todos tienen el mismo número de victorias jugando con negras.',
      })
    } else if (method === 'Koya') {
      results.push({
        label: TIEBREAK_INFO.Koya.name,
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
}

function ordinal(rank: number): string {
  return `${rank}°`
}

function formatScore(score: number): string {
  return score % 1 === 0 ? String(score) : score.toFixed(1)
}

function TiebreakHeaderButton({
  method,
  onClick,
}: {
  method: TiebreakMethod
  onClick: (method: TiebreakMethod) => void
}) {
  const info = TIEBREAK_INFO[method]

  return (
    <button
      type="button"
      onClick={() => onClick(method)}
      className="mx-auto inline-flex h-6 min-w-6 items-center justify-center rounded px-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`Ver explicación de ${info.name}`}
    >
      {info.shortLabel}
    </button>
  )
}

function TiebreakCheckButton({
  method,
  onClick,
}: {
  method: TiebreakMethod
  onClick: (method: TiebreakMethod) => void
}) {
  const info = TIEBREAK_INFO[method]

  return (
    <button
      type="button"
      onClick={() => onClick(method)}
      className="mx-auto inline-flex size-6 items-center justify-center rounded text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`Ver explicación de ${info.name}`}
    >
      <Check className="h-4 w-4" />
    </button>
  )
}

export function StandingsTable({
  group,
  settings,
}: StandingsTableProps) {
  const [selectedTiebreak, setSelectedTiebreak] = useState<TiebreakMethod | null>(null)
  const entries = computeRankedStandings(group, settings)
  const selectedTiebreakInfo = selectedTiebreak ? TIEBREAK_INFO[selectedTiebreak] : null

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
            <th className="text-left pb-2 font-medium">Nombre</th>
            <th className="w-12 text-center pb-2 font-medium">Pts</th>
            {tiebreakCols.map((m) => (
              <th key={m} className="w-12 text-center pb-2 font-medium">
                <TiebreakHeaderButton method={m} onClick={setSelectedTiebreak} />
              </th>
            ))}
            <th className="w-12 text-right pb-2 font-medium">Pos.</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry: StandingEntry) => {
            const name = nameMap.get(entry.participantId) ?? entry.participantId

            return (
              <tr key={entry.participantId} className="border-b border-border last:border-0">
                <td className="py-2 wrap-break-word">
                  <ParticipantName>{name}</ParticipantName>
                </td>
                <td className="py-2 text-center">
                  {formatScore(entry.points)}
                </td>
                {tiebreakCols.map((m) => {
                  const isDeciding = entry.tiebreakUsed === m

                  if (m === 'DE' || m === 'TN') {
                    return (
                      <td key={m} className="py-2 text-center">
                        {isDeciding ? (
                          <TiebreakCheckButton method={m} onClick={setSelectedTiebreak} />
                        ) : null}
                      </td>
                    )
                  }

                  const score = entry.tiebreakScores[m]

                  if (m === 'Koya') {
                    return (
                      <td key={m} className={`py-2 text-center${isDeciding ? ' font-semibold text-foreground' : ' text-muted-foreground'}`}>
                        {score !== undefined ? formatScore(score) : null}
                        {isDeciding ? (
                          <span className="ml-0.5 inline-flex align-middle">
                            <TiebreakCheckButton method={m} onClick={setSelectedTiebreak} />
                          </span>
                        ) : null}
                      </td>
                    )
                  }

                  if (m === 'SB' || m === 'PN' || m === 'Buchholz') {
                    return (
                      <td key={m} className="py-2 text-center">
                        {isDeciding ? (
                          <TiebreakCheckButton method={m} onClick={setSelectedTiebreak} />
                        ) : null}
                      </td>
                    )
                  }

                  return (
                    <td key={m} className={`py-2 text-center${isDeciding ? ' font-semibold text-foreground' : ' text-muted-foreground'}`}>
                      {score !== undefined ? formatScore(score) : null}
                      {isDeciding ? (
                        <span className="ml-0.5 inline-flex align-middle">
                          <TiebreakCheckButton method={m} onClick={setSelectedTiebreak} />
                        </span>
                      ) : null}
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
      <Dialog
        open={selectedTiebreak !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTiebreak(null)
        }}
      >
        <DialogContent>
          {selectedTiebreakInfo ? (
            <DialogHeader>
              <DialogTitle>
                {selectedTiebreakInfo.shortLabel} - {selectedTiebreakInfo.name}
              </DialogTitle>
              <DialogDescription>
                {selectedTiebreakInfo.description}
              </DialogDescription>
            </DialogHeader>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
