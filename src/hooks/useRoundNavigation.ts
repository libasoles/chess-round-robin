import { useNavigate } from 'react-router-dom'
import { useTournamentStore } from '@/store/tournamentStore'
import { getTotalRounds } from './useCurrentRound'

export function useRoundNavigation() {
  const navigate = useNavigate()
  const { activeTournament, currentRound, setCurrentRound } = useTournamentStore()

  const totalRounds = activeTournament ? getTotalRounds(activeTournament.phases) : 0
  const isFirstRound = currentRound === 1
  const isLastRound = currentRound === totalRounds

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

  return { currentRound, totalRounds, isFirstRound, isLastRound, goToRound, goNext, goPrev }
}
