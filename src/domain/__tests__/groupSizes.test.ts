import { describe, it, expect } from 'vitest'
import { buildGroupSizes } from '../groupSizes'

describe('buildGroupSizes', () => {
  it('throws for n=0', () => {
    expect(() => buildGroupSizes(0, false)).toThrow('Minimum 3 participants required')
  })

  it('throws for n=1', () => {
    expect(() => buildGroupSizes(1, false)).toThrow('Minimum 3 participants required')
  })

  it('throws for n=2', () => {
    expect(() => buildGroupSizes(2, true)).toThrow('Minimum 3 participants required')
  })

  describe('useGroups=false (single group)', () => {
    it('n=3 → [4] (odd, adds Bye)', () => {
      expect(buildGroupSizes(3, false)).toEqual([4])
    })

    it('n=4 → [4] (even, no Bye)', () => {
      expect(buildGroupSizes(4, false)).toEqual([4])
    })

    it('n=5 → [6] (odd, adds Bye)', () => {
      expect(buildGroupSizes(5, false)).toEqual([6])
    })

    it('n=6 → [6] (even, no Bye)', () => {
      expect(buildGroupSizes(6, false)).toEqual([6])
    })

    it('n=7 → [8] (odd, adds Bye)', () => {
      expect(buildGroupSizes(7, false)).toEqual([8])
    })

    it('n=8 → [8] (even, no Bye)', () => {
      expect(buildGroupSizes(8, false)).toEqual([8])
    })

    it('n=11 → [12] (odd, adds Bye)', () => {
      expect(buildGroupSizes(11, false)).toEqual([12])
    })
  })

  describe('useGroups=true (spec table)', () => {
    it('n=3 → [4]', () => {
      expect(buildGroupSizes(3, true)).toEqual([4])
    })

    it('n=4 → [4]', () => {
      expect(buildGroupSizes(4, true)).toEqual([4])
    })

    it('n=5 → [6] (explicit exception)', () => {
      expect(buildGroupSizes(5, true)).toEqual([6])
    })

    it('n=6 → [3, 3]', () => {
      expect(buildGroupSizes(6, true)).toEqual([3, 3])
    })

    it('n=7 → [4, 3]', () => {
      expect(buildGroupSizes(7, true)).toEqual([4, 3])
    })

    it('n=8 → [4, 4]', () => {
      expect(buildGroupSizes(8, true)).toEqual([4, 4])
    })

    it('n=9 → [3, 3, 3]', () => {
      expect(buildGroupSizes(9, true)).toEqual([3, 3, 3])
    })

    it('n=10 → [4, 3, 3]', () => {
      expect(buildGroupSizes(10, true)).toEqual([4, 3, 3])
    })

    it('n=11 → [4, 4, 3]', () => {
      expect(buildGroupSizes(11, true)).toEqual([4, 4, 3])
    })

    it('n=12 → [4, 4, 4]', () => {
      expect(buildGroupSizes(12, true)).toEqual([4, 4, 4])
    })

    it('n=13 → [4, 3, 3, 3] (general rule)', () => {
      expect(buildGroupSizes(13, true)).toEqual([4, 3, 3, 3])
    })

    it('n=14 → [4, 4, 3, 3] (general rule)', () => {
      expect(buildGroupSizes(14, true)).toEqual([4, 4, 3, 3])
    })

    it('n=16 → [4, 4, 4, 4] (general rule)', () => {
      expect(buildGroupSizes(16, true)).toEqual([4, 4, 4, 4])
    })

    it('group sizes never include 2 or 5', () => {
      for (let n = 3; n <= 20; n++) {
        const sizes = buildGroupSizes(n, true)
        sizes.forEach(s => {
          expect(s).not.toBe(2)
          expect(s).not.toBe(5)
        })
      }
    })
  })
})
