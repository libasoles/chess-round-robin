import type { ReactNode, HTMLAttributes } from 'react'

interface AppShellProps {
  topBar: ReactNode
  children: ReactNode
  /** When provided, adds bottom padding so content isn't hidden behind the fixed action area */
  hasBottomAction?: boolean
  /** Optional props spread onto the <main> element (e.g. gesture bindings) */
  mainProps?: HTMLAttributes<HTMLElement>
}

export function AppShell({ topBar, children, hasBottomAction, mainProps }: AppShellProps) {
  return (
    <div className="flex-1 flex flex-col bg-background text-foreground max-w-lg mx-auto w-full">
      {topBar}
      <main
        {...mainProps}
        className={`flex-1 overflow-y-auto px-4 py-4 ${hasBottomAction ? 'pb-36' : ''}`}
        style={{ touchAction: 'pan-y', ...mainProps?.style }}
      >
        {children}
      </main>
    </div>
  )
}
