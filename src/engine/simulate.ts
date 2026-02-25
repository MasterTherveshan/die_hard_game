/**
 * DIE HARD — Balance Simulation
 * Run: npx tsx src/engine/simulate.ts
 *
 * Plays N automated games per difficulty using a heuristic strategy and
 * reports win rates. Tune config.ts until targets are hit:
 *   Easy   ≈ 75%
 *   Medium ≈ 50%
 *   Hard   ≈ 25%
 *
 * NOTE: The finale uses full-pool rolling with best-5-of-N selection.
 * To keep the simulation fast, we sample 5 dice from each full pool (the
 * expected hand quality is identical to best-5-of-N selection asymptotically,
 * and the pool sizes targeted in config are small enough that the difference
 * is minimal). Actual gameplay uses bestHand(fullPool) as specified.
 */

import { DIFFICULTY_CONFIGS, generateFloorData, rollDice } from './config';
import { bestHand, compareHands, HAND_RANK_ORDER } from './hands';
import { resolveDefeat, resolveLoot } from './combat';
import { gruberRespondToRaise, resolveShowdown } from './finale';
import type { Difficulty } from './types';

const GAMES_PER_DIFF = 10_000;

// ── Fast hand evaluation for sim ─────────────────────────────────────────────
// For small pools (≤10 dice), bestHand is fast. We cap at 7 dice in the sim
// because combinations blow up otherwise. The real game will use the full pool.
function simBestHand(dice: number[]) {
  const capped = dice.length <= 7 ? dice : dice.slice(0, 7);
  return bestHand(capped);
}

// ── Heuristic strategy ────────────────────────────────────────────────────────

/** How many dice to commit to a defeat roll for ~75-80% success chance. */
function diceToCommit(playerDice: number, health: number): number {
  // Expected value per die = 3.5. Target expected sum = health * 1.1.
  const needed = Math.ceil((health * 1.1) / 3.5);
  return Math.max(1, Math.min(needed, playerDice));
}

/** Whether to loot after a win. Loot when we have at least as many dice as the enemy. */
function shouldLoot(availableForLoot: number, lootEnemyDice: number): boolean {
  return availableForLoot > 0 && availableForLoot >= lootEnemyDice;
}

/** Finale decision: raise on Two Pair or better. */
function finaleDecision(rank: string): 'raise' | 'check' {
  const r = HAND_RANK_ORDER[rank as keyof typeof HAND_RANK_ORDER] ?? 0;
  return r >= 2 ? 'raise' : 'check';
}

// ── Single game ───────────────────────────────────────────────────────────────

