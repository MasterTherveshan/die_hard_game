import type { Difficulty, DifficultyConfig } from './types';

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    playerStartDice: 8,
    gruberStartDice: 6,
    healthValues: [8, 11, 15, 19],
    gruberFoldThreshold: 0.45,
  },
  medium: {
    playerStartDice: 6,
    gruberStartDice: 5,
    healthValues: [6, 9, 12, 16],
    gruberFoldThreshold: 0.52,
  },
  hard: {
    playerStartDice: 6,
    gruberStartDice: 7,
    healthValues: [8, 11, 15, 20],
    gruberFoldThreshold: 0.68,
  },
};

// Base loot dice per floor (randomized ±1 per run)
const BASE_LOOT_DICE = [3, 4, 4, 5];

export function generateFloorData(difficulty: Difficulty): { health: number[]; lootDice: number[] } {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const health = config.healthValues.map(h => h);
  const lootDice = BASE_LOOT_DICE.map(d => Math.max(2, d + Math.floor(Math.random() * 3) - 1));
  return { health, lootDice };
}

export function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollDice(count: number): number[] {
  return Array.from({ length: Math.max(0, count) }, rollDie);
}
