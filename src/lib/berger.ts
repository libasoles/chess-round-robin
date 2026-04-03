/**
 * Berger circle method for generating round-robin tournament schedules.
 *
 * Returns (n-1) rounds, each with (n/2) matches.
 * Each match is [whiteIndex, blackIndex] using 1-based player indices.
 *
 * Algorithm:
 * - Player n is fixed as the anchor.
 * - Players [1..n-1] rotate counterclockwise each round.
 * - On even rounds (r=0,2,...): anchor plays as Black → [players[0], n]
 * - On odd rounds (r=1,3,...): anchor plays as White → [n, players[0]]
 * - Remaining matches pair players[i] vs players[n-2-i] for i=1..(n/2-1)
 */
export function bergerTable(n: number): [number, number][][] {
  if (n < 4 || n % 2 !== 0) {
    throw new Error(`bergerTable requires an even number >= 4, got ${n}`)
  }

  const rounds: [number, number][][] = []
  const players: number[] = Array.from({ length: n - 1 }, (_, i) => i + 1)
  const fixed = n

  for (let r = 0; r < n - 1; r++) {
    const round: [number, number][] = []

    // Anchor match — alternates color each round
    if (r % 2 === 0) {
      round.push([players[0], fixed])  // anchor is Black
    } else {
      round.push([fixed, players[0]])  // anchor is White
    }

    // Remaining matches: pair position i with its mirror in the players array.
    // players has n-1 elements (indices 0..n-2), so the mirror of index i is n-1-i.
    for (let i = 1; i <= (n - 2) / 2; i++) {
      round.push([players[i], players[n - 1 - i]])
    }

    rounds.push(round)

    // Rotate players counterclockwise: last goes to front
    const last = players.pop()!
    players.unshift(last)
  }

  return rounds
}
