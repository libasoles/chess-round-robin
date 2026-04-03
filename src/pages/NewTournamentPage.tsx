import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { BottomAction } from '@/components/layout/BottomAction'
import { ParticipantInput } from '@/components/tournament/ParticipantInput'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useSettingsStore } from '@/store/settingsStore'
import { useTournamentStore } from '@/store/tournamentStore'
import { normalizeName, validateParticipants } from '@/domain/participants'

export function NewTournamentPage() {
  const navigate = useNavigate()
  const { arbitratorName, lastTournamentSettings, participantsPool, setArbitratorName } = useSettingsStore()
  const { createTournament } = useTournamentStore()
  const currentPersonName = (arbitratorName ?? lastTournamentSettings.arbitratorName ?? '').trim()

  const [arbitrator, setArbitrator] = useState(currentPersonName)
  const [participants, setParticipants] = useState<string[]>([''])
  const [useGroups, setUseGroups] = useState(lastTournamentSettings.useGroups)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [removeIdx, setRemoveIdx] = useState<number | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  // Suggestions = pool minus already-entered names
  const enteredNames = new Set(participants.map((p) => p.trim().toLowerCase()).filter(Boolean))
  const suggestions = participantsPool.filter((n) => !enteredNames.has(n.toLowerCase()))

  function updateParticipant(index: number, value: string) {
    const next = [...participants]
    next[index] = value
    setParticipants(next)
  }

  function addParticipantRow() {
    const lastIdx = participants.length - 1
    if (lastIdx < 0) return
    const normalized = normalizeName(participants[lastIdx] ?? '')
    if (!normalized) return

    const next = [...participants]
    next[lastIdx] = normalized
    next.push('')
    setParticipants(next)
  }

  function localizeValidationErrors(validationErrors: string[]) {
    return validationErrors.map((error) => {
      if (error === 'At least 3 participants are required') {
        return 'Se requieren al menos 3 participantes'
      }
      if (error.startsWith('Duplicate participant names:')) {
        const names = error.replace('Duplicate participant names:', '').trim()
        return `Nombres de participantes duplicados: ${names}`
      }
      return error
    })
  }

  function removeParticipant(index: number) {
    if (participants.length <= 1) return
    setParticipants(participants.filter((_, i) => i !== index))
    setRemoveIdx(null)
  }

  function handleStart() {
    const cleanNames = participants.map(normalizeName).filter((n) => n.length > 0)
    const validation = validateParticipants(cleanNames)
    if (!validation.valid) {
      setErrors(localizeValidationErrors(validation.errors))
      return
    }
    const normalizedArbitrator = normalizeName(arbitrator)
    const effectiveArbitrator = normalizedArbitrator || currentPersonName

    const settings = {
      ...lastTournamentSettings,
      arbitratorName: effectiveArbitrator,
      useGroups,
    }

    if (effectiveArbitrator) setArbitratorName(effectiveArbitrator)
    createTournament(cleanNames, settings)
    navigate('/tournament/round/1')
  }

  function handleCancel() {
    navigate('/')
  }

  return (
    <>
      <AppShell
        topBar={
          <TopBar
            right={
              <button
                type="button"
                onClick={() => setShowCancelDialog(true)}
                className="p-2 text-muted-foreground hover:text-foreground"
                aria-label="Cancelar"
              >
                <X className="h-5 w-5" />
              </button>
            }
          />
        }
        hasBottomAction
      >
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Árbitro
            </h2>
            <Input
              value={arbitrator}
              onChange={(e) => setArbitrator(e.target.value)}
              placeholder="Ej: Juan Pérez (opcional)"
              className="text-base h-12"
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Participantes
            </h2>
            <div className="space-y-2">
              {participants.map((name, idx) => (
                <div key={idx}>
                  <ParticipantInput
                    value={name}
                    onChange={(v) => updateParticipant(idx, v)}
                    onRemove={() => {
                      if (participants.length > 1) setRemoveIdx(idx)
                    }}
                    suggestions={suggestions}
                    canRemove={participants.length > 1 && idx !== participants.length - 1}
                    submitMode={idx === participants.length - 1}
                    onSubmit={addParticipantRow}
                    submitDisabled={!name.trim()}
                  />
                </div>
              ))}
            </div>
          </section>

          {errors.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-3 space-y-1">
              {errors.map((e) => (
                <p key={e} className="text-sm text-destructive">
                  {e}
                </p>
              ))}
            </div>
          )}
        </div>
      </AppShell>

      <BottomAction>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="use-groups"
              checked={useGroups}
              onCheckedChange={(checked) => setUseGroups(checked === true)}
            />
            <Label htmlFor="use-groups" className="cursor-pointer text-base">
              Por grupos
            </Label>
          </div>
          <Button className="w-full h-12 text-base" onClick={handleStart}>
            Comenzar
          </Button>
        </div>
      </BottomAction>

      {/* Cancel confirmation */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmas?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se descartarán todos los datos ingresados. Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Continuar editando
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancelar torneo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove participant confirmation */}
      <Dialog open={removeIdx !== null} onOpenChange={() => setRemoveIdx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar participante?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se eliminará <strong>{removeIdx !== null ? participants[removeIdx] || 'este participante' : ''}</strong> de la lista.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveIdx(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => removeIdx !== null && removeParticipant(removeIdx)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
