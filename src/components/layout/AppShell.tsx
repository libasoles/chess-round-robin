import type { ReactNode } from 'react'

interface AppShellProps {
  topBar: ReactNode
  children: ReactNode
  /** When provided, adds bottom padding so content isn't hidden behind the fixed action area */
  hasBottomAction?: boolean
}

export function AppShell({ topBar, children, hasBottomAction }: AppShellProps) {
  return (
    <div className="flex-1 flex flex-col bg-background text-foreground max-w-lg mx-auto w-full">
      {topBar}
      <main className={`flex-1 overflow-y-auto px-4 py-4 ${hasBottomAction ? 'pb-36' : ''}`}>
        {children}
      </main>
    </div>
  )
}
