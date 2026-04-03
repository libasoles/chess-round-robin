import type { Match, Participant, TournamentSettings } from './types'

/**
 * Calculates the points awarded to each side for a completed (or null) match.
 *
 * For auto_bye matches, the participants map is used to identify which side is
 * the Bye (who scores 0) and which is the real player (who scores byePoints).
 */
export function resolveMatchPoints(
  match: Match,
  settings: TournamentSettings,
  participants: ReadonlyMap<string, Participant>,
): { whitePoints: number; blackPoints: number } {
  switch (match.result) {
    case null:
      return { whitePoints: 0, blackPoints: 0 }
    case 'white_win':
      return { whitePoints: 1, blackPoints: 0 }
    case 'black_win':
      return { whitePoints: 0, blackPoints: 1 }
    case 'draw':
      return { whitePoints: 0.5, blackPoints: 0.5 }
    case 'forfeit_white':
      return { whitePoints: 0, blackPoints: settings.forfeitPoints }
    case 'forfeit_black':
      return { whitePoints: settings.forfeitPoints, blackPoints: 0 }
    case 'auto_bye': {
      const whiteParticipant = participants.get(match.white)
      const isWhiteBye = whiteParticipant?.isBye ?? false
      if (isWhiteBye) {
        return { whitePoints: 0, blackPoints: settings.byePoints }
      }
      return { whitePoints: settings.byePoints, blackPoints: 0 }
    }
  }
}
