import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHistoryStore } from '@/store/historyStore'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDuration(startIso: string, endIso?: string): string {
  if (!endIso) return 'En curso'
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  const ms = Math.max(0, end - start)
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

export function TournamentResultsPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { tournaments } = useHistoryStore()

  const tournament = tournaments.find((t) => t.id === id)

  if (!tournament) {
    navigate('/', { replace: true })
    return null
  }

  const { settings, phases } = tournament
  const useGroups = settings.useGroups
  const startTime = formatTime(tournament.createdAt)
  const duration = formatDuration(tournament.createdAt, tournament.finishedAt)

  const hasPending = phases.some((phase) =>
    phase.groups.some((group) =>
      group.matches.some((m) => m.result === null || m.result === undefined)
    )
  )

  return (
    <AppShell
      topBar={
        <TopBar
          left={
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 -ml-2 text-foreground"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          }
          title="Resultados"
        />
      }
    >
      <div className="space-y-6 pb-4">
        {hasPending && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/15 border border-primary/40 px-4 py-3 text-primary">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-sm font-medium">Hay partidas con resultado pendiente</p>
          </div>
        )}
        <Card size="sm">
          <CardContent className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="h-7 px-3 text-sm font-semibold">
              Inicio {startTime}
            </Badge>
            <span className="text-sm text-muted-foreground">Duración {duration}</span>
          </CardContent>
        </Card>

        {phases.map((phase, phaseIdx) => (
          <div key={phaseIdx}>
            {phases.length > 1 && (
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Fase {phaseIdx + 1}
              </h2>
            )}
            <div className="space-y-4">
              {phase.groups.map((group) => (
                <Card key={group.name}>
                  {useGroups && (
                    <CardHeader>
                      <CardTitle className="text-base">Grupo {group.name}</CardTitle>
                    </CardHeader>
                  )}
                  <CardContent>
                    <StandingsTable group={group} settings={settings} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
