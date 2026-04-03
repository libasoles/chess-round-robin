import { useNavigate } from 'react-router-dom'
import { useGesture } from '@use-gesture/react'
import { Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { GroupSection } from '@/components/round/GroupSection'
import { useTournamentStore } from '@/store/tournamentStore'
import { getCurrentRoundMatches, getTotalRounds } from '@/hooks/useCurrentRound'
import type { MatchResult, Participant } from '@/domain/types'

export function RoundPage() {
  const navigate = useNavigate()
  const { activeTournament, currentRound, setCurrentRound, recordResult, clearResult } =
    useTournamentStore()

  if (!activeTournament) {
    navigate('/', { replace: true })
    return null
  }

  const totalRounds = getTotalRounds(activeTournament.phases)
  const isFirstRound = currentRound === 1
  const isLastRound = currentRound === totalRounds

  const roundMatches = getCurrentRoundMatches(activeTournament.phases, currentRound)

  // Build participant lookup map across all phases
  const participants = new Map<string, Participant>()
  for (const phase of activeTournament.phases) {
    for (const group of phase.groups) {
      for (const p of group.participants) {
        participants.set(p.id, p)
      }
    }
  }

  function goToRound(round: number) {
    setCurrentRound(round)
    navigate(`/tournament/round/${round}`, { replace: true })
  }

  function goNext() {
    if (isLastRound) {
      navigate('/tournament/standings')
    } else {
      goToRound(currentRound + 1)
    }
  }

  function goPrev() {
    if (!isFirstRound) goToRound(currentRound - 1)
  }

  function handleResult(matchId: string, result: MatchResult | null) {
    if (result === null) {
      clearResult(matchId)
    } else {
      recordResult(matchId, result)
    }
  }

  // Swipe gesture
  const bind = useGesture({
    onDrag: ({ swipe: [swipeX] }) => {
      if (swipeX === -1) goNext()
      else if (swipeX === 1) goPrev()
    },
  })

  const canShare = typeof navigator.share !== 'undefined'

  return (
    <div {...bind()} style={{ touchAction: 'pan-y' }}>
      <AppShell
        topBar={
          <TopBar
            right={
              <div className="flex flex-col items-end gap-1">
                {canShare && (
                  <button
                    type="button"
                    onClick={() =>
                      navigator.share({ title: 'Torneo de ajedrez', url: window.location.href })
                    }
                    className="p-2 text-muted-foreground hover:text-foreground"
                    aria-label="Compartir"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                )}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={isFirstRound}
                    className="p-2 text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Ronda anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="p-2 text-foreground"
                    aria-label={isLastRound ? 'Ver resultados' : 'Siguiente ronda'}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            }
          />
        }
      >
        <div className="space-y-2">
          <h1 className="text-lg font-semibold mb-4">Ronda {currentRound}</h1>

          {roundMatches.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay partidas en esta ronda.</p>
          ) : (
            roundMatches.map(({ groupName, matches }) => (
              <GroupSection
                key={groupName}
                groupName={groupName}
                showGroupName={activeTournament.settings.useGroups}
                matches={matches}
                participants={participants}
                onResult={handleResult}
              />
            ))
          )}
        </div>
      </AppShell>
    </div>
  )
}
