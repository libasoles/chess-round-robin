import { useEffect, useRef, useState } from 'react'
import type { Tournament } from '@/domain/types'
import { buildGroupSizes } from '@/domain/groupSizes'
import { GROUP_NAMES, normalizeName } from '@/domain/participants'
import { useSettingsStore } from '@/store/settingsStore'
import { ParticipantInput } from '@/components/tournament/ParticipantInput'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, GripVertical } from 'lucide-react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type ValidationToast = {
  id: number
  message: string
}

type ModalParticipant = { uid: string; existingId?: string; name: string }
type ModalGroup = {
  uid: string
  label: string
  participants: ModalParticipant[]
  isUserCreated: boolean
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface SortableParticipantRowProps {
  participant: ModalParticipant
  onChange: (v: string) => void
  onRemove: () => void
  suggestions: string[]
  canRemove: boolean
  autoFocus: boolean
  onAutoFocusHandled: () => void
  static?: boolean
  submitMode?: boolean
  onSubmit?: (nextValue?: string) => void
  submitDisabled?: boolean
  handleDisabled?: boolean
}

function SortableParticipantRow({
  participant,
  onChange,
  onRemove,
  suggestions,
  canRemove,
  autoFocus,
  onAutoFocusHandled,
  static: isStatic,
  submitMode = false,
  onSubmit,
  submitDisabled = false,
  handleDisabled = false,
}: SortableParticipantRowProps) {
  const sortable = useSortable({ id: participant.uid, disabled: !!isStatic })
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = isStatic
    ? {
        attributes: {},
        listeners: {},
        setNodeRef: undefined as unknown as (node: HTMLElement | null) => void,
        transform: null,
        transition: undefined,
        isDragging: false,
      }
    : sortable

  const style = {
    transform: CSS.Transform.toString(transform ?? null),
    transition,
  }

  return (
    <div
      ref={isStatic ? undefined : setNodeRef}
      style={style}
      className={isDragging ? 'opacity-0' : ''}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...(isStatic || handleDisabled
            ? {}
            : { ...attributes, ...listeners })}
          aria-label={`Reordenar ${participant.name || 'participante'}`}
          className={`shrink-0 touch-none select-none p-1 rounded ${
            handleDisabled || isStatic
              ? 'cursor-not-allowed text-muted-foreground/40'
              : 'cursor-grab text-muted-foreground active:cursor-grabbing'
          }`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <ParticipantInput
            value={participant.name}
            onChange={onChange}
            onRemove={onRemove}
            suggestions={suggestions}
            canRemove={canRemove}
            submitMode={submitMode}
            onSubmit={onSubmit}
            submitDisabled={submitDisabled}
            autoFocus={autoFocus}
            onAutoFocusHandled={onAutoFocusHandled}
          />
        </div>
      </div>
    </div>
  )
}

interface NewPhaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeTournament: Tournament
  onConfirm: (grouped: Array<Array<{ id?: string; name: string }>>) => void
}

