import { Link } from 'react-router-dom'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 h-14 flex items-center px-4 bg-card text-foreground border-b border-border">
      <Link to="/" aria-label="Inicio" className="flex items-center gap-2">
        <img src="/icon.png" alt="Chess Round Robin" className="h-10 w-10" />
        <span className="mt-2 font-serif leading-none flex flex-col">
          <span className="text-xs">Torneo</span>
          <span className="-mt-1 text-lg">Round Robin</span>
        </span>
      </Link>
    </header>
  )
}
