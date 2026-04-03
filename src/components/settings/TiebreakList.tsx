import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { TiebreakMethod } from '@/domain/types'

const ALL_METHODS: Array<{ method: TiebreakMethod; label: string }> = [
  { method: 'DE', label: 'Encuentro Directo (ED)' },
  { method: 'SB', label: 'Sonneborn-Berger (SB)' },
  { method: 'Buchholz', label: 'Buchholz' },
  { method: 'PN', label: 'Partidas Ganadas con Negras (PN)' },
]

interface TiebreakListProps {
  /** Ordered list of enabled tiebreak methods */
  order: TiebreakMethod[]
  onChange: (order: TiebreakMethod[]) => void
}

export function TiebreakList({ order, onChange }: TiebreakListProps) {
  const enabled = new Set(order)
  const [dragging, setDragging] = useState<TiebreakMethod | null>(null)

  function toggle(method: TiebreakMethod) {
    if (enabled.has(method)) {
      onChange(order.filter((m) => m !== method))
    } else {
      onChange([...order, method])
    }
  }

  function move(source: TiebreakMethod, target: TiebreakMethod) {
    const sourceIdx = order.indexOf(source)
    const targetIdx = order.indexOf(target)
    if (sourceIdx === -1 || targetIdx === -1 || sourceIdx === targetIdx) return
    const next = [...order]
    const [moved] = next.splice(sourceIdx, 1)
    next.splice(targetIdx, 0, moved!)
    onChange(next)
  }

  // Build display order: enabled items first (in their configured order), then disabled items
  const disabledMethods = ALL_METHODS.filter((m) => !enabled.has(m.method))
  const displayOrder = [
    ...order.map((m) => ALL_METHODS.find((a) => a.method === m)!).filter(Boolean),
    ...disabledMethods,
  ]

  return (
    <div className="space-y-0.5">
      {displayOrder.map(({ method, label }) => {
        const isEnabled = enabled.has(method)
        return (
          <div
            key={method}
            onDragOver={(e) => {
              if (!isEnabled || !dragging || dragging === method) return
              e.preventDefault()
            }}
            onDrop={(e) => {
              if (!isEnabled || !dragging || dragging === method) return
              e.preventDefault()
              move(dragging, method)
              setDragging(null)
            }}
            className={`flex items-center gap-2 py-1.5 ${
              dragging === method ? 'opacity-60' : ''
            }`}
          >
            <button
              type="button"
              draggable={isEnabled}
              onDragStart={(e) => {
                if (!isEnabled) return
                e.dataTransfer.effectAllowed = 'move'
                setDragging(method)
              }}
              onDragEnd={() => setDragging(null)}
              aria-label={`Reordenar ${label}`}
              className={`shrink-0 rounded p-1 ${
                isEnabled
                  ? 'cursor-grab text-muted-foreground active:cursor-grabbing'
                  : 'cursor-not-allowed text-muted-foreground/40'
              }`}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <Label htmlFor={`tb-${method}`} className="flex-1 cursor-pointer text-sm">
              {label}
            </Label>
            <Checkbox
              id={`tb-${method}`}
              checked={isEnabled}
              onCheckedChange={() => toggle(method)}
            />
          </div>
        )
      })}
    </div>
  )
}
