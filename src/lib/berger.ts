/**
 * Berger circle method for generating round-robin tournament schedules.
 *
 * Returns (n-1) rounds, each with (n/2) matches.
 * Each match is [whiteIndex, blackIndex] using 1-based player indices.
 *
 * This follows the FIDE Handbook Annex 1 Berger tables:
 * https://handbook.fide.com/chapter/C05Annex1
 */
export function bergerTable(n: number): [number, number][][] {
  if (n < 4 || n % 2 !== 0) {
    throw new Error(`bergerTable requires an even number >= 4, got ${n}`)
  }

  const rounds: [number, number][][] = []
  const cycleSize = n - 1
  const half = n / 2

  for (let roundNumber = 1; roundNumber <= n - 1; roundNumber++) {
    const round: [number, number][] = []
    const k = Math.ceil(roundNumber / 2)

    if (roundNumber % 2 === 1) {
      round.push([wrap(k, cycleSize), n])

      for (let offset = 1; offset < half; offset++) {
        round.push([
          wrap(k + offset, cycleSize),
          wrap(k - offset, cycleSize),
        ])
      }
    } else {
      const center = half + k
      round.push([n, wrap(center, cycleSize)])

      for (let offset = 1; offset < half; offset++) {
        round.push([
          wrap(center + offset, cycleSize),
          wrap(center - offset, cycleSize),
        ])
      }
    }

    rounds.push(round)
  }

  return rounds
}

function wrap(value: number, size: number): number {
  return ((value - 1) % size + size) % size + 1
}
