import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Moon } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { ArbitratorField } from '@/components/settings/ArbitratorField'
import { TiebreakList } from '@/components/settings/TiebreakList'
import { PointSelector } from '@/components/settings/PointSelector'
import { ParticipantsPool } from '@/components/settings/ParticipantsPool'
import { Separator } from '@/components/ui/separator'
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
        <section className="space-y-3">
          <ArbitratorField
            value={arbitratorName ?? ''}
            onChange={setArbitratorName}
          />
        </section>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Desempates
          </h2>
          <TiebreakList
            order={lastTournamentSettings.tiebreakOrder}
            onChange={(order: TiebreakMethod[]) => updateSettings('tiebreakOrder', order)}
          />
        </section>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Puntos
          </h2>
          <PointSelector
            label="Puntos por Bye"
            value={lastTournamentSettings.byePoints}
            onChange={(v) => updateSettings('byePoints', v)}
          />
          <PointSelector
            label="Puntos por Abandono"
            value={lastTournamentSettings.forfeitPoints}
            onChange={(v) => updateSettings('forfeitPoints', v)}
          />
        </section>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Participantes guardados
          </h2>
          <ParticipantsPool
            pool={participantsPool}
            onAdd={addToParticipantsPool}
            onRemove={removeFromParticipantsPool}
          />
        </section>
      </div>
    </AppShell>
  )
}
