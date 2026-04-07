import { useRef, useEffect, type ReactNode, type HTMLAttributes } from 'react'
import { useLocation } from 'react-router-dom'

interface AppShellProps {
  topBar: ReactNode
  children: ReactNode
  /** When provided, adds bottom padding so content isn't hidden behind the fixed action area */
  hasBottomAction?: boolean
  /** Optional props spread onto the <main> element (e.g. gesture bindings) */
  mainProps?: HTMLAttributes<HTMLElement>
}

export function AppShell({ topBar, children, hasBottomAction, mainProps }: AppShellProps) {
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground max-w-lg mx-auto w-full">
      {topBar}
      <main
        ref={mainRef}
        {...mainProps}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          touchAction: 'pan-y',
          paddingBottom: hasBottomAction
            ? 'calc(var(--bottom-action-height, 0px) + 1rem)'
            : undefined,
          ...mainProps?.style,
        }}
      >
        {children}
      </main>
    </div>
  )
}
