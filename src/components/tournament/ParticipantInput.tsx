import { useEffect, useRef, useState } from 'react'
import { X, Plus } from 'lucide-react'
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

function getScrollableContainer(element: HTMLElement | null): HTMLElement | null {
  let current = element?.parentElement ?? null
  while (current) {
    const style = window.getComputedStyle(current)
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
      return current
    }
    current = current.parentElement
  }
  return null
}

function scrollInputIntoView(input: HTMLElement): void {
  const vv = window.visualViewport
  const vpHeight = vv?.height ?? window.innerHeight
  const vpOffsetTop = vv?.offsetTop ?? 0

  const footer = document.querySelector<HTMLElement>('[data-bottom-action-root]')
  const footerHeight = footer?.getBoundingClientRect().height ?? 0

  const viewportBottom = vpOffsetTop + vpHeight - footerHeight - 8
  const inputRect = input.getBoundingClientRect()
  const overlap = inputRect.bottom - viewportBottom
  if (overlap <= 0) return

  const scrollContainer = getScrollableContainer(input)
  if (scrollContainer) {
    scrollContainer.scrollBy({ top: overlap + 12, behavior: 'smooth' })
  } else {
    window.scrollBy({ top: overlap + 12, behavior: 'smooth' })
  }
}

export function ParticipantInput({
  value,
  onChange,
  onRemove,
  suggestions,
  placeholder = 'Nombre',
  canRemove = true,
  submitMode = false,
  onSubmit,
  submitDisabled = false,
  autoFocus = false,
  onAutoFocusHandled,
}: ParticipantInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down')
  const inputRef = useRef<HTMLInputElement>(null)

  function openSuggestions() {
    setShowSuggestions(true)
    const input = inputRef.current
    if (!input) {
      setDropdownDirection('down')
      return
    }

    const rect = input.getBoundingClientRect()
    const vv = window.visualViewport
    const vpBottom = (vv?.offsetTop ?? 0) + (vv?.height ?? window.innerHeight)
    const spaceBelow = vpBottom - rect.bottom
    const dropdownMaxH = 192 // max-h-48
    setDropdownDirection(spaceBelow < dropdownMaxH + 8 ? 'up' : 'down')
  }

  useEffect(() => {
    if (!autoFocus) return
    const inputEl = inputRef.current
    inputEl?.focus()
    onAutoFocusHandled?.()

    // Belt-and-suspenders: fire once after 100ms (covers devices where
    // visualViewport doesn't fire resize), then again on the first resize
    // event (covers iOS where keyboard animation finishes asynchronously).
    let fired = false
    const tryScroll = () => {
      if (fired) return
      fired = true
      const input = inputRef.current
      if (input) scrollInputIntoView(input)
      window.visualViewport?.removeEventListener('resize', tryScroll)
    }

    const id = window.setTimeout(tryScroll, 100)
    window.visualViewport?.addEventListener('resize', tryScroll)

    return () => {
      window.clearTimeout(id)
      window.visualViewport?.removeEventListener('resize', tryScroll)
    }
  }, [autoFocus, onAutoFocusHandled])

  const filtered = suggestions.filter(
    (s) =>
      value.trim() &&
      s.toLowerCase().startsWith(value.trim().toLowerCase()) &&
      s.toLowerCase() !== value.trim().toLowerCase(),
  )
  const normalizedSuggestionIndex = (
    showSuggestions &&
    filtered.length > 0 &&
    activeSuggestionIndex >= 0 &&
    activeSuggestionIndex < filtered.length
  ) ? activeSuggestionIndex : 0

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
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            onChange={(e) => {
              onChange(e.target.value)
              openSuggestions()
              setActiveSuggestionIndex(0)
            }}
            onFocus={() => {
              openSuggestions()
              if (submitMode) {
                const input = inputRef.current
                window.setTimeout(() => {
                  if (input) scrollInputIntoView(input)
                }, 100)
              }
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && filtered.length > 0) {
                e.preventDefault()
                openSuggestions()
                setActiveSuggestionIndex((current) => (
                  current < filtered.length - 1 ? current + 1 : 0
                ))
                return
              }

              if (e.key === 'ArrowUp' && filtered.length > 0) {
                e.preventDefault()
                openSuggestions()
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
                const selectedName = filtered[normalizedSuggestionIndex]
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
              className={`absolute z-20 left-0 right-0 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto ${
                dropdownDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
              }`}
            >
              {filtered.map((s, idx) => (
                <li key={s} role="option" aria-selected={idx === normalizedSuggestionIndex}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-primary/20 hover:text-foreground ${
                      idx === normalizedSuggestionIndex ? 'bg-primary/30 text-foreground font-medium' : ''
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
            <Plus className="h-5 w-5" />
          </button>
        ) : canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Eliminar participante"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
