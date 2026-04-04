import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Moon } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { ArbitratorField } from '@/components/settings/ArbitratorField'
import { TiebreakList } from '@/components/settings/TiebreakList'
import { PointSelector } from '@/components/settings/PointSelector'
import { ParticipantsPool } from '@/components/settings/ParticipantsPool'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { useSettingsStore } from '@/store/settingsStore'
import type { Theme } from '@/store/settingsStore'
import type { TiebreakMethod } from '@/domain/types'

const THEME_OPTIONS: Array<{ value: Theme; icon: typeof Sun; label: string }> = [
  { value: 'light', icon: Sun, label: 'Claro' },
  { value: 'dark', icon: Moon, label: 'Oscuro' },
]

export function SettingsPage() {
  const navigate = useNavigate()
  const {
    arbitratorName,
    lastTournamentSettings,
    participantsPool,
    theme,
    setArbitratorName,
    setLastTournamentSettings,
    setTheme,
    addToParticipantsPool,
    removeFromParticipantsPool,
  } = useSettingsStore()
  const selectedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme

  function updateSettings<K extends keyof typeof lastTournamentSettings>(
    key: K,
    value: (typeof lastTournamentSettings)[K],
  ) {
    setLastTournamentSettings({ ...lastTournamentSettings, [key]: value })
  }

  return (
    <AppShell
      topBar={
        <TopBar
          left={
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-foreground"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          }
          title="Configuración"
          right={
            <div className="flex rounded-md border border-border overflow-hidden">
              {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-label={label}
                  className={`p-2 transition-colors ${
                    selectedTheme === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          }
        />
      }
    >
      <div className="space-y-6 pb-8">
        <Card>
          <CardContent>
            <ArbitratorField
              value={arbitratorName ?? ''}
              onChange={setArbitratorName}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Desempates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TiebreakList
              order={lastTournamentSettings.tiebreakOrder}
              onChange={(order: TiebreakMethod[]) => updateSettings('tiebreakOrder', order)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Puntos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PointSelector
              label="Por bye"
              value={lastTournamentSettings.byePoints}
              onChange={(v) => updateSettings('byePoints', v)}
            />
            <PointSelector
              label="Por abandono"
              value={lastTournamentSettings.forfeitPoints}
              onChange={(v) => updateSettings('forfeitPoints', v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Grupos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">Jugadores por grupo (máximo)</span>
              <span className="text-sm font-medium">{lastTournamentSettings.groupSize ?? 4}</span>
            </div>
            <Slider
              min={4}
              max={10}
              step={2}
              value={lastTournamentSettings.groupSize ?? 4}
              onValueChange={(v) => updateSettings('groupSize', v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Participantes guardados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ParticipantsPool
              pool={participantsPool}
              onAdd={addToParticipantsPool}
              onRemove={removeFromParticipantsPool}
            />
          </CardContent>
        </Card>

        <p className="px-1 text-right text-xs text-muted-foreground">
          Versión {__APP_VERSION__}
        </p>
      </div>
    </AppShell>
  )
}
