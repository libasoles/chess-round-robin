import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGesture } from '@use-gesture/react'
import { ArrowLeft, Hourglass } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { TopBarShareAction } from '@/components/layout/TopBarShareAction'
import { BottomAction } from '@/components/layout/BottomAction'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { ResultsOfficials } from '@/components/standings/ResultsOfficials'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useTournamentStore } from '@/store/tournamentStore'
import { useHistoryStore } from '@/store/historyStore'
import { useSettingsStore } from '@/store/settingsStore'
import { getTotalRounds } from '@/hooks/useCurrentRound'

export function StandingsPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [hydrated, setHydrated] = useState(() => useTournamentStore.persist.hasHydrated())
  const { activeTournament, setCurrentRound, createNewPhase, finishTournament } =
    useTournamentStore()
  const { addToHistory } = useHistoryStore()
  const { addToParticipantsPool } = useSettingsStore()

  const [showFinishDialog, setShowFinishDialog] = useState(false)

  useEffect(() => {
    const unsub = useTournamentStore.persist.onFinishHydration(() => setHydrated(true))
    // Check again after subscribing to catch hydration that completed between render and effect
    if (useTournamentStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  useEffect(() => {
    if (hydrated && !activeTournament) {
      navigate('/', { replace: true })
    }
  }, [hydrated, activeTournament, navigate])

  if (!hydrated || !activeTournament) return null

  const { settings, phases } = activeTournament
  const useGroups = settings.useGroups
  const hasPendingMatches = phases.some((phase) =>
    phase.groups.some((group) => group.matches.some((match) => match.result === null)),
  )

  // Collect all participants across all phases for the advance selector
  const allParticipants = new Map<string, string>()
  for (const phase of phases) {
    for (const group of phase.groups) {
      for (const p of group.participants) {
        if (!p.isBye) allParticipants.set(p.id, p.name)
      }
    }
  }

  // Default: all real participants selected
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(allParticipants.keys()),
  )

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleNewPhase() {
    createNewPhase([...selectedIds])
    const totalRounds = getTotalRounds(activeTournament!.phases)
    setCurrentRound(totalRounds + 1)
    navigate(`/tournament/${id}/round/${totalRounds + 1}`)
  }

  function handleFinish() {
    finishTournament((finished) => {
      addToHistory(finished)
      // Add all participant names to the pool
      const names = [...allParticipants.values()]
      addToParticipantsPool(names)
    })
    navigate('/')
  }

  function goBack() {
    const total = getTotalRounds(phases)
    setCurrentRound(total)
    navigate(`/tournament/${id}/round/${total}`)
  }

  const bind = useGesture({
    onDrag: ({ swipe: [swipeX] }) => {
      if (swipeX === 1) goBack()
    },
  })

  const isActive = activeTournament.status === 'active'
  return (
    <div>
      <AppShell
        mainProps={bind()}
        topBar={
          <TopBar
            left={
              <button
                type="button"
                onClick={goBack}
                className="p-2 -ml-2 text-foreground"
                aria-label="Volver"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            }
            title={hasPendingMatches ? 'Resultados provisorios' : 'Resultados'}
            right={<TopBarShareAction jazzId={activeTournament.jazzId} currentRound={getTotalRounds(activeTournament.phases)} />}
          />
        }
        hasBottomAction={isActive}
      >
        <div className="space-y-6 pb-4">
          {hasPendingMatches && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/45 bg-primary/10 px-4 py-3 text-foreground">
              <Hourglass className="h-4 w-4 shrink-0 text-primary motion-safe:animate-[hourglass-flip_3.2s_ease-in-out_infinite]" />
              <p className="text-sm font-medium">Hay partidas con resultado pendiente</p>
            </div>
          )}
          {phases.map((phase, phaseIdx) => (
            <div key={phaseIdx}>
              {phases.length > 1 && (
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Fase {phaseIdx + 1}
                </h2>
              )}
              <div className="space-y-4">
                {phase.groups.map((group) => {
                  const hasPendingInGroup = group.matches.some((match) => match.result === null)
                  return (
                    <Card key={group.name}>
                    {useGroups && (
                      <CardHeader>
                        <CardTitle className="flex w-full items-center justify-between text-base text-primary">
                          <span>Grupo {group.name}</span>
                          {hasPendingInGroup && (
                            <Hourglass className="h-4 w-4 shrink-0 text-primary" />
                          )}
                        </CardTitle>
                      </CardHeader>
                    )}
                    <CardContent>
                      <StandingsTable
                        group={group}
                        settings={settings}
                        showAdvanceSelector={useGroups && isActive && !hasPendingMatches}
                        selectedIds={selectedIds}
                        onToggleAdvance={toggleSelect}
                      />
                    </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
          <ResultsOfficials
            arbitratorName={settings.arbitratorName}
            organizerName={settings.organizerName}
          />
        </div>
      </AppShell>

      {isActive && (
        <BottomAction>
          <div className="flex flex-col gap-2">
            {useGroups && !hasPendingMatches && (
              <Button
                variant="outline"
                className="w-full h-12 text-base"
                onClick={handleNewPhase}
                disabled={selectedIds.size < 2}
              >
                Nueva Fase
              </Button>
            )}
            <Button
              className="w-full h-12 text-base"
              onClick={() => {
                if (hasPendingMatches) {
                  setShowFinishDialog(true)
                } else {
                  handleFinish()
                }
              }}
            >
              Terminar torneo
            </Button>
          </div>
        </BottomAction>
      )}

      <Dialog open={hasPendingMatches && showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Terminar el torneo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se guardarán los resultados provisorios y ya no podrán editarse.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinishDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFinish}>Terminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
