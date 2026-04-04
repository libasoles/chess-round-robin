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

  it('n=2 with minN=2 → [2] (new phase minimum)', () => {
    expect(buildGroupSizes(2, false, 4, 2)).toEqual([2])
  })

  it('n=2 with minN=2 throws for n=1', () => {
    expect(() => buildGroupSizes(1, false, 4, 2)).toThrow('Minimum 2 participants required')
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

  describe('useGroups=true, groupSize=4 (default)', () => {
    it('n=3 → [4] (n <= groupSize+1, odd → Bye)', () => {
      expect(buildGroupSizes(3, true)).toEqual([4])
    })

    it('n=4 → [4] (n <= groupSize+1, even)', () => {
      expect(buildGroupSizes(4, true)).toEqual([4])
    })

    it('n=5 → [6] (n = groupSize+1, odd → Bye)', () => {
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

    it('group sizes never include 2 or 5 for groupSize=4', () => {
      for (let n = 3; n <= 20; n++) {
        const sizes = buildGroupSizes(n, true)
        sizes.forEach(s => {
          expect(s).not.toBe(2)
          expect(s).not.toBe(5)
        })
      }
    })
  })

  describe('useGroups=true, custom groupSize', () => {
    it('n=5, groupSize=6 → [6] (n <= 6+1=7, odd → Bye)', () => {
      expect(buildGroupSizes(5, true, 6)).toEqual([6])
    })

    it('n=7, groupSize=6 → [8] (n = groupSize+1, odd → Bye)', () => {
      expect(buildGroupSizes(7, true, 6)).toEqual([8])
    })

    it('n=8, groupSize=6 → [4, 4] (k=2, base=4)', () => {
      expect(buildGroupSizes(8, true, 6)).toEqual([4, 4])
    })

    it('n=12, groupSize=6 → [6, 6]', () => {
      expect(buildGroupSizes(12, true, 6)).toEqual([6, 6])
    })

    it('n=13, groupSize=6 → [5, 4, 4] (k=3, base=4, extra=1)', () => {
      expect(buildGroupSizes(13, true, 6)).toEqual([5, 4, 4])
    })

    it('n=9, groupSize=6 → [5, 4] (k=2)', () => {
      expect(buildGroupSizes(9, true, 6)).toEqual([5, 4])
    })

    it('n=16, groupSize=8 → [8, 8]', () => {
      expect(buildGroupSizes(16, true, 8)).toEqual([8, 8])
    })

    it('n=9, groupSize=8 → [5, 4] (n=groupSize+1, 9 odd → [10])', () => {
      expect(buildGroupSizes(9, true, 8)).toEqual([10])
    })

    it('n=10, groupSize=8 → [5, 5] (k=2, base=5)', () => {
      expect(buildGroupSizes(10, true, 8)).toEqual([5, 5])
    })
  })
})