export function NewPhaseModal({
  open,
  onOpenChange,
  activeTournament,
  onConfirm,
}: NewPhaseModalProps) {
  const { participantsPool } = useSettingsStore()
  const [groups, setGroups] = useState<ModalGroup[]>([])
  const [toasts, setToasts] = useState<ValidationToast[]>([])
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null)
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(
    null,
  )
  const toastTimeoutsRef = useRef<number[]>([])

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    return () => {
      for (const timeoutId of toastTimeoutsRef.current) {
        window.clearTimeout(timeoutId)
      }
      toastTimeoutsRef.current = []
    }
  }, [])

  // Initialize groups when modal opens
  useEffect(() => {
    if (!open) return

    // Collect all non-bye participants (deduplicated by id, last occurrence)
    const participantMap = new Map<
      string,
      { id: string; name: string; isBye: boolean }
    >()
    for (const phase of activeTournament.phases) {
      for (const group of phase.groups) {
        for (const p of group.participants) {
          if (!p.isBye) participantMap.set(p.id, p)
        }
      }
    }
    const allParticipants = [...participantMap.values()]

    const sizes = buildGroupSizes(
      allParticipants.length,
      true,
      activeTournament.settings.groupSize,
      2,
    )

    // Continue group naming from first unused GROUP_NAME
    const usedNames = activeTournament.phases.flatMap((p) =>
      p.groups.map((g) => g.name),
    )
    const firstUnusedIdx = GROUP_NAMES.findIndex((n) => !usedNames.includes(n))
    const availableNames = GROUP_NAMES.slice(
      firstUnusedIdx >= 0 ? firstUnusedIdx : 0,
    )

    // Distribute participants into groups
    const newGroups: ModalGroup[] = []
    let offset = 0
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i]
      const label = availableNames[i] ?? `GROUP_${i + 1}`
      const slice = allParticipants.slice(offset, offset + size)
      offset += size

      const participants: ModalParticipant[] = [
        ...slice.map((p) => ({
          uid: genId(),
          existingId: p.id,
          name: p.name,
        })),
        { uid: genId(), existingId: undefined, name: '' }, // submit row
      ]

      newGroups.push({
        uid: genId(),
        label,
        participants,
        isUserCreated: false,
      })
    }

    setGroups(newGroups)
  }, [open, activeTournament])

  // Suggestions = pool minus all names already in any group
  const allEnteredNames = new Set<string>()
  for (const group of groups) {
    for (const p of group.participants) {
      if (p.name.trim()) allEnteredNames.add(p.name.trim().toLowerCase())
    }
  }
  const suggestions = participantsPool.filter(
    (n) => !allEnteredNames.has(n.toLowerCase()),
  )

  const activeParticipant = activeParticipantId
    ? groups
        .flatMap((g) => g.participants)
        .find((p) => p.uid === activeParticipantId) ?? null
    : null

  function updateParticipantInGroup(groupIdx: number, partIdx: number, value: string) {
    setGroups((prev) => {
      const next = [...prev]
      const group = next[groupIdx]
      if (!group) return prev
      const participants = [...group.participants]
      const p = participants[partIdx]
      if (!p) return prev
      participants[partIdx] = { ...p, name: value }
      next[groupIdx] = { ...group, participants }
      return next
    })
  }

  function removeParticipantFromGroup(groupIdx: number, partIdx: number) {
    setGroups((prev) => {
      const next = [...prev]
      const group = next[groupIdx]
      if (!group) return prev
      group.participants = group.participants.filter((_, i) => i !== partIdx)
      return next
    })
  }

  function addParticipantToGroup(groupIdx: number, nextValue?: string) {
    setGroups((prev) => {
      const next = [...prev]
      const group = next[groupIdx]
      if (!group || group.participants.length === 0) return prev

      const lastParticipant = group.participants[group.participants.length - 1]
      const normalized = normalizeName(nextValue ?? lastParticipant.name ?? '')
      if (!normalized) return prev

      const newUid = genId()
      const participants = [...group.participants]
      // Update the last (submit) row with the normalized name
      participants[participants.length - 1] = {
        ...lastParticipant,
        name: normalized,
      }
      // Add a new empty submit row
      participants.push({ uid: newUid, existingId: undefined, name: '' })

      next[groupIdx] = { ...group, participants }
      setPendingFocusId(newUid)
      return next
    })
  }

  function removeGroup(groupIdx: number) {
    setGroups((prev) => prev.filter((_, i) => i !== groupIdx))
  }

  function addNewGroup() {
    const usedLabels = new Set(groups.map((g) => g.label))
    const nextLabel = GROUP_NAMES.find((n) => !usedLabels.has(n)) ?? `GROUP_${groups.length + 1}`

    const newGroup: ModalGroup = {
      uid: genId(),
      label: nextLabel,
      participants: [{ uid: genId(), existingId: undefined, name: '' }],
      isUserCreated: true,
    }

    setGroups((prev) => [...prev, newGroup])
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveParticipantId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveParticipantId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Find source and destination groups
    let sourceGroupIdx = -1
    let sourcePartIdx = -1
    let destGroupIdx = -1
    let destPartIdx = -1

    for (let gi = 0; gi < groups.length; gi++) {
      for (let pi = 0; pi < groups[gi].participants.length; pi++) {
        if (groups[gi].participants[pi].uid === active.id) {
          sourceGroupIdx = gi
          sourcePartIdx = pi
        }
        if (groups[gi].participants[pi].uid === over.id) {
          destGroupIdx = gi
          destPartIdx = pi
        }
      }
    }

    if (sourceGroupIdx === -1 || destGroupIdx === -1) return

    // Move participant
    setGroups((prev) => {
      const next = [...prev]

      const participant = next[sourceGroupIdx].participants[sourcePartIdx]
      if (!participant) return prev

      // Remove from source
      next[sourceGroupIdx].participants = next[sourceGroupIdx].participants.filter(
        (_, i) => i !== sourcePartIdx,
      )

      // Insert into destination
      next[destGroupIdx].participants = [
        ...next[destGroupIdx].participants.slice(0, destPartIdx),
        participant,
        ...next[destGroupIdx].participants.slice(destPartIdx),
      ]

      return next
    })
  }

  function showValidationToasts(messages: string[]) {
    const uniqueMessages = [...new Set(messages)]
    const nextToasts = uniqueMessages.map((message, idx) => ({
      id: Date.now() + idx,
      message,
    }))
    setToasts((current) => [...current, ...nextToasts])

    for (const toast of nextToasts) {
      const timeoutId = window.setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== toast.id))
      }, 5000)
      toastTimeoutsRef.current.push(timeoutId)
    }
  }

  function dismissToast(id: number) {
    setToasts((current) => current.filter((t) => t.id !== id))
  }

  function handleConfirm() {
    // Validate: each group must have >= 2 non-empty participants (excluding submit row)
    for (const group of groups) {
      const filledParticipants = group.participants.filter(
        (p) => p.name.trim().length > 0,
      )
      if (filledParticipants.length < 2) {
        showValidationToasts([
          `El grupo ${group.label} debe tener al menos 2 participantes`,
        ])
        return
      }
    }

    // Format output: remove empty rows, keep only existing or named new ones
    const grouped = groups.map((g) =>
      g.participants
        .filter((p) => p.name.trim().length > 0)
        .map((p) => ({
          id: p.existingId,
          name: p.name,
        })),
    )

    onConfirm(grouped)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        >
          <DialogHeader className="sticky top-0 z-10 border-b border-border bg-popover px-4 py-4 flex flex-row items-center justify-between gap-2">
            <DialogTitle>Nueva Fase</DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {groups.map((group, groupIdx) => {
                const participantUids = group.participants.map((p) => p.uid)
                const filledParticipants = group.participants.filter(
                  (p) => p.name.trim().length > 0,
                )
                const canRemoveGroup =
                  group.isUserCreated && filledParticipants.length === 0

                return (
                  <div key={group.uid} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-primary">
                        Grupo {group.label}
                      </h3>
                      {canRemoveGroup && (
                        <button
                          type="button"
                          onClick={() => removeGroup(groupIdx)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                          aria-label={`Eliminar grupo ${group.label}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 bg-card rounded-lg border border-border p-3">
                      <SortableContext
                        items={participantUids}
                        strategy={verticalListSortingStrategy}
                      >
                        {group.participants.map((p, partIdx) => {
                          const isSubmitRow = partIdx === group.participants.length - 1
                          return (
                            <SortableParticipantRow
                              key={p.uid}
                              participant={p}
                              onChange={(v) =>
                                updateParticipantInGroup(groupIdx, partIdx, v)
                              }
                              onRemove={() =>
                                removeParticipantFromGroup(groupIdx, partIdx)
                              }
                              suggestions={suggestions}
                              canRemove={
                                group.participants.length > 1 && !isSubmitRow
                              }
                              autoFocus={p.uid === pendingFocusId}
                              onAutoFocusHandled={() => setPendingFocusId(null)}
                              submitMode={isSubmitRow}
                              onSubmit={
                                isSubmitRow
                                  ? (nextValue) =>
                                      addParticipantToGroup(groupIdx, nextValue)
                                  : undefined
                              }
                              submitDisabled={!p.name.trim()}
                              handleDisabled={isSubmitRow && group.participants.filter(p => p.name.trim()).length === 0}
                            />
                          )
                        })}
                      </SortableContext>
                    </div>
                  </div>
                )
              })}

              <DragOverlay dropAnimation={null}>
                {activeParticipant ? (
                  <div className="rounded-md border border-primary/40 bg-card shadow-xl ring-2 ring-primary/30 scale-[1.02]">
                    <SortableParticipantRow
                      participant={activeParticipant}
                      onChange={() => {}}
                      onRemove={() => {}}
                      suggestions={[]}
                      canRemove={false}
                      autoFocus={false}
                      onAutoFocusHandled={() => {}}
                      static
                      submitMode={false}
                      submitDisabled={false}
                      handleDisabled={false}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            <button
              type="button"
              onClick={addNewGroup}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              + Nuevo Grupo
            </button>
          </div>

          <DialogFooter className="border-t border-border bg-muted/50 px-4 py-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="w-full sm:w-auto">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed top-0 left-0 right-0 z-70 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center justify-between gap-3 bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground pointer-events-auto"
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
