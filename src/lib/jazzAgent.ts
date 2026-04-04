import type { Account } from 'jazz-tools'

let _me: Account | null = null
let _resolve: ((me: Account) => void) | null = null
const _meReady = new Promise<Account>((resolve) => {
  _resolve = resolve
})

export function setJazzMe(me: Account) {
  _me = me
  _resolve?.(me)
}

export function getJazzMe(): Account | null {
  return _me
}

/** Resolves once the Jazz account is available (may be immediate or after app init). */
export function waitForJazzMe(): Promise<Account> {
  return _meReady
}
