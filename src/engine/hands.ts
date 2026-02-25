import type { HandRank, HandResult } from './types';

export const HAND_RANK_NAMES: Record<HandRank, string> = {
  five_of_a_kind: 'Five of a Kind',
  four_of_a_kind: 'Four of a Kind',
  full_house: 'Full House',
  straight: 'Straight',
  three_of_a_kind: 'Three of a Kind',
  two_pair: 'Two Pair',
  one_pair: 'One Pair',
  high_card: 'High Card',
};

export const HAND_RANK_ORDER: Record<HandRank, number> = {
  high_card: 0,
  one_pair: 1,
  two_pair: 2,
  three_of_a_kind: 3,
  straight: 4,
  full_house: 5,
  four_of_a_kind: 6,
  five_of_a_kind: 7,
};

// Evaluate up to 5 dice (by value) using the provided original indices.
function evaluateDice(values: number[], originalIndices: number[]): HandResult {
  if (values.length === 0) {
    return { rank: 'high_card', selectedIndices: [], tiebreakers: [0], values: [] };
  }

  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);

  // Sort groups: highest count first, then highest value first
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const maxCount = groups[0][1];
  const secondCount = groups[1]?.[1] ?? 0;

  const sorted = [...values].sort((a, b) => b - a); // descending
  const unique = [...new Set(values)].sort((a, b) => a - b); // ascending

  // Straight: exactly 5 dice, all unique, max-min === 4
  const isStraight = values.length === 5 && unique.length === 5 && unique[4] - unique[0] === 4;

  let rank: HandRank;
  let tiebreakers: number[];

  if (maxCount === 5) {
    rank = 'five_of_a_kind';
    tiebreakers = [groups[0][0]];
  } else if (maxCount === 4) {
    rank = 'four_of_a_kind';
    tiebreakers = groups[1] ? [groups[0][0], groups[1][0]] : [groups[0][0]];
  } else if (maxCount === 3 && secondCount >= 2) {
    rank = 'full_house';
    tiebreakers = [groups[0][0], groups[1][0]];
  } else if (isStraight) {
    rank = 'straight';
    tiebreakers = [unique[4]]; // highest card determines winner
  } else if (maxCount === 3) {
    rank = 'three_of_a_kind';
    const tripleVal = groups[0][0];
    const kickers = sorted.filter(v => v !== tripleVal);
    tiebreakers = [tripleVal, ...kickers];
  } else if (maxCount === 2 && secondCount >= 2) {
    rank = 'two_pair';
    const pairVals = groups
      .filter(g => g[1] >= 2)
      .map(g => g[0])
      .sort((a, b) => b - a)
      .slice(0, 2);
    const pairSet = new Set(pairVals);
    const kicker = sorted.find(v => !pairSet.has(v)) ?? 0;
    tiebreakers = [...pairVals, kicker];
  } else if (maxCount >= 2) {
    rank = 'one_pair';
    const pairVal = groups[0][0];
    let removed = 0;
    const kickers: number[] = [];
    for (const v of sorted) {
      if (v === pairVal && removed < 2) {
        removed++;
      } else {
        kickers.push(v);
      }
    }
    tiebreakers = [pairVal, ...kickers];
  } else {
    rank = 'high_card';
    tiebreakers = sorted;
  }

  return { rank, selectedIndices: originalIndices, tiebreakers, values };
}

// Generate all C(n, 5) index combinations (iterative, efficient)
function choose5(indices: number[]): number[][] {
  const result: number[][] = [];
  const n = indices.length;
  for (let a = 0; a < n - 4; a++) {
    for (let b = a + 1; b < n - 3; b++) {
      for (let c = b + 1; c < n - 2; c++) {
        for (let d = c + 1; d < n - 1; d++) {
          for (let e = d + 1; e < n; e++) {
            result.push([indices[a], indices[b], indices[c], indices[d], indices[e]]);
          }
        }
      }
    }
  }
  return result;
}

// Find the best 5-die poker hand from N dice.
// If N <= 5, evaluates all of them directly.
// selectedIndices in the returned HandResult are indices into the input `dice` array.
export function bestHand(dice: number[]): HandResult {
  if (dice.length === 0) {
    return { rank: 'high_card', selectedIndices: [], tiebreakers: [0], values: [] };
  }

  const allIndices = dice.map((_, i) => i);

  if (dice.length <= 5) {
    return evaluateDice(dice, allIndices);
  }

  // Try all C(N, 5) combinations, keep the best
  const combos = choose5(allIndices);
  let best: HandResult | null = null;

  for (const combo of combos) {
    const values = combo.map(i => dice[i]);
    const result = evaluateDice(values, combo);
    if (!best || compareHands(result, best) > 0) {
      best = result;
    }
  }

  return best!;
}

// Returns positive if a > b, negative if a < b, 0 if tied.
export function compareHands(a: HandResult, b: HandResult): number {
  const rankDiff = HAND_RANK_ORDER[a.rank] - HAND_RANK_ORDER[b.rank];
  if (rankDiff !== 0) return rankDiff;

  // Same rank: compare tiebreakers lexicographically
  const len = Math.max(a.tiebreakers.length, b.tiebreakers.length);
  for (let i = 0; i < len; i++) {
    const av = a.tiebreakers[i] ?? 0;
    const bv = b.tiebreakers[i] ?? 0;
    if (av !== bv) return av - bv;
  }

  return 0; // true tie
}

// Hand strength 0-1 for Gruber's AI decision-making
export function handStrength(hand: HandResult): number {
  const baseStrengths: Record<HandRank, number> = {
    high_card: 0.05,
    one_pair: 0.20,
    two_pair: 0.38,
    three_of_a_kind: 0.55,
    straight: 0.65,
    full_house: 0.75,
    four_of_a_kind: 0.90,
    five_of_a_kind: 1.00,
  };
  const base = baseStrengths[hand.rank];
  // Slight variance based on primary tiebreaker (0 to 0.08 bonus)
  const tb = hand.tiebreakers[0] ?? 3;
  const variance = ((tb - 1) / 5) * 0.08;
  return Math.min(1.0, base + variance);
}
