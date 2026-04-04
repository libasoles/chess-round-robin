import type { Tournament } from '@/domain/types'
import { computeRankedStandings } from '@/domain/tiebreaks'
import { ParticipantName } from '@/components/participants/ParticipantName'
import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Trophy, Share2, Copy, Check, Trash } from 'lucide-react'

interface TournamentCardProps {
  tournament: Tournament
  onClick?: () => void
  canShare?: boolean
  onDelete?: () => void
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

  if (!endIso) return { date: startDate, time: `Inicio ${startTime} hs · En curso` }

  return { date: startDate, time: `Inicio ${startTime} hs` }
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

export function TournamentCard({ tournament, onClick, canShare = false, onDelete }: TournamentCardProps) {
  const [copied, setCopied] = useState(false)
  const rounds = getRoundCount(tournament)
  const phases = tournament.phases.length
  const winners = getWinners(tournament)
  const dateTime = formatDateAndTimeParts(tournament.createdAt, tournament.finishedAt)
  const canShareNative = typeof navigator.share !== 'undefined'
  const shareUrl = tournament.jazzId ? `${window.location.origin}/t/${tournament.jazzId}/standings` : ''

  function handleShare(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (!shareUrl) return

    if (canShareNative) {
      navigator.share({ title: 'Resultados del torneo', url: shareUrl }).catch(() => {})
      return
    }

    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div
      className={`rounded-lg border border-border bg-card px-4 py-3 space-y-1${onClick ? ' cursor-pointer hover:bg-muted transition-colors' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{dateTime.date}</span>
          <span className="text-sm text-muted-foreground">{dateTime.time}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {canShare && tournament.jazzId && (
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 text-blue-800/80 hover:text-blue-800 dark:text-blue-300/85 dark:hover:text-blue-300"
              aria-label="Compartir"
            >
              {copied ? <Check className="h-4 w-4" /> : canShareNative ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-1.5 -mr-1.5 text-muted-foreground hover:text-destructive"
              aria-label="Eliminar torneo"
            >
              <Trash className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {rounds} {rounds === 1 ? 'ronda' : 'rondas'}
        {phases > 1 && ` · ${phases} fases`}
      </p>
      {winners.length > 0 && (
        <p className="text-sm flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-primary shrink-0" />
          {winners.length === 1 ? 'Ganó' : 'Ganaron'}{' '}
          <ParticipantName>{winners.join(' y ')}</ParticipantName>
        </p>
      )}
    </div>
  )
}
