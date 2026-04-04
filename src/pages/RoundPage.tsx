import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGesture } from '@use-gesture/react'
import { Check } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { TopBarShareAction } from '@/components/layout/TopBarShareAction'
import { BottomAction } from '@/components/layout/BottomAction'
import { GroupSection } from '@/components/round/GroupSection'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTournamentStore } from '@/store/tournamentStore'
import { getCurrentRoundMatches, getTotalRounds, isRoundComplete } from '@/hooks/useCurrentRound'
import type { MatchResult, Participant } from '@/domain/types'
import { BYE_PARTICIPANT } from '@/domain/participants'

export function RoundPage() {
  const navigate = useNavigate()
  const { id, round: roundParam } = useParams<{ id: string; round: string }>()
  const [hydrated, setHydrated] = useState(() => useTournamentStore.persist.hasHydrated())
  const { activeTournament, setCurrentRound, recordResult, clearResult } = useTournamentStore()

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

  const currentRound = Number(roundParam) || 1
  const totalRounds = getTotalRounds(activeTournament.phases)
  const isFirstRound = currentRound === 1
  const isLastRound = currentRound === totalRounds

  const roundMatches = getCurrentRoundMatches(activeTournament.phases, currentRound)
  const title =
    activeTournament.status === 'finished'
      ? `Resultados Ronda ${currentRound}`
      : `Ronda ${currentRound}`

  // Build participant lookup map across all phases
  const participants = new Map<string, Participant>()
  participants.set(BYE_PARTICIPANT.id, BYE_PARTICIPANT)
  for (const phase of activeTournament.phases) {
    for (const group of phase.groups) {
      for (const p of group.participants) {
        participants.set(p.id, p)
      }
    }
  }

  function goToRound(round: number) {
    setCurrentRound(round)
    navigate(`/tournament/${id}/round/${round}`, { replace: true })
  }

  function goNext() {
    if (!isLastRound) goToRound(currentRound + 1)
    else navigate(`/tournament/${id}/standings`)
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

  return (
    <div>
      <AppShell
        mainProps={bind()}
        topBar={
          <TopBar
            title={title}
            right={<TopBarShareAction />}
          />
        }
        hasBottomAction
      >
        <div className="space-y-2">
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

      <BottomAction>
        <Tabs
            value={String(currentRound)}
            onValueChange={(val) => {
              if (val === 'fin') {
                navigate(`/tournament/${id}/standings`)
              } else {
                goToRound(Number(val))
              }
            }}
            className="w-full"
          >
            <TabsList
              variant="line"
              className="w-full h-auto gap-1 flex-wrap justify-start"
            >
              {Array.from({ length: totalRounds }, (_, i) => i + 1).map((r) => {
                const done = isRoundComplete(activeTournament.phases, r)
                const triggerLabel = totalRounds > 4 ? r : (r === currentRound ? `Ronda ${r}` : r)
                const isDenseModeCurrent = totalRounds > 4 && r === currentRound
                return (
                  <TabsTrigger
                    key={r}
                    value={String(r)}
                    className={`rounded-full min-w-10 shrink-0 gap-1 ${isDenseModeCurrent ? 'font-bold text-base' : ''}`}
                  >
                    {triggerLabel}
                    {done && <Check className="h-3 w-3 text-primary" />}
                  </TabsTrigger>
                )
              })}
              <TabsTrigger value="fin" className="rounded-full shrink-0">
                Fin
              </TabsTrigger>
            </TabsList>
          </Tabs>
      </BottomAction>
    </div>
  )
}
