import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { BottomAction } from '@/components/layout/BottomAction'
import { TournamentCard } from '@/components/home/TournamentCard'
import { EmptyHistory } from '@/components/home/EmptyHistory'
import { Button } from '@/components/ui/button'
import { useHistoryStore } from '@/store/historyStore'
import { useTournamentStore } from '@/store/tournamentStore'
import { getTotalRounds } from '@/hooks/useCurrentRound'

export function HomePage() {
  const navigate = useNavigate()
  const { tournaments } = useHistoryStore()
  const { activeTournament, currentRound } = useTournamentStore()

  function resumeTournament() {
    navigate(`/tournament/round/${currentRound}`)
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
            <button
              type="button"
              onClick={resumeTournament}
              className="w-full rounded-lg border border-primary bg-primary/5 px-4 py-3 text-left space-y-0.5 hover:bg-primary/10 transition-colors"
            >
              <p className="text-sm font-semibold text-primary">▶ Torneo en curso</p>
              <p className="text-xs text-muted-foreground">
                Ronda {currentRound} de {getTotalRounds(activeTournament.phases)} · Continuar →
              </p>
            </button>
          )}

          {tournaments.length === 0 && !activeTournament ? (
            <EmptyHistory />
          ) : (
            <div className="space-y-2">
              {tournaments.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
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
