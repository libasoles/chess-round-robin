import { Link } from 'react-router-dom'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 h-14 flex items-center px-4 bg-primary text-primary-foreground">
      <Link to="/" aria-label="Inicio" className="flex items-center gap-2">
        <img src="/icon.png" alt="Chess Round Robin" className="h-9 w-9" />
        <span className="font-serif leading-none flex flex-col">
          <span className="text-xs">Torneo</span>
          <span className="-mt-1 text-lg">Round Robin</span>
        </span>
      </Link>
    </header>
  )
}
