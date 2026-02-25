import { describe, it, expect } from 'vitest';
import { bestHand, compareHands, HAND_RANK_ORDER } from './hands';

// ─── Hand identification ────────────────────────────────────────────────────

describe('hand identification', () => {
  it('identifies five of a kind', () => {
    expect(bestHand([4, 4, 4, 4, 4]).rank).toBe('five_of_a_kind');
  });

  it('identifies four of a kind', () => {
    expect(bestHand([3, 3, 3, 3, 6]).rank).toBe('four_of_a_kind');
  });

  it('identifies full house', () => {
    expect(bestHand([5, 5, 5, 2, 2]).rank).toBe('full_house');
  });

  it('identifies straight (low)', () => {
    expect(bestHand([1, 2, 3, 4, 5]).rank).toBe('straight');
  });

  it('identifies straight (high)', () => {
    expect(bestHand([2, 3, 4, 5, 6]).rank).toBe('straight');
  });

  it('identifies three of a kind', () => {
    expect(bestHand([6, 6, 6, 2, 4]).rank).toBe('three_of_a_kind');
  });

  it('identifies two pair', () => {
    expect(bestHand([3, 3, 5, 5, 1]).rank).toBe('two_pair');
  });

  it('identifies one pair', () => {
    expect(bestHand([2, 2, 4, 5, 6]).rank).toBe('one_pair');
  });

  it('identifies high card', () => {
    expect(bestHand([1, 2, 4, 5, 6]).rank).toBe('high_card');
  });

  it('does NOT identify a non-consecutive sequence as straight', () => {
    expect(bestHand([1, 2, 3, 4, 6]).rank).toBe('high_card');
  });
});

// ─── Best 5-of-N selection ──────────────────────────────────────────────────

describe('best 5-of-N selection', () => {
  it('picks the best hand from 6 dice', () => {
    // [6,6,6,6,1,2] — best 5 is four 6s
    const result = bestHand([6, 6, 6, 6, 1, 2]);
    expect(result.rank).toBe('four_of_a_kind');
    expect(result.tiebreakers[0]).toBe(6);
  });

  it('picks straight from 7 dice when possible', () => {
    // [1,2,3,4,5,1,1] — best 5 contains 1-2-3-4-5 straight
    const result = bestHand([1, 2, 3, 4, 5, 1, 1]);
    expect(result.rank).toBe('straight');
  });

  it('picks the highest full house from 7 dice', () => {
    // [5,5,5,2,2,3,3] — full house 5s over 3s beats 5s over 2s
    const result = bestHand([5, 5, 5, 2, 2, 3, 3]);
    expect(result.rank).toBe('full_house');
    expect(result.tiebreakers[0]).toBe(5);
    expect(result.tiebreakers[1]).toBe(3);
  });

  it('handles exactly 5 dice without searching', () => {
    const result = bestHand([1, 3, 5, 2, 4]);
    expect(result.rank).toBe('straight');
    expect(result.selectedIndices).toEqual([0, 1, 2, 3, 4]);
  });

  it('handles fewer than 5 dice', () => {
    const result = bestHand([4, 4, 4]);
    expect(result.rank).toBe('three_of_a_kind');
  });
});

// ─── Hand comparison / ranking ──────────────────────────────────────────────

describe('hand comparison', () => {
  it('five of a kind beats four of a kind', () => {
    const foak = bestHand([3, 3, 3, 3, 1]);
    const five = bestHand([2, 2, 2, 2, 2]);
    expect(compareHands(five, foak)).toBeGreaterThan(0);
  });

  it('four of a kind beats full house', () => {
    const fh = bestHand([5, 5, 5, 4, 4]);
    const foak = bestHand([3, 3, 3, 3, 6]);
    expect(compareHands(foak, fh)).toBeGreaterThan(0);
  });

  it('full house beats straight', () => {
    const straight = bestHand([1, 2, 3, 4, 5]);
    const fh = bestHand([2, 2, 2, 3, 3]);
    expect(compareHands(fh, straight)).toBeGreaterThan(0);
  });

  it('higher four-of-a-kind wins', () => {
    const low = bestHand([2, 2, 2, 2, 6]);
    const high = bestHand([5, 5, 5, 5, 1]);
    expect(compareHands(high, low)).toBeGreaterThan(0);
  });

  it('higher full house (triple) wins', () => {
    const lowFH = bestHand([3, 3, 3, 6, 6]);
    const highFH = bestHand([4, 4, 4, 1, 1]);
    expect(compareHands(highFH, lowFH)).toBeGreaterThan(0);
  });

  it('higher straight wins', () => {
    const low = bestHand([1, 2, 3, 4, 5]);
    const high = bestHand([2, 3, 4, 5, 6]);
    expect(compareHands(high, low)).toBeGreaterThan(0);
  });

  it('higher two pair wins', () => {
    const lowTP = bestHand([3, 3, 2, 2, 6]);
    const highTP = bestHand([4, 4, 2, 2, 1]);
    expect(compareHands(highTP, lowTP)).toBeGreaterThan(0);
  });

  it('same rank same value is a tie (returns 0)', () => {
    const a = bestHand([5, 5, 1, 2, 3]);
    const b = bestHand([5, 5, 1, 2, 3]);
    expect(compareHands(a, b)).toBe(0);
  });

  it('all 8 rank types are in correct order', () => {
    expect(HAND_RANK_ORDER['five_of_a_kind']).toBeGreaterThan(HAND_RANK_ORDER['four_of_a_kind']);
    expect(HAND_RANK_ORDER['four_of_a_kind']).toBeGreaterThan(HAND_RANK_ORDER['full_house']);
    expect(HAND_RANK_ORDER['full_house']).toBeGreaterThan(HAND_RANK_ORDER['straight']);
    expect(HAND_RANK_ORDER['straight']).toBeGreaterThan(HAND_RANK_ORDER['three_of_a_kind']);
    expect(HAND_RANK_ORDER['three_of_a_kind']).toBeGreaterThan(HAND_RANK_ORDER['two_pair']);
    expect(HAND_RANK_ORDER['two_pair']).toBeGreaterThan(HAND_RANK_ORDER['one_pair']);
    expect(HAND_RANK_ORDER['one_pair']).toBeGreaterThan(HAND_RANK_ORDER['high_card']);
  });
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('handles a single die', () => {
    const result = bestHand([6]);
    expect(result.rank).toBe('high_card');
    expect(result.tiebreakers[0]).toBe(6);
  });

  it('handles two dice', () => {
    expect(bestHand([3, 3]).rank).toBe('one_pair');
    expect(bestHand([3, 4]).rank).toBe('high_card');
  });

  it('selectedIndices length equals 5 when N >= 5', () => {
    const result = bestHand([1, 2, 3, 4, 5, 6, 6, 6]);
    expect(result.selectedIndices.length).toBe(5);
  });

  it('selectedIndices are valid indices into the dice array', () => {
    const dice = [1, 2, 3, 4, 5, 6, 6, 6];
    const result = bestHand(dice);
    for (const idx of result.selectedIndices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(dice.length);
    }
  });
});
