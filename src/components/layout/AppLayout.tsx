import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'

export function AppLayout() {
  return (
    <div className="min-h-svh flex flex-col">
      <AppHeader />
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  )
}
