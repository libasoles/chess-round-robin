import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ParticipantNameProps {
  children: ReactNode
  className?: string
}

export function ParticipantName({ children, className }: ParticipantNameProps) {
  return (
    <span className={cn('font-medium break-words text-blue-800/80 dark:text-blue-300/85', className)}>
      {children}
    </span>
  )
}
