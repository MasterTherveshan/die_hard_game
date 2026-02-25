import { bestHand, compareHands, handStrength } from './hands';
import type { HandResult } from './types';

export interface FinaleRoundSetup {
  potDice: number;
  playerRollCount: number;
  gruberRollCount: number;
}

export interface FinaleRollResult {
  playerRoll: number[];
  gruberRoll: number[];
  playerHand: HandResult;
  gruberHand: HandResult;
}

export type GruberDecision = 'call' | 'fold';

// Gruber decides whether to call or fold a player's raise.
// foldThreshold: difficulty-based threshold (0-1)
// random: a random number 0-1 passed in (keeps engine pure)
export function gruberRespondToRaise(
  gruberHand: HandResult,
  foldThreshold: number,
  random: number,
): GruberDecision {
  const strength = handStrength(gruberHand);

  // Strong hand: always calls
  if (strength >= foldThreshold + 0.15) return 'call';

  // Weak hand: always folds
  if (strength < foldThreshold - 0.15) return 'fold';

  // Medium hand: ~25% hero-call / bluff rate
  return random < 0.25 ? 'call' : 'fold';
}

export interface ShowdownResult {
  playerHand: HandResult;
  gruberHand: HandResult;
  playerWins: boolean; // ties go against player
  potDice: number;
  playerDiceDelta: number; // how player's dice change (pot delta)
  gruberDiceDelta: number;
}

// Resolve a showdown. Both players have already had their pot contributions deducted
// from their dice pools. The winner receives ALL pot dice back (their own + opponent's).
// The loser receives nothing (their contribution is forfeited).
export function resolveShowdown(
  playerHand: HandResult,
  gruberHand: HandResult,
  potDice: number,
): ShowdownResult {
  const cmp = compareHands(playerHand, gruberHand);
  const playerWins = cmp > 0;

  // Winner gets the whole pot; loser gets nothing (their ante was already removed).
  const playerDiceDelta = playerWins ? potDice : 0;
  const gruberDiceDelta = playerWins ? 0 : potDice;

  return {
    playerHand,
    gruberHand,
    playerWins,
    potDice,
    playerDiceDelta,
    gruberDiceDelta,
  };
}

export function evaluateFinaleRolls(playerRoll: number[], gruberRoll: number[]): FinaleRollResult {
  return {
    playerRoll,
    gruberRoll,
    playerHand: bestHand(playerRoll),
    gruberHand: bestHand(gruberRoll),
  };
}
