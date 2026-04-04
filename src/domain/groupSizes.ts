/**
 * Determines how to distribute n real participants into groups.
 *
 * - useGroups=false OR n <= groupSize+1: single group (odd n gets a Bye slot added).
 *   This handles the n=groupSize+1 "odd overshoot" case naturally.
 * - useGroups=true AND n >= groupSize+2: distribute into ceil(n/groupSize) groups
 *   as evenly as possible, with no group exceeding groupSize participants.
 */
export function buildGroupSizes(n: number, useGroups: boolean, groupSize = 4, minN = 3): number[] {
  if (n < minN) {
    throw new Error(`Minimum ${minN} participants required`)
  }

  if (!useGroups || n <= groupSize + 1) {
    return n % 2 === 0 ? [n] : [n + 1]
  }

  // n >= groupSize + 2: distribute into k groups as evenly as possible
  const k = Math.ceil(n / groupSize)
  const base = Math.floor(n / k)
  const extra = n % k
  const sizes: number[] = []
  for (let i = 0; i < k; i++) {
    sizes.push(i < extra ? base + 1 : base)
  }
  return sizes.sort((a, b) => b - a)
}
