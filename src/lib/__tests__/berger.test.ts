import { describe, it, expect } from 'vitest'
import { bergerTable } from '../berger'

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

    it('produces 3 rounds', () => {
      expect(table).toHaveLength(3)
    })

    it('each round has 2 matches', () => {
      table.forEach(round => expect(round).toHaveLength(2))
    })

    it('round 1: [1,4] and [2,3]', () => {
      expect(table[0]).toEqual([[1, 4], [2, 3]])
    })

    it('round 2: [4,3] and [1,2]', () => {
      expect(table[1]).toEqual([[4, 3], [1, 2]])
    })

    it('round 3: [2,4] and [3,1]', () => {
      expect(table[2]).toEqual([[2, 4], [3, 1]])
    })

    it('every pair of players appears exactly once', () => {
      const pairs = table.flat().map(([w, b]) => [Math.min(w, b), Math.max(w, b)].join('-'))
      const expected = ['1-2', '1-3', '1-4', '2-3', '2-4', '3-4']
      expect(pairs.sort()).toEqual(expected.sort())
    })
  })

  describe('n=6', () => {
    const table = bergerTable(6)

    it('produces 5 rounds', () => {
      expect(table).toHaveLength(5)
    })

    it('each round has 3 matches', () => {
      table.forEach(round => expect(round).toHaveLength(3))
    })

    it('every player appears exactly once per round', () => {
      table.forEach(round => {
        const players = round.flat()
        expect(new Set(players).size).toBe(6)
      })
    })

    it('every pair of players meets exactly once', () => {
      const pairs = table.flat().map(([w, b]) => [Math.min(w, b), Math.max(w, b)].join('-'))
      expect(pairs).toHaveLength(15)
      expect(new Set(pairs).size).toBe(15)
    })
  })

  describe('n=8', () => {
    const table = bergerTable(8)

    it('produces 7 rounds', () => {
      expect(table).toHaveLength(7)
    })

    it('each round has 4 matches', () => {
      table.forEach(round => expect(round).toHaveLength(4))
    })

    it('every pair of players meets exactly once', () => {
      const pairs = table.flat().map(([w, b]) => [Math.min(w, b), Math.max(w, b)].join('-'))
      expect(pairs).toHaveLength(28)
      expect(new Set(pairs).size).toBe(28)
    })
  })
})
