import { describe, it, expect } from 'vitest'
import { resolveMatchPoints } from '../scoring'
import type { Match, Participant, TournamentSettings } from '../types'

const defaultSettings: TournamentSettings = {
  arbitratorName: 'Test',
  forfeitPoints: 0,
  byePoints: 1,
  tiebreakOrder: ['DE', 'SB'],
  useGroups: true,
}

function makeMatch(result: Match['result'], white = 'p1', black = 'p2'): Match {
  return { id: 'm1', white, black, round: 1, result }
}

function makeParticipantMap(entries: Participant[]): ReadonlyMap<string, Participant> {
  return new Map(entries.map(p => [p.id, p]))
}

const realWhite: Participant = { id: 'p1', name: 'Alice', isBye: false }
const realBlack: Participant = { id: 'p2', name: 'Bob', isBye: false }
const byeParticipant: Participant = { id: 'bye', name: 'Libre', isBye: true }

const noByeMap = makeParticipantMap([realWhite, realBlack])
const byeWhiteMap = makeParticipantMap([byeParticipant, realBlack])
const byeBlackMap = makeParticipantMap([realWhite, byeParticipant])

describe('resolveMatchPoints', () => {
  it('null result → 0, 0', () => {
    expect(resolveMatchPoints(makeMatch(null), defaultSettings, noByeMap))
      .toEqual({ whitePoints: 0, blackPoints: 0 })
  })

  it('white_win → 1, 0', () => {
    expect(resolveMatchPoints(makeMatch('white_win'), defaultSettings, noByeMap))
      .toEqual({ whitePoints: 1, blackPoints: 0 })
  })

  it('black_win → 0, 1', () => {
    expect(resolveMatchPoints(makeMatch('black_win'), defaultSettings, noByeMap))
      .toEqual({ whitePoints: 0, blackPoints: 1 })
  })

  it('draw → 0.5, 0.5', () => {
    expect(resolveMatchPoints(makeMatch('draw'), defaultSettings, noByeMap))
      .toEqual({ whitePoints: 0.5, blackPoints: 0.5 })
  })

  describe('forfeit_white', () => {
    it('forfeitPoints=0 → 0, 0', () => {
      const s = { ...defaultSettings, forfeitPoints: 0 as const }
      expect(resolveMatchPoints(makeMatch('forfeit_white'), s, noByeMap))
        .toEqual({ whitePoints: 0, blackPoints: 0 })
    })

    it('forfeitPoints=0.5 → 0, 0.5', () => {
      const s = { ...defaultSettings, forfeitPoints: 0.5 as const }
      expect(resolveMatchPoints(makeMatch('forfeit_white'), s, noByeMap))
        .toEqual({ whitePoints: 0, blackPoints: 0.5 })
    })

    it('forfeitPoints=1 → 0, 1', () => {
      const s = { ...defaultSettings, forfeitPoints: 1 as const }
      expect(resolveMatchPoints(makeMatch('forfeit_white'), s, noByeMap))
        .toEqual({ whitePoints: 0, blackPoints: 1 })
    })
  })

  describe('forfeit_black', () => {
    it('forfeitPoints=0 → 0, 0', () => {
      const s = { ...defaultSettings, forfeitPoints: 0 as const }
      expect(resolveMatchPoints(makeMatch('forfeit_black'), s, noByeMap))
        .toEqual({ whitePoints: 0, blackPoints: 0 })
    })

    it('forfeitPoints=0.5 → 0.5, 0', () => {
      const s = { ...defaultSettings, forfeitPoints: 0.5 as const }
      expect(resolveMatchPoints(makeMatch('forfeit_black'), s, noByeMap))
        .toEqual({ whitePoints: 0.5, blackPoints: 0 })
    })

    it('forfeitPoints=1 → 1, 0', () => {
      const s = { ...defaultSettings, forfeitPoints: 1 as const }
      expect(resolveMatchPoints(makeMatch('forfeit_black'), s, noByeMap))
        .toEqual({ whitePoints: 1, blackPoints: 0 })
    })
  })

  describe('auto_bye', () => {
    it('black=Bye, byePoints=1 → white gets 1', () => {
      const match = makeMatch('auto_bye', 'p1', 'bye')
      expect(resolveMatchPoints(match, { ...defaultSettings, byePoints: 1 }, byeBlackMap))
        .toEqual({ whitePoints: 1, blackPoints: 0 })
    })

    it('black=Bye, byePoints=0.5 → white gets 0.5', () => {
      const match = makeMatch('auto_bye', 'p1', 'bye')
      expect(resolveMatchPoints(match, { ...defaultSettings, byePoints: 0.5 as const }, byeBlackMap))
        .toEqual({ whitePoints: 0.5, blackPoints: 0 })
    })

    it('black=Bye, byePoints=0 → white gets 0', () => {
      const match = makeMatch('auto_bye', 'p1', 'bye')
      expect(resolveMatchPoints(match, { ...defaultSettings, byePoints: 0 as const }, byeBlackMap))
        .toEqual({ whitePoints: 0, blackPoints: 0 })
    })

    it('white=Bye, byePoints=1 → black gets 1', () => {
      const match = makeMatch('auto_bye', 'bye', 'p2')
      expect(resolveMatchPoints(match, { ...defaultSettings, byePoints: 1 }, byeWhiteMap))
        .toEqual({ whitePoints: 0, blackPoints: 1 })
    })

    it('white=Bye, byePoints=0.5 → black gets 0.5', () => {
      const match = makeMatch('auto_bye', 'bye', 'p2')
      expect(resolveMatchPoints(match, { ...defaultSettings, byePoints: 0.5 as const }, byeWhiteMap))
        .toEqual({ whitePoints: 0, blackPoints: 0.5 })
    })
  })
})
