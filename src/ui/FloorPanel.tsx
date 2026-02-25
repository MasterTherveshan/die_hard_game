import React, { useState, useCallback } from 'react';
import type { Difficulty, HandResult } from '../engine/types';
import { rollDice } from '../engine/config';
import { resolveDefeat, resolveLoot } from '../engine/combat';
import { HENCHMEN } from '../data/characters';
import DiceRoll from './DiceRoll';
import HandDisplay from './HandDisplay';
import HandRankings from './HandRankings';
import { playDefeatSuccess, playFloorAdvance, playLose, playWin, playButton } from '../audio/sounds';

type FloorPhase =
  | 'defeat_choose'
  | 'defeat_rolling'
  | 'defeat_result_miss'
  | 'defeat_result_hit'
  | 'loot_choice'
  | 'loot_rolling_player'
  | 'loot_rolling_enemy'
  | 'loot_result'
  | 'done';

interface FloorPanelProps {
  floor: number; // 0-indexed (0-3)
  health: number;
  lootEnemyDice: number;
  playerDice: number;
  soundEnabled: boolean;
  difficulty: Difficulty;
  onComplete: (newPlayerDice: number) => void;
  onGameOver: (message: string) => void;
}

const FloorPanel: React.FC<FloorPanelProps> = ({
  floor,
  health,
  lootEnemyDice,
  playerDice: initialPlayerDice,
  soundEnabled,
  onComplete,
  onGameOver,
}) => {
  const henchman = HENCHMEN[floor];
  const [phase, setPhase] = useState<FloorPhase>('defeat_choose');
  const [playerDice, setPlayerDice] = useState(initialPlayerDice);
  const [committed, setCommitted] = useState(Math.min(Math.ceil(initialPlayerDice / 2), initialPlayerDice));
  const [currentRoll, setCurrentRoll] = useState<number[]>([]);
  const [rollKey, setRollKey] = useState(0);
  const [runningSum, setRunningSum] = useState(0);
  const [defeatResult, setDefeatResult] = useState<{ sum: number; success: boolean } | null>(null);

  // Loot state
  const [lootPlayerRoll, setLootPlayerRoll] = useState<number[]>([]);
  const [lootEnemyRoll, setLootEnemyRoll] = useState<number[]>([]);
  const [lootPlayerHand, setLootPlayerHand] = useState<HandResult | null>(null);
  const [lootEnemyHand, setLootEnemyHand] = useState<HandResult | null>(null);
  const [lootWon, setLootWon] = useState<boolean | null>(null);

  const availableForLoot = playerDice - committed;

  // ── DEFEAT PHASE ──────────────────────────────────────────────────────────

  const startDefeatRoll = useCallback(() => {
    playButton(soundEnabled);
    const roll = rollDice(committed);
    setCurrentRoll(roll);
    setRunningSum(0);
    setRollKey(k => k + 1);
    setPhase('defeat_rolling');
  }, [committed, soundEnabled]);

  const handleDefeatRollComplete = useCallback(() => {
    const result = resolveDefeat(currentRoll, health);
    setDefeatResult({ sum: result.sum, success: result.success });

    if (result.success) {
      playDefeatSuccess(soundEnabled);
      setPhase('defeat_result_hit');
    } else {
      playLose(soundEnabled);
      const newDice = Math.max(0, playerDice - 1);
      setPlayerDice(newDice);
      if (newDice === 0) {
        onGameOver(`${henchman.name} finished you off. Your dice pool hit zero on Floor ${floor + 1}.`);
        return;
      }
      setPhase('defeat_result_miss');
    }
  }, [currentRoll, health, soundEnabled, playerDice, henchman, floor, onGameOver]);

  const retryDefeat = useCallback(() => {
    playButton(soundEnabled);
    const newDice = playerDice; // already decremented
    setCommitted(c => Math.min(c, newDice));
    setDefeatResult(null);
    setCurrentRoll([]);
    setPhase('defeat_choose');
  }, [playerDice, soundEnabled]);

  // ── LOOT PHASE ────────────────────────────────────────────────────────────

  const chooseLoot = useCallback(() => {
    playButton(soundEnabled);
    const lootDiceCount = availableForLoot;
    if (lootDiceCount === 0) {
      // No loot dice, skip straight to climb
      playFloorAdvance(soundEnabled);
      onComplete(playerDice);
      return;
    }
    const roll = rollDice(lootDiceCount);
    setLootPlayerRoll(roll);
    setRollKey(k => k + 1);
    setPhase('loot_rolling_player');
  }, [soundEnabled, availableForLoot, playerDice, onComplete]);

  const chooseClimb = useCallback(() => {
    playButton(soundEnabled);
    playFloorAdvance(soundEnabled);
    setPhase('done');
    setTimeout(() => onComplete(playerDice), 300);
  }, [soundEnabled, playerDice, onComplete]);

  const handleLootPlayerRollComplete = useCallback(() => {
    const enemyRoll = rollDice(lootEnemyDice);
    setLootEnemyRoll(enemyRoll);
    setRollKey(k => k + 1);
    setPhase('loot_rolling_enemy');
  }, [lootEnemyDice]);

  const handleLootEnemyRollComplete = useCallback(() => {
    const result = resolveLoot(lootPlayerRoll, lootEnemyRoll);
    setLootPlayerHand(result.playerHand);
    setLootEnemyHand(result.enemyHand);
    setLootWon(result.playerWins);

    const newDice = Math.max(0, playerDice + result.dieDelta);
    setPlayerDice(newDice);

    if (result.playerWins) {
      playWin(soundEnabled);
    } else {
      playLose(soundEnabled);
    }
    setPhase('loot_result');
  }, [lootPlayerRoll, lootEnemyRoll, playerDice, soundEnabled]);

  const advanceAfterLoot = useCallback(() => {
    playButton(soundEnabled);
    if (playerDice === 0) {
      onGameOver(`${henchman.name} cleaned you out. Zero dice left after loot on Floor ${floor + 1}.`);
      return;
    }
    playFloorAdvance(soundEnabled);
    onComplete(playerDice);
  }, [soundEnabled, playerDice, henchman, floor, onComplete, onGameOver]);

  // ── HELPER TEXT ───────────────────────────────────────────────────────────

  const helperText = (): string => {
    switch (phase) {
      case 'defeat_choose':
        return `Roll ≥ ${health} to beat ${henchman.name}. More dice = safer, but leaves fewer for looting.`;
      case 'defeat_rolling':
        return `Rolling ${committed} dice... need ${Math.max(0, health - runningSum)} more.`;
      case 'defeat_result_miss':
        return `Sum was ${defeatResult?.sum ?? 0}, needed ${health}. Missed by ${health - (defeatResult?.sum ?? 0)}. You lose 1 die — ${playerDice} remaining. Adjust and try again.`;
      case 'defeat_result_hit':
        return `${henchman.name} is down! You used ${committed} dice. CLIMB to next floor, or LOOT with your remaining ${availableForLoot} dice (+1 die on win, −1 on loss).`;
      case 'loot_choice':
        return `${henchman.name} is down! CLIMB to next floor, or LOOT with your remaining ${availableForLoot} dice (+1 die on win, −1 on loss).`;
      case 'loot_rolling_player':
        return `Rolling your ${availableForLoot} loot dice...`;
      case 'loot_rolling_enemy':
        return `${henchman.name} rolls ${lootEnemyDice} dice...`;
      case 'loot_result':
        if (lootWon) return `Your hand wins! +1 die. You now have ${playerDice} dice.`;
        return `${henchman.name}'s hand beats yours. −1 die. You now have ${playerDice} dice.`;
      default:
        return '';
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="floor-panel">
      {/* Enemy portrait + info */}
      <div className="panel enemy-panel">
        <div className="enemy-panel__portrait-frame">
          <img src={henchman.portrait} alt={henchman.name} className="enemy-portrait" />
        </div>
        <div className="enemy-panel__info">
          <div className="enemy-panel__title">{henchman.title}</div>
          <div className="enemy-panel__name">{henchman.name}</div>
          <div className="enemy-panel__flavor">&ldquo;{henchman.flavor}&rdquo;</div>
          <div className="enemy-panel__health">
            HEALTH: <span className="text-danger">{health}</span>
            <span className="enemy-panel__health-sep"> | </span>
            LOOT DICE: <span className="text-amber">{lootEnemyDice}</span>
          </div>
        </div>
      </div>

      {/* Helper context */}
      <div className="helper-text">{helperText()}</div>

      {/* Phase: choose dice */}
      {phase === 'defeat_choose' && (
        <div className="panel action-panel">
          <div className="action-panel__title">DEFEAT ROLL</div>
          <div className="dice-chooser">
            <label className="dice-chooser__label">
              DICE TO ROLL: <span className="dice-chooser__value text-cyan">{committed}</span>
            </label>
            <input
              type="range"
              min={1}
              max={playerDice}
              value={committed}
              onChange={e => setCommitted(Number(e.target.value))}
              className="dice-slider"
            />
            <div className="dice-chooser__info">
              <span>Leftover for loot: <strong className="text-cyan">{availableForLoot}</strong></span>
              <span>Expected sum: ~<strong className="text-amber">{(committed * 3.5).toFixed(0)}</strong></span>
            </div>
          </div>
          <button className="btn btn--primary" onClick={startDefeatRoll}>
            ROLL {committed} {committed === 1 ? 'DIE' : 'DICE'}
          </button>
        </div>
      )}

      {/* Phase: rolling */}
      {phase === 'defeat_rolling' && (
        <div className="panel action-panel">
          <div className="action-panel__title">ROLLING...</div>
          <DiceRoll
            key={rollKey}
            targetValues={currentRoll}
            soundEnabled={soundEnabled}
            onDieSettle={settled => setRunningSum(settled.reduce((a, b) => a + b, 0))}
            onComplete={handleDefeatRollComplete}
          />
          <div className="running-sum">
            <span className="running-sum__label">TOTAL</span>
            <span className={`running-sum__value ${runningSum >= health ? 'text-success' : 'text-amber'}`}>
              {runningSum}
            </span>
            <span className="running-sum__target">/ {health} NEEDED</span>
          </div>
        </div>
      )}

      {/* Phase: miss result */}
      {phase === 'defeat_result_miss' && (
        <div className="panel action-panel action-panel--miss">
          <div className="action-panel__title text-danger">MISSED!</div>
          <div className="roll-result">
            {currentRoll.map((v, i) => (
              <span key={i} className="roll-result__die">{v}</span>
            ))}
          </div>
          <div className="roll-result__sum text-danger">
            {defeatResult?.sum ?? 0} vs {health} — missed by {health - (defeatResult?.sum ?? 0)}
          </div>
          <div className="penalty-text">−1 die from your pool. {playerDice} dice remaining.</div>
          <button className="btn btn--danger" onClick={retryDefeat}>
            TRY AGAIN
          </button>
        </div>
      )}

      {/* Phase: hit result → loot choice */}
      {(phase === 'defeat_result_hit' || phase === 'loot_choice') && (
        <div className="panel action-panel action-panel--hit">
          <div className="action-panel__title text-success">
            {henchman.name.split(' ')[0].toUpperCase()} IS DOWN!
          </div>
          <div className="roll-result">
            {currentRoll.map((v, i) => (
              <span key={i} className="roll-result__die">{v}</span>
            ))}
          </div>
          <div className="roll-result__sum text-success">
            {defeatResult?.sum ?? 0} ≥ {health} ✓
          </div>
          <div className="loot-choice">
            <button className="btn btn--primary loot-choice__btn" onClick={() => {
              setPhase('loot_choice');
              chooseLoot();
            }}>
              LOOT <span className="btn__sub">({availableForLoot} dice | WIN +1 / LOSE −1)</span>
            </button>
            <button className="btn btn--secondary loot-choice__btn" onClick={chooseClimb}>
              CLIMB <span className="btn__sub">(safe, keep {playerDice} dice)</span>
            </button>
          </div>
        </div>
      )}

      {/* Phase: loot rolling player */}
      {phase === 'loot_rolling_player' && (
        <div className="panel action-panel">
          <div className="action-panel__title">YOU ROLL — {availableForLoot} LOOT DICE</div>
          <DiceRoll
            key={rollKey}
            targetValues={lootPlayerRoll}
            soundEnabled={soundEnabled}
            onComplete={handleLootPlayerRollComplete}
          />
        </div>
      )}

      {/* Phase: loot rolling enemy */}
      {phase === 'loot_rolling_enemy' && (
        <div className="panel action-panel">
          <div className="action-panel__title">{henchman.name.toUpperCase()} ROLLS — {lootEnemyDice} DICE</div>
          <div className="loot-both-rolls">
            <HandDisplay roll={lootPlayerRoll} hand={null} label="YOUR ROLL" isPlayer />
            <div className="vs-divider">VS</div>
            <DiceRoll
              key={rollKey}
              targetValues={lootEnemyRoll}
              soundEnabled={soundEnabled}
              onComplete={handleLootEnemyRollComplete}
              delayMs={300}
            />
          </div>
        </div>
      )}

      {/* Phase: loot result */}
      {phase === 'loot_result' && (
        <div className={`panel action-panel ${lootWon ? 'action-panel--hit' : 'action-panel--miss'}`}>
          <div className={`action-panel__title ${lootWon ? 'text-success' : 'text-danger'}`}>
            {lootWon ? 'LOOT SECURED! +1 DIE' : 'LOOT LOST. −1 DIE'}
          </div>
          <div className="loot-hands">
            <HandDisplay
              roll={lootPlayerRoll}
              hand={lootPlayerHand}
              label="YOUR HAND"
              isPlayer
            />
            <div className="vs-divider">VS</div>
            <HandDisplay
              roll={lootEnemyRoll}
              hand={lootEnemyHand}
              label={`${henchman.name.split(' ')[0].toUpperCase()}'S HAND`}
              isPlayer={false}
            />
          </div>
          <HandRankings />
          <button className="btn btn--primary" onClick={advanceAfterLoot}>
            {floor < 3 ? 'NEXT FLOOR →' : 'ROOFTOP →'}
          </button>
        </div>
      )}

      {/* Persistent hand rankings during loot rolling */}
      {(phase === 'loot_rolling_player' || phase === 'loot_rolling_enemy') && <HandRankings />}
    </div>
  );
};

export default FloorPanel;
