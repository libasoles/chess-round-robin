import { useEffect, useRef, type ReactNode } from 'react'

interface BottomActionProps {
  children: ReactNode
}

export function BottomAction({ children }: BottomActionProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = rootRef.current
    if (!element) return

    const updateHeight = () => {
      document.documentElement.style.setProperty(
        '--bottom-action-height',
        `${element.getBoundingClientRect().height}px`,
      )
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(element)
    window.addEventListener('resize', updateHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateHeight)
      document.documentElement.style.removeProperty('--bottom-action-height')
    }
  }, [])

  return (
    <div
      ref={rootRef}
      data-bottom-action-root
      className="fixed bottom-0 left-0 right-0 z-10 bg-background px-4 py-3 pb-safe"
    >
      <div className="mx-auto w-full max-w-lg">
        {children}
      </div>
    </div>
  )
}
