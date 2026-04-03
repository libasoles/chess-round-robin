import type { MatchResult } from '@/domain/types'
import { Trophy, Handshake, LogOut } from 'lucide-react'

interface ResultButtonsProps {
  current: MatchResult | null
  onChange: (result: MatchResult | null) => void
}

type ButtonDef = {
  result: MatchResult
  icon: typeof Trophy
  label: string
  side: 'white' | 'center' | 'black'
}

const BUTTONS: ButtonDef[] = [
  { result: 'white_win', icon: Trophy, label: 'Gana blancas', side: 'white' },
  { result: 'forfeit_white', icon: LogOut, label: 'Abandona blancas', side: 'white' },
  { result: 'draw', icon: Handshake, label: 'Tablas', side: 'center' },
  { result: 'forfeit_black', icon: LogOut, label: 'Abandona negras', side: 'black' },
  { result: 'black_win', icon: Trophy, label: 'Gana negras', side: 'black' },
]

export function ResultButtons({ current, onChange }: ResultButtonsProps) {
  function handleClick(result: MatchResult) {
    // Tap active button → clear
    onChange(current === result ? null : result)
  }

  const leftButtons = BUTTONS.filter((b) => b.side === 'white')
  const centerButton = BUTTONS.find((b) => b.side === 'center')!
  const rightButtons = BUTTONS.filter((b) => b.side === 'black')

  function renderButton({ result, icon: Icon, label }: ButtonDef) {
    const isActive = current === result
    return (
      <button
        key={result}
        type="button"
        onClick={() => handleClick(result)}
        aria-label={label}
        aria-pressed={isActive}
        className={`p-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        <Icon className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="mt-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        {leftButtons.map(renderButton)}
      </div>
      <div className="flex items-center">
        {renderButton(centerButton)}
      </div>
      <div className="flex items-center gap-1">
        {rightButtons.map(renderButton)}
      </div>
    </div>
  )
}
