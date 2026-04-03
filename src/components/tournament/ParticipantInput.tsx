import { useRef, useState } from 'react'
import { X, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { normalizeName } from '@/domain/participants'

interface ParticipantInputProps {
  value: string
  onChange: (v: string) => void
  onRemove: () => void
  onConfirmRemove?: boolean // if true, shows inline confirm before removing
  suggestions: string[]
  placeholder?: string
  canRemove?: boolean
  submitMode?: boolean
  onSubmit?: () => void
  submitDisabled?: boolean
}

export function ParticipantInput({
  value,
  onChange,
  onRemove,
  suggestions,
  placeholder = 'Nombre del participante',
  canRemove = true,
  submitMode = false,
  onSubmit,
  submitDisabled = false,
}: ParticipantInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = suggestions.filter(
    (s) =>
      value.trim() &&
      s.toLowerCase().startsWith(value.trim().toLowerCase()) &&
      s.toLowerCase() !== value.trim().toLowerCase(),
  )

  function selectSuggestion(name: string) {
    onChange(name)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && submitMode) {
                e.preventDefault()
                onSubmit?.()
              }
            }}
            placeholder={placeholder}
            className="text-base h-12"
          />
          {showSuggestions && filtered.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
              {filtered.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    onMouseDown={() => selectSuggestion(normalizeName(s))}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {submitMode ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Agregar participante"
          >
            <Check className="h-5 w-5" />
          </button>
        ) : canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
            aria-label="Eliminar participante"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
