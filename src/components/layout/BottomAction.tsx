import type { ReactNode } from 'react'

interface BottomActionProps {
  children: ReactNode
}

export function BottomAction({ children }: BottomActionProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-background px-4 py-3 pb-safe">
      {children}
    </div>
  )
}
