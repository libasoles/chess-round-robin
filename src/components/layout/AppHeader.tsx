import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 bg-header-bg text-foreground border-b border-border">
      <Link to="/" aria-label="Inicio" className="flex items-center gap-2">
        <img src="/logo.png" alt="Chess Round Robin" className="h-10 w-10" />
        <span className="mt-2 font-serif leading-none flex flex-col">
          <span className="text-xs">Torneo</span>
          <span className="-mt-1 text-lg">Round Robin</span>
        </span>
      </Link>
      <Link
        to="/settings"
        aria-label="Configuración"
        className="hidden md:flex p-2 text-muted-foreground hover:text-foreground"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </header>
  )
}
