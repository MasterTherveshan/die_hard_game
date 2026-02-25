import { bestHand, compareHands } from './hands';
import type { HandResult } from './types';

export interface DefeatResult {
  roll: number[];
  sum: number;
  target: number;
  success: boolean;
}

export function resolveDefeat(roll: number[], health: number): DefeatResult {
  const sum = roll.reduce((a, b) => a + b, 0);
  return { roll, sum, target: health, success: sum >= health };
}

export interface LootResult {
  playerRoll: number[];
  enemyRoll: number[];
  playerHand: HandResult;
  enemyHand: HandResult;
  playerWins: boolean; // false on tie (ties go against player)
  dieDelta: number;    // +1 on win, -1 on loss
}

export function resolveLoot(playerRoll: number[], enemyRoll: number[]): LootResult {
  const playerHand = bestHand(playerRoll);
  const enemyHand = bestHand(enemyRoll);
  const cmp = compareHands(playerHand, enemyHand);
  const playerWins = cmp > 0; // strictly better; ties go against player
  return {
    playerRoll,
    enemyRoll,
    playerHand,
    enemyHand,
    playerWins,
    dieDelta: playerWins ? 1 : -1,
  };
}
