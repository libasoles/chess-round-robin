import { useNavigate } from 'react-router-dom'
import { Settings, ArrowRight, Play } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { BottomAction } from '@/components/layout/BottomAction'
import { TournamentCard } from '@/components/home/TournamentCard'
import { EmptyHistory } from '@/components/home/EmptyHistory'
import { Button } from '@/components/ui/button'
import { useHistoryStore } from '@/store/historyStore'
import { useTournamentStore } from '@/store/tournamentStore'
import { getTotalRounds, isRoundComplete } from '@/hooks/useCurrentRound'

export function HomePage() {
  const navigate = useNavigate()
  const { tournaments } = useHistoryStore()
  const { activeTournament, currentRound, setCurrentRound } = useTournamentStore()

  const totalRounds = activeTournament ? getTotalRounds(activeTournament.phases) : 0
  const displayRound = activeTournament
    ? (Array.from({ length: totalRounds }, (_, i) => i + 1).find(
        (r) => !isRoundComplete(activeTournament.phases, r),
      ) ?? totalRounds)
    : currentRound

  function resumeTournament() {
    setCurrentRound(displayRound)
    navigate(`/tournament/${activeTournament.id}/round/${displayRound}`)
  }

  return (
    <>
      <AppShell
        topBar={
          <TopBar
            right={
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="p-2 text-muted-foreground hover:text-foreground"
                aria-label="Configuración"
              >
                <Settings className="h-5 w-5" />
              </button>
            }
          />
        }
        hasBottomAction
      >
        <div className="space-y-3">
          {activeTournament && (
            <div className="rounded-lg border border-primary bg-primary/5 px-4 py-3 space-y-2">
              <p
                className="text-sm font-semibold text-primary flex items-center gap-1.5 cursor-pointer"
                onClick={resumeTournament}
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Torneo en curso
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Ronda {displayRound} de {getTotalRounds(activeTournament.phases)}
                </p>
                <Button size="sm" onClick={resumeTournament} className="gap-1.5 shrink-0">
                  Continuar
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {tournaments.length === 0 && !activeTournament ? (
            <EmptyHistory />
          ) : (
            <div className="space-y-2">
              {tournaments.map((t) => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  onClick={() => navigate(`/tournament/history/${t.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </AppShell>

      <BottomAction>
        <Button className="w-full h-12 text-base" onClick={() => navigate('/tournament/new')}>
          Nuevo Torneo
        </Button>
      </BottomAction>
    </>
  )
}
