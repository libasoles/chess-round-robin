import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'
import { buildBrandUrl } from '@/lib/brand'

interface TopBarShareActionProps {
  jazzId?: string
  currentRound?: number
  standings?: boolean
  className?: string
}

export function TopBarShareAction({ jazzId, currentRound, standings, className }: TopBarShareActionProps) {
  const [copied, setCopied] = useState(false)

  if (!jazzId) return null

  const shareUrl = buildBrandUrl(
    standings
      ? `/t/${jazzId}/standings`
      : `/t/${jazzId}/round/${currentRound ?? 1}`
  )
  const canShare = typeof navigator.share !== 'undefined'

  function handleShare() {
    if (canShare) {
      navigator.share({ title: 'Torneo de ajedrez', url: shareUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {})
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      <button
        type="button"
        onClick={handleShare}
        className="p-2 -mr-1 text-blue-800/80 hover:text-blue-800 dark:text-blue-300/85 dark:hover:text-blue-300"
        aria-label="Compartir"
      >
        {copied ? <Check className="h-5 w-5" /> : canShare ? <Share2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
      </button>
    </div>
  )
}
