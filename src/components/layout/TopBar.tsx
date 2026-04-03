import type { ReactNode } from 'react'

interface TopBarProps {
  left?: ReactNode
  title?: ReactNode
  right?: ReactNode
  className?: string
}

export function TopBar({ left, title, right, className }: TopBarProps) {
  return (
    <div className={`flex items-center justify-between px-4 h-14 sticky top-0 z-10 ${className ?? 'bg-background'}`}>
      <div className="flex items-center gap-2 min-w-10">{left}</div>
      <div className="flex-1 text-center font-medium">{title}</div>
      <div className="flex items-center gap-2 justify-end min-w-10">{right}</div>
    </div>
  )
}
