import { Share2 } from 'lucide-react'

interface TopBarShareActionProps {
  title?: string
  url?: string
  className?: string
}

export function TopBarShareAction({
  title = 'Torneo de ajedrez',
  url = window.location.href,
  className,
}: TopBarShareActionProps) {
  const canShare = typeof navigator.share !== 'undefined'

  if (!canShare) return null

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => navigator.share({ title, url })}
        className="p-2 -mr-1 text-blue-800/80 hover:text-blue-800 dark:text-blue-300/85 dark:hover:text-blue-300"
        aria-label="Compartir"
      >
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  )
}
