export type Difficulty = 'easy' | 'medium' | 'hard';

export type HandRank =
  | 'five_of_a_kind'
  | 'four_of_a_kind'
  | 'full_house'
  | 'straight'
  | 'three_of_a_kind'
  | 'two_pair'
  | 'one_pair'
  | 'high_card';

export interface HandResult {
  rank: HandRank;
  selectedIndices: number[]; // indices into the original dice array that form this hand
  tiebreakers: number[];     // values for tie-breaking within same rank
  values: number[];          // the dice values used in this hand
}

export interface DifficultyConfig {
  playerStartDice: number;
  gruberStartDice: number;
  healthValues: number[];       // per floor (4 floors)
  gruberFoldThreshold: number;  // 0-1: hand strength below which Gruber folds when raised
}
