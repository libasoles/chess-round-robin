import { useNavigate, useParams } from 'react-router-dom'
import { useCoState } from 'jazz-tools/react'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { ResultsOfficials } from '@/components/standings/ResultsOfficials'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JazzTournament } from '@/lib/jazz'
import { jazzTournamentToDomain } from '@/lib/jazzConvert'
import { getTotalRounds } from '@/hooks/useCurrentRound'

const DEEP_RESOLVE = {
  settings: true,
  phases: { $each: { groups: { $each: { participants: { $each: true }, matches: { $each: true } } } } },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

export function SharedStandingsPage() {
  const navigate = useNavigate()
  const { jazzId } = useParams<{ jazzId: string }>()

  const jazzTournament = useCoState(JazzTournament, jazzId, { resolve: DEEP_RESOLVE })
  const tournament = jazzTournamentToDomain(jazzTournament)

  if (!jazzTournament) {
    return (
      <AppShell topBar={<TopBar title="Cargando…" />}>
        <p className="text-muted-foreground text-sm text-center pt-8">Cargando torneo…</p>
      </AppShell>
    )
  }

  if (!tournament) {
    return (
      <AppShell topBar={<TopBar title="No disponible" />}>
        <p className="text-muted-foreground text-sm text-center pt-8">
          Este torneo no está disponible o el link es incorrecto.
        </p>
      </AppShell>
    )
  }

  const { settings, phases } = tournament
  const lastRound = getTotalRounds(phases)

  function goBack() {
    navigate(`/t/${jazzId}/round/${lastRound}`)
  }

  return (
    <AppShell
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
          title="Resultados"
          right={
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 pr-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              En vivo
            </span>
          }
        />
      }
    >
      <div className="space-y-6 pb-4">
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
                  {settings.useGroups && (
                    <CardHeader>
                      <CardTitle className="text-base text-primary">
                        Grupo {group.name}
                      </CardTitle>
                    </CardHeader>
                  )}
                  <CardContent>
                    <StandingsTable
                      group={group}
                      settings={settings}
                      showAdvanceSelector={false}
                    />
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
  )
}
