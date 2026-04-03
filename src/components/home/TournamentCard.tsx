import type { Tournament } from '@/domain/types'
import { computeRankedStandings } from '@/domain/tiebreaks'

interface TournamentCardProps {
  tournament: Tournament
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

function getRoundCount(tournament: Tournament): number {
  let max = 0
  for (const phase of tournament.phases) {
    for (const group of phase.groups) {
      for (const match of group.matches) {
        if (match.round > max) max = match.round
      }
    }
  }
  return max
}

function getWinners(tournament: Tournament): string[] {
  const lastPhase = tournament.phases[tournament.phases.length - 1]
  if (!lastPhase) return []

  const winners: string[] = []
  for (const group of lastPhase.groups) {
    const entries = computeRankedStandings(group, tournament.settings)
    const firstPlace = entries.filter((e) => e.rank === 1)
    const nameMap = new Map(group.participants.map((p) => [p.id, p.name]))
    for (const e of firstPlace) {
      const name = nameMap.get(e.participantId)
      if (name) winners.push(name)
    }
  }
  return winners
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const rounds = getRoundCount(tournament)
  const phases = tournament.phases.length
  const winners = getWinners(tournament)

  const date = tournament.finishedAt ?? tournament.createdAt

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
      <p className="text-sm font-semibold">{formatDate(date)}</p>
      <p className="text-sm text-muted-foreground">
        {rounds} {rounds === 1 ? 'ronda' : 'rondas'}
        {phases > 1 && ` · ${phases} fases`}
      </p>
      {winners.length > 0 && (
        <p className="text-sm">
          {winners.length === 1 ? 'Ganó' : 'Ganaron'}{' '}
          <span className="font-medium">{winners.join(' y ')}</span>
        </p>
      )}
    </div>
  )
}
