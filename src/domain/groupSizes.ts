/**
 * Determines how to distribute n real participants into groups.
 *
 * Sizes represent:
 * - For useGroups=false: a single group. Size includes a Bye if n is odd.
 * - For useGroups=true: per the spec table. Sizes for n=3 ([4]) and n=5 ([6])
 *   include a Bye slot. Groups of 3 get a Bye added dynamically during pairing.
 */
export function buildGroupSizes(n: number, useGroups: boolean): number[] {
  if (n < 3) {
    throw new Error('Minimum 3 participants required')
  }

  if (!useGroups) {
    return n % 2 === 0 ? [n] : [n + 1]
  }

  // useGroups = true — spec table (n=3..12 hardcoded; general rule for n>12)
  switch (n) {
    case 3:  return [4]          // 3 real + 1 Bye
    case 4:  return [4]
    case 5:  return [6]          // explicit exception: 5 real + 1 Bye, single group
    case 6:  return [3, 3]
    case 7:  return [4, 3]
    case 8:  return [4, 4]
    case 9:  return [3, 3, 3]
    case 10: return [4, 3, 3]
    case 11: return [4, 4, 3]
    case 12: return [4, 4, 4]
    default: return buildGroupSizesGeneral(n)
  }
}

/**
 * General algorithm for n > 12:
 * Prefer groups of 4; use groups of 3 to balance.
 * Never produce groups of 2 or 5.
 */
function buildGroupSizesGeneral(n: number): number[] {
  const groups: number[] = []
  let remaining = n

  while (remaining > 0) {
    const mod = remaining % 4
    if (mod === 0) {
      // Fill remainder with groups of 4
      while (remaining > 0) {
        groups.push(4)
        remaining -= 4
      }
    } else if (mod === 1) {
      // 4k+1: replace one group of 4 with three groups of 3 (3+3+3 = 9 = 4+4+1 re-balanced)
      // But simpler: take three groups of 3 (consuming 9), rest divisible by 4
      // Only valid if remaining >= 9
      groups.push(3)
      groups.push(3)
      groups.push(3)
      remaining -= 9
    } else if (mod === 2) {
      // 4k+2: two groups of 3 cover 6, rest divisible by 4
      groups.push(3)
      groups.push(3)
      remaining -= 6
    } else {
      // mod === 3: one group of 3, rest divisible by 4
      groups.push(3)
      remaining -= 3
    }
  }

  return groups.sort((a, b) => b - a)
}
