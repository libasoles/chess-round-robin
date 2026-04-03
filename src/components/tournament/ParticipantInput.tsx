import { useEffect, useRef, useState } from 'react'
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
  onSubmit?: (nextValue?: string) => void
  submitDisabled?: boolean
  autoFocus?: boolean
  onAutoFocusHandled?: () => void
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
  autoFocus = false,
  onAutoFocusHandled,
}: ParticipantInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!autoFocus) return
    inputRef.current?.focus()
    onAutoFocusHandled?.()
  }, [autoFocus, onAutoFocusHandled])

  const filtered = suggestions.filter(
    (s) =>
      value.trim() &&
      s.toLowerCase().startsWith(value.trim().toLowerCase()) &&
      s.toLowerCase() !== value.trim().toLowerCase(),
  )

  useEffect(() => {
    if (!showSuggestions || filtered.length === 0) {
      setActiveSuggestionIndex(-1)
      return
    }
    setActiveSuggestionIndex((current) => (
      current >= 0 && current < filtered.length ? current : 0
    ))
  }, [showSuggestions, filtered.length])

  function selectSuggestion(name: string) {
    onChange(name)
    setShowSuggestions(false)
    if (submitMode && !submitDisabled) {
      onSubmit?.(name)
    }
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
              setActiveSuggestionIndex(0)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && filtered.length > 0) {
                e.preventDefault()
                setShowSuggestions(true)
                setActiveSuggestionIndex((current) => (
                  current < filtered.length - 1 ? current + 1 : 0
                ))
                return
              }

              if (e.key === 'ArrowUp' && filtered.length > 0) {
                e.preventDefault()
                setShowSuggestions(true)
                setActiveSuggestionIndex((current) => (
                  current > 0 ? current - 1 : filtered.length - 1
                ))
                return
              }

              if (e.key === 'Escape') {
                setShowSuggestions(false)
                return
              }

              if (e.key === 'Enter' && showSuggestions && filtered.length > 0) {
                e.preventDefault()
                const selectedIndex = activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0
                const selectedName = filtered[selectedIndex]
                if (selectedName) {
                  selectSuggestion(normalizeName(selectedName))
                }
                return
              }

              if (e.key === 'Enter' && submitMode) {
                e.preventDefault()
                onSubmit?.()
              }
            }}
            aria-expanded={showSuggestions && filtered.length > 0}
            aria-autocomplete="list"
            placeholder={placeholder}
            className="text-base h-12"
          />
          {showSuggestions && filtered.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-20 left-0 right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto"
            >
              {filtered.map((s, idx) => (
                <li key={s} role="option" aria-selected={idx === activeSuggestionIndex}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-primary/20 hover:text-foreground ${
                      idx === activeSuggestionIndex ? 'bg-primary/30 text-foreground font-medium' : ''
                    }`}
                    onMouseEnter={() => setActiveSuggestionIndex(idx)}
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
            onClick={() => onSubmit?.()}
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
