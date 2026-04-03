import { X, Check } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { normalizeName } from '@/domain/participants'

interface ParticipantsPoolProps {
  pool: string[]
  onAdd: (names: string[]) => void
  onRemove: (name: string) => void
}

export function ParticipantsPool({ pool, onAdd, onRemove }: ParticipantsPoolProps) {
  const [newName, setNewName] = useState('')
  const [toRemove, setToRemove] = useState<string | null>(null)

  function handleAdd() {
    const name = normalizeName(newName)
    if (name) {
      onAdd([name])
      setNewName('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Nuevo Participante"
          className="text-sm h-10 flex-1"
        />
        <Button type="button" variant="outline" size="icon" onClick={handleAdd} className="h-10 w-10 shrink-0">
          <Check className="h-4 w-4" />
        </Button>
      </div>

      <ul className="space-y-1">
        {pool.map((name) => (
          <li key={name} className="flex items-center gap-2 py-1">
            <span className="flex-1 text-sm">{name}</span>
            <button
              type="button"
              onClick={() => setToRemove(name)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label={`Eliminar ${name}`}
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={toRemove !== null} onOpenChange={() => setToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar participante?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se eliminará <strong>{toRemove}</strong> de la lista de participantes guardados.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToRemove(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (toRemove) onRemove(toRemove)
                setToRemove(null)
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
