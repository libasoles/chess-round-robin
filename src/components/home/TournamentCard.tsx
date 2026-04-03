import type { Tournament } from '@/domain/types'
import { computeRankedStandings } from '@/domain/tiebreaks'
import { Badge } from '@/components/ui/badge'

interface TournamentCardProps {
  tournament: Tournament
  onClick?: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDateAndTimeParts(startIso: string, endIso?: string): { date: string; time: string } {
  const startDate = formatDate(startIso)
  const startTime = formatTime(startIso)

  if (!endIso) return { date: startDate, time: `Inicio ${startTime} · En curso` }

  return { date: startDate, time: `Inicio ${startTime}` }
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

export function TournamentCard({ tournament, onClick }: TournamentCardProps) {
  const rounds = getRoundCount(tournament)
  const phases = tournament.phases.length
  const winners = getWinners(tournament)
  const dateTime = formatDateAndTimeParts(tournament.createdAt, tournament.finishedAt)

  return (
    <div
      className={`rounded-lg border border-border bg-card px-4 py-3 space-y-1${onClick ? ' cursor-pointer hover:bg-accent transition-colors' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="h-7 px-3 text-sm font-semibold">
          {dateTime.date}
        </Badge>
        <span className="text-sm text-muted-foreground">{dateTime.time}</span>
      </div>
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
