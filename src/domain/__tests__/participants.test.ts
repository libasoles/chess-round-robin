import { describe, it, expect } from 'vitest'
import {
  normalizeName,
  validateParticipants,
  assignParticipantsToGroups,
  BYE_PARTICIPANT,
  GROUP_NAMES,
} from '../participants'
import type { Participant } from '../types'

function makeParticipant(id: string, name: string): Participant {
  return { id, name, isBye: false }
}

function makeParticipants(count: number): Participant[] {
  return Array.from({ length: count }, (_, i) =>
    makeParticipant(`p${i + 1}`, `Player ${i + 1}`),
  )
}

describe('normalizeName', () => {
  it('capitalizes first letter of single word', () => {
    expect(normalizeName('john')).toBe('John')
  })

  it('capitalizes first letter of each word', () => {
    expect(normalizeName('john doe')).toBe('John Doe')
  })

  it('lowercases other letters', () => {
    expect(normalizeName('JOHN DOE')).toBe('John Doe')
  })

  it('trims leading and trailing whitespace', () => {
    expect(normalizeName('  john  ')).toBe('John')
  })

  it('collapses multiple internal spaces', () => {
    expect(normalizeName('  john   doe  ')).toBe('John Doe')
  })

  it('handles empty string', () => {
    expect(normalizeName('')).toBe('')
  })

  it('handles single character', () => {
    expect(normalizeName('o')).toBe('O')
  })

  it('handles mixed case in the middle', () => {
    expect(normalizeName('mARIA jOSE')).toBe('Maria Jose')
  })
})

describe('validateParticipants', () => {
  it('returns invalid for empty array', () => {
    const result = validateParticipants([])
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.errors.length).toBeGreaterThan(0)
  })

  it('returns invalid for 1 participant', () => {
    expect(validateParticipants(['Alice']).valid).toBe(false)
  })

  it('returns invalid for 2 participants', () => {
    expect(validateParticipants(['Alice', 'Bob']).valid).toBe(false)
  })

  it('returns valid for 3 participants', () => {
    expect(validateParticipants(['Alice', 'Bob', 'Charlie']).valid).toBe(true)
  })

  it('returns valid for 4 participants', () => {
    expect(validateParticipants(['Alice', 'Bob', 'Charlie', 'Dave']).valid).toBe(true)
  })

  it('returns invalid for exact duplicate names', () => {
    const result = validateParticipants(['Alice', 'Alice', 'Bob'])
    expect(result.valid).toBe(false)
  })

  it('returns invalid for case-insensitive duplicates', () => {
    const result = validateParticipants(['Alice', 'alice', 'Bob'])
    expect(result.valid).toBe(false)
  })

  it('returns invalid for duplicates after normalization', () => {
    const result = validateParticipants(['alice', 'ALICE', 'Bob'])
    expect(result.valid).toBe(false)
  })

  it('ignores empty strings when counting', () => {
    // 2 non-empty → invalid
    const result = validateParticipants(['Alice', '', 'Bob'])
    expect(result.valid).toBe(false)
  })

  it('returns invalid with error message listing duplicates', () => {
    const result = validateParticipants(['Alice', 'Alice', 'Bob', 'Bob', 'Charlie'])
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors.some(e => e.toLowerCase().includes('duplicate'))).toBe(true)
    }
  })
})

describe('assignParticipantsToGroups', () => {
  it('3 participants + sizes=[4] → 1 group ALFA with 3 real + Bye', () => {
    const ps = makeParticipants(3)
    const groups = assignParticipantsToGroups(ps, [4])
    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe('ALFA')
    expect(groups[0].participants).toHaveLength(4)
    expect(groups[0].participants[3]).toEqual(BYE_PARTICIPANT)
    expect(groups[0].participants.filter(p => p.isBye)).toHaveLength(1)
  })

  it('5 participants + sizes=[6] → 1 group ALFA with 5 real + Bye', () => {
    const ps = makeParticipants(5)
    const groups = assignParticipantsToGroups(ps, [6])
    expect(groups).toHaveLength(1)
    expect(groups[0].participants).toHaveLength(6)
    expect(groups[0].participants[5]).toEqual(BYE_PARTICIPANT)
  })

  it('4 participants + sizes=[4] → 1 group, no Bye', () => {
    const ps = makeParticipants(4)
    const groups = assignParticipantsToGroups(ps, [4])
    expect(groups).toHaveLength(1)
    expect(groups[0].participants).toHaveLength(4)
    expect(groups[0].participants.every(p => !p.isBye)).toBe(true)
  })

  it('6 participants + sizes=[3,3] → 2 groups, no Byes', () => {
    const ps = makeParticipants(6)
    const groups = assignParticipantsToGroups(ps, [3, 3])
    expect(groups).toHaveLength(2)
    expect(groups[0].name).toBe('ALFA')
    expect(groups[1].name).toBe('BETA')
    expect(groups[0].participants).toHaveLength(3)
    expect(groups[1].participants).toHaveLength(3)
    expect(groups[0].participants.every(p => !p.isBye)).toBe(true)
    expect(groups[1].participants.every(p => !p.isBye)).toBe(true)
  })

  it('7 participants + sizes=[4,3] → ALFA(4 real), BETA(3 real, no Bye appended)', () => {
    const ps = makeParticipants(7)
    const groups = assignParticipantsToGroups(ps, [4, 3])
    expect(groups[0].participants).toHaveLength(4)
    expect(groups[1].participants).toHaveLength(3)
    expect(groups[1].participants.every(p => !p.isBye)).toBe(true)
  })

  it('assigns groups names in order: ALFA, BETA, GAMMA', () => {
    const ps = makeParticipants(9)
    const groups = assignParticipantsToGroups(ps, [3, 3, 3])
    expect(groups[0].name).toBe(GROUP_NAMES[0])
    expect(groups[1].name).toBe(GROUP_NAMES[1])
    expect(groups[2].name).toBe(GROUP_NAMES[2])
  })

  it('each group starts with an empty matches array', () => {
    const ps = makeParticipants(4)
    const groups = assignParticipantsToGroups(ps, [4])
    expect(groups[0].matches).toEqual([])
  })

  it('no participant appears in more than one group', () => {
    const ps = makeParticipants(8)
    const groups = assignParticipantsToGroups(ps, [4, 4])
    const allIds = groups.flatMap(g => g.participants.map(p => p.id))
    const realIds = allIds.filter(id => id !== 'bye')
    expect(new Set(realIds).size).toBe(realIds.length)
  })

  it('BYE_PARTICIPANT has id=bye, name=Libre, isBye=true', () => {
    expect(BYE_PARTICIPANT.id).toBe('bye')
    expect(BYE_PARTICIPANT.name).toBe('Libre')
    expect(BYE_PARTICIPANT.isBye).toBe(true)
  })
})
