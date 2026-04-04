import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Check, Trophy } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { TopBarShareAction } from '@/components/layout/TopBarShareAction'
import { BottomAction } from '@/components/layout/BottomAction'
import { GroupSection } from '@/components/round/GroupSection'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { ResultsOfficials } from '@/components/standings/ResultsOfficials'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCurrentRoundMatches, getTotalRounds, isRoundComplete } from '@/hooks/useCurrentRound'
import { BYE_PARTICIPANT } from '@/domain/participants'
import type { Participant } from '@/domain/types'
import { useHistoryStore } from '@/store/historyStore'
import { useSettingsStore } from '@/store/settingsStore'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
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
  const [searchParams] = useSearchParams()
  const { tournaments } = useHistoryStore()
  const { ownedTournamentIds } = useSettingsStore()

  const tournament = tournaments.find((t) => t.id === id)

  if (!tournament) {
    navigate('/', { replace: true })
    return null
  }

  const { settings, phases } = tournament
  const useGroups = settings.useGroups
  const totalRounds = getTotalRounds(phases)
  const startDate = formatDate(tournament.createdAt)
  const startTime = formatTime(tournament.createdAt)
  const duration = formatDuration(tournament.createdAt, tournament.finishedAt)
  const roundQuery = searchParams.get('round')
  const parsedRound = Number(roundQuery)
  const hasValidRoundQuery = Number.isFinite(parsedRound) && parsedRound >= 1
  const currentTab = hasValidRoundQuery ? String(parsedRound) : 'stats'
  const currentRound = currentTab === 'stats' ? null : Number(currentTab)
  const roundMatches = currentRound === null ? [] : getCurrentRoundMatches(phases, currentRound)
  const canShareTournament =
    Boolean(tournament.jazzId) &&
    (ownedTournamentIds.includes(tournament.id) || ownedTournamentIds.length === 0)

  const hasPending = phases.some((phase) =>
    phase.groups.some((group) =>
      group.matches.some((m) => m.result === null || m.result === undefined)
    )
  )

  const participants = new Map<string, Participant>()
  participants.set(BYE_PARTICIPANT.id, BYE_PARTICIPANT)
  for (const phase of phases) {
    for (const group of phase.groups) {
      for (const p of group.participants) {
        participants.set(p.id, p)
      }
    }
  }

  function goToTab(value: string) {
    if (value === 'stats') {
      navigate(`/tournament/history/${id}`)
      return
    }
    navigate(`/tournament/history/${id}?round=${value}`)
  }

  return (
    <div>
      <AppShell
        hasBottomAction
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
            title={currentRound === null ? 'Resultados' : `Resultados Ronda ${currentRound}`}
            right={
              canShareTournament ? (
                <TopBarShareAction jazzId={tournament.jazzId} currentRound={currentRound ?? totalRounds} />
              ) : null
            }
          />
        }
      >
        <div className="space-y-6 pb-4">
          {hasPending && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/45 bg-primary/10 px-4 py-3 text-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm font-medium">Hay partidas con resultado pendiente</p>
            </div>
          )}
          <Card size="sm">
            <CardContent className="flex items-center justify-between gap-3">
              <Badge variant="secondary" className="h-7 px-3 text-sm font-semibold">
                {startDate}
              </Badge>
              <div className="flex flex-col items-end text-sm leading-tight">
                <span className="font-medium text-foreground">Inicio {startTime}</span>
                <span className="text-muted-foreground">Duración {duration}</span>
              </div>
            </CardContent>
          </Card>

          {currentRound !== null && (
            <div className="space-y-2">
              {roundMatches.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay partidas en esta ronda.</p>
              ) : (
                roundMatches.map(({ groupName, matches }) => (
                  <GroupSection
                    key={groupName}
                    groupName={groupName}
                    showGroupName={useGroups}
                    matches={matches}
                    participants={participants}
                    onResult={() => {}}
                    readonly
                  />
                ))
              )}
            </div>
          )}

          {currentRound === null &&
            phases.map((phase, phaseIdx) => (
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
                          <CardTitle className="text-base text-primary">Grupo {group.name}</CardTitle>
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
          <ResultsOfficials
            arbitratorName={settings.arbitratorName}
            organizerName={settings.organizerName}
          />
        </div>
      </AppShell>

      <BottomAction>
        <Tabs value={currentTab} onValueChange={goToTab} className="w-full">
          <TabsList variant="line" className="w-full h-auto gap-1 flex-wrap justify-start">
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
              <TabsTrigger key={round} value={String(round)} className="rounded-full min-w-10 shrink-0 gap-1">
                {totalRounds > 4 ? round : currentRound === round ? `Ronda ${round}` : round}
                {isRoundComplete(phases, round) && <Check className="h-3 w-3 text-primary" />}
              </TabsTrigger>
            ))}
            <TabsTrigger value="stats" className="rounded-full shrink-0" aria-label="Estadísticas">
              <Trophy className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </BottomAction>
    </div>
  )
}
