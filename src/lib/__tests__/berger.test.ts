import { describe, it, expect } from 'vitest'
import { bergerTable } from '../berger'

function pairKey(white: number, black: number): string {
  return [white, black].sort((a, b) => a - b).join('-')
}

function colorCounts(table: [number, number][][], player: number): { white: number, black: number } {
  return table.flat().reduce(
    (counts, [white, black]) => {
      if (white === player) counts.white++
      if (black === player) counts.black++
      return counts
    },
    { white: 0, black: 0 },
  )
}

function maxColorStreak(table: [number, number][][], player: number): number {
  let currentColor: 'white' | 'black' | null = null
  let currentStreak = 0
  let maxStreak = 0

  for (const round of table) {
    const match = round.find(([white, black]) => white === player || black === player)
    if (!match) continue

    const color = match[0] === player ? 'white' : 'black'
    if (color === currentColor) {
      currentStreak++
    } else {
      currentColor = color
      currentStreak = 1
    }
    maxStreak = Math.max(maxStreak, currentStreak)
  }

  return maxStreak
}

describe('bergerTable', () => {
  it('throws for odd n', () => {
    expect(() => bergerTable(3)).toThrow()
    expect(() => bergerTable(5)).toThrow()
  })

  it('throws for n < 4', () => {
    expect(() => bergerTable(2)).toThrow()
    expect(() => bergerTable(0)).toThrow()
  })

  describe('n=4', () => {
    const table = bergerTable(4)

    it('matches the FIDE Berger table', () => {
      expect(table).toEqual([
        [[1, 4], [2, 3]],
        [[4, 3], [1, 2]],
        [[2, 4], [3, 1]],
      ])
    })
  })

  describe('n=6', () => {
    const table = bergerTable(6)

    it('matches the FIDE Berger table', () => {
      expect(table).toEqual([
        [[1, 6], [2, 5], [3, 4]],
        [[6, 4], [5, 3], [1, 2]],
        [[2, 6], [3, 1], [4, 5]],
        [[6, 5], [1, 4], [2, 3]],
        [[3, 6], [4, 2], [5, 1]],
      ])
    })
  })

  describe('n=8', () => {
    const table = bergerTable(8)

    it('matches the FIDE Berger table', () => {
      expect(table).toEqual([
        [[1, 8], [2, 7], [3, 6], [4, 5]],
        [[8, 5], [6, 4], [7, 3], [1, 2]],
        [[2, 8], [3, 1], [4, 7], [5, 6]],
        [[8, 6], [7, 5], [1, 4], [2, 3]],
        [[3, 8], [4, 2], [5, 1], [6, 7]],
        [[8, 7], [1, 6], [2, 5], [3, 4]],
        [[4, 8], [5, 3], [6, 2], [7, 1]],
      ])
    })
  })

  describe.each([4, 6, 8, 10, 12, 14, 16])('n=%i invariants', n => {
    const table = bergerTable(n)

    it('produces n-1 rounds', () => {
      expect(table).toHaveLength(n - 1)
    })

    it('each round has n/2 matches and every player appears once', () => {
      table.forEach(round => {
        expect(round).toHaveLength(n / 2)
        expect(new Set(round.flat()).size).toBe(n)
      })
    })

    it('every pair of players meets exactly once', () => {
      const pairs = table.flat().map(([white, black]) => pairKey(white, black))
      expect(pairs).toHaveLength((n * (n - 1)) / 2)
      expect(new Set(pairs).size).toBe((n * (n - 1)) / 2)
    })

    it('keeps color counts balanced', () => {
      for (let player = 1; player <= n; player++) {
        const counts = colorCounts(table, player)
        expect(Math.abs(counts.white - counts.black)).toBeLessThanOrEqual(1)
      }
    })

    it('avoids streaks longer than two games with the same color', () => {
      for (let player = 1; player <= n; player++) {
        expect(maxColorStreak(table, player)).toBeLessThanOrEqual(2)
      }
    })
  })
})