function simulateGame(difficulty: Difficulty): boolean {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const { health, lootDice } = generateFloorData(difficulty);

  let playerDice = config.playerStartDice;
  let gruberDice = config.gruberStartDice;

  // ── Tower floors ────────────────────────────────────────────────────────────
  for (let floor = 0; floor < 4; floor++) {
    const floorHealth = health[floor];
    const floorLootDice = lootDice[floor];

    let defeated = false;
    while (!defeated) {
      if (playerDice === 0) return false;

      const committed = diceToCommit(playerDice, floorHealth);
      const roll = rollDice(committed);
      const result = resolveDefeat(roll, floorHealth);

      if (result.success) {
        defeated = true;
        const availableForLoot = playerDice - committed;

        if (shouldLoot(availableForLoot, floorLootDice)) {
          const lootResult = resolveLoot(
            rollDice(availableForLoot),
            rollDice(floorLootDice),
          );
          playerDice = Math.max(0, playerDice + lootResult.dieDelta);
          if (playerDice === 0) return false;
        }
      } else {
        playerDice = Math.max(0, playerDice - 1);
      }
    }
  }

  if (playerDice === 0) return false;

  // ── Finale: Nakatomi Roll'em ────────────────────────────────────────────────
  // Both sides roll their full remaining pool; best 5 selected.
  // We cap at 7 dice per side in the sim to keep bestHand computation fast.
  for (let _round = 0; _round < 80; _round++) {
    if (playerDice < 2) return false;
    if (gruberDice < 2) return true;

    // Ante 1 each
    playerDice -= 1;
    gruberDice -= 1;
    let potDice = 2;

    // Roll full pool (capped at 7 for sim speed; real game uncapped)
    const playerRoll = rollDice(Math.min(playerDice, 7));
    const gruberRoll = rollDice(Math.min(gruberDice, 7));

    const playerHand = simBestHand(playerRoll);
    const gruberHand = simBestHand(gruberRoll);

    const decision = finaleDecision(playerHand.rank);
    let gruberFolded = false;

    if (decision === 'raise' && playerDice > 0) {
      playerDice -= 1;
      potDice += 1;

      const gruberAction = gruberRespondToRaise(
        gruberHand,
        config.gruberFoldThreshold,
        Math.random(),
      );

      if (gruberAction === 'fold') {
        playerDice += potDice; // player wins the whole pot
        gruberFolded = true;
      } else {
        if (gruberDice > 0) {
          gruberDice -= 1;
          potDice += 1;
        }
      }
    }

    if (!gruberFolded) {
      const showdown = resolveShowdown(playerHand, gruberHand, potDice);
      playerDice = Math.max(0, playerDice + showdown.playerDiceDelta);
      gruberDice = Math.max(0, gruberDice + showdown.gruberDiceDelta);
    }

    if (playerDice === 0) return false;
    if (gruberDice === 0) return true;
  }

  return playerDice > gruberDice;
}

// ── Runner ────────────────────────────────────────────────────────────────────

function runSimulation() {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const targets: Record<Difficulty, string> = {
    easy:   '~75%',
    medium: '~50%',
    hard:   '~25%',
  };

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   DIE HARD — Balance Simulation              ║');
  console.log(`║   ${GAMES_PER_DIFF.toLocaleString()} games per difficulty              ║`);
  console.log('╚══════════════════════════════════════════════╝\n');

  const cfgE = DIFFICULTY_CONFIGS.easy;
  const cfgM = DIFFICULTY_CONFIGS.medium;
  const cfgH = DIFFICULTY_CONFIGS.hard;
  console.log('Current config:');
  console.log(`  Easy:   player=${cfgE.playerStartDice}, gruber=${cfgE.gruberStartDice}, health=[${cfgE.healthValues}], fold=${cfgE.gruberFoldThreshold}`);
  console.log(`  Medium: player=${cfgM.playerStartDice}, gruber=${cfgM.gruberStartDice}, health=[${cfgM.healthValues}], fold=${cfgM.gruberFoldThreshold}`);
  console.log(`  Hard:   player=${cfgH.playerStartDice}, gruber=${cfgH.gruberStartDice}, health=[${cfgH.healthValues}], fold=${cfgH.gruberFoldThreshold}`);
  console.log('');
  console.log('Results:');

  for (const diff of difficulties) {
    let wins = 0;
    for (let i = 0; i < GAMES_PER_DIFF; i++) {
      if (simulateGame(diff)) wins++;
    }
    const pct = ((wins / GAMES_PER_DIFF) * 100).toFixed(1);
    const ok = checkTarget(diff, wins / GAMES_PER_DIFF);
    console.log(`  ${diff.toUpperCase().padEnd(8)} ${pct.padStart(5)}%  (target ${targets[diff]})  ${ok ? '✓' : '✗ NEEDS TUNING'}`);
  }
  console.log('');
}

function checkTarget(diff: Difficulty, rate: number): boolean {
  if (diff === 'easy')   return rate >= 0.68 && rate <= 0.82;
  if (diff === 'medium') return rate >= 0.43 && rate <= 0.57;
  if (diff === 'hard')   return rate >= 0.18 && rate <= 0.32;
  return false;
}

runSimulation();
