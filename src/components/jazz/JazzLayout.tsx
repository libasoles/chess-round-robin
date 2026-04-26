import { Outlet } from 'react-router-dom'
import { JazzReactProvider } from 'jazz-tools/react'
import { Account } from 'jazz-tools'
import { JazzInit } from './JazzInit'

const JAZZ_PEER = `wss://cloud.jazz.tools/?key=${import.meta.env.VITE_JAZZ_API_KEY}` as const

export default function JazzLayout() {
  return (
    <JazzReactProvider AccountSchema={Account} sync={{ peer: JAZZ_PEER, when: 'always' }}>
      <JazzInit />
      <Outlet />
    </JazzReactProvider>
  )
}
