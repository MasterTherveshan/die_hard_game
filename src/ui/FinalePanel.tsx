import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Difficulty, HandResult } from '../engine/types';
import { rollDice, DIFFICULTY_CONFIGS } from '../engine/config';
import { HAND_RANK_NAMES } from '../engine/hands';
import {
  evaluateFinaleRolls,
  resolveShowdown,
  gruberRespondToRaise,
} from '../engine/finale';
import { GRUBER } from '../data/characters';
import DiceRoll from './DiceRoll';
import HandDisplay from './HandDisplay';
import HandRankings from './HandRankings';
import { playWin, playLose, playButton, playFloorAdvance, playDiceTick, playDiceSettle } from '../audio/sounds';

// Animate N face-down dice appearing one-by-one — values never revealed
interface FaceDownDiceRollProps {
  count: number;
  soundEnabled: boolean;
  onComplete: () => void;
  delayMs?: number;
}
const FaceDownDiceRoll: React.FC<FaceDownDiceRollProps> = ({ count, soundEnabled, onComplete, delayMs = 0 }) => {
  const [dieStates, setDieStates] = useState<Array<'hidden' | 'rolling' | 'settled'>>(() =>
    Array(count).fill('hidden')
  );
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    if (count === 0) { onComplete(); return; }

    const rollDieAt = (idx: number) => {
      if (cancelledRef.current) return;
      setDieStates(prev => { const next = [...prev]; next[idx] = 'rolling'; return next; });

      const tumbleDuration = 300 + Math.random() * 200;
      const startTime = Date.now();
      let interval = 40;

      const tick = () => {
        if (cancelledRef.current) return;
        const elapsed = Date.now() - startTime;
        if (elapsed >= tumbleDuration) {
          setDieStates(prev => { const next = [...prev]; next[idx] = 'settled'; return next; });
          playDiceSettle(soundEnabled, idx);
          if (idx === count - 1) {
            const t = setTimeout(() => { if (!cancelledRef.current) onComplete(); }, 150);
            timeouts.push(t);
          } else {
            const pause = 80 + Math.floor(Math.random() * 70);
            const t = setTimeout(() => rollDieAt(idx + 1), pause);
            timeouts.push(t);
          }
          return;
        }
        playDiceTick(soundEnabled);
        interval = Math.min(80, 40 + (elapsed / tumbleDuration) * 40);
        timeouts.push(setTimeout(tick, interval));
      };

      timeouts.push(setTimeout(tick, interval));
    };

    const t = setTimeout(() => rollDieAt(0), delayMs);
    timeouts.push(t);

    return () => { cancelledRef.current = true; timeouts.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dice-roll-row">
      {dieStates.map((state, i) => (
        <div
          key={i}
          className={[
            'die die--md die--hidden',
            state === 'rolling' ? 'die--rolling' : '',
            state === 'settled' ? 'die--settled' : '',
            state === 'hidden' ? 'die--waiting' : '',
          ].filter(Boolean).join(' ')}
        >
          {state !== 'hidden' ? '?' : ''}
        </div>
      ))}
    </div>
  );
};

type FinalePhase =
  | 'intro'
  | 'ante'
  | 'rolling_player'
  | 'rolling_gruber'
  | 'decision'
  | 'gruber_response'
  | 'showdown'
  | 'round_result'
  | 'done';

interface FinalePanelProps {
  initialPlayerDice: number;
  initialGruberDice: number;
  soundEnabled: boolean;
  difficulty: Difficulty;
  onComplete: (won: boolean) => void;
}

const FinalePanel: React.FC<FinalePanelProps> = ({
  initialPlayerDice,
  initialGruberDice,
  soundEnabled,
  difficulty,
  onComplete,
}) => {
  const config = DIFFICULTY_CONFIGS[difficulty];

  const [phase, setPhase] = useState<FinalePhase>('intro');
  const [playerDice, setPlayerDice] = useState(initialPlayerDice);
  const [gruberDice, setGruberDice] = useState(initialGruberDice);
  const [round, setRound] = useState(1);
  const [potDice, setPotDice] = useState(0);
  const [rollKey, setRollKey] = useState(0);

  // Per-round state
  const [playerRoll, setPlayerRoll] = useState<number[]>([]);
  const [gruberRoll, setGruberRoll] = useState<number[]>([]);
  const [playerHand, setPlayerHand] = useState<HandResult | null>(null);
  const [gruberHand, setGruberHand] = useState<HandResult | null>(null);
  const [gruberDecision, setGruberDecision] = useState<'call' | 'fold' | null>(null);
  const [playerRaised, setPlayerRaised] = useState(false);
  const [roundWon, setRoundWon] = useState<boolean | null>(null);
  const [roundPotDice, setRoundPotDice] = useState(0); // pot size at resolution (for display)

  // ── ROUND START ───────────────────────────────────────────────────────────

  const startRound = useCallback(() => {
    playButton(soundEnabled);

    // Both ante 1 die
    const newPlayerDice = playerDice - 1;
    const newGruberDice = gruberDice - 1;

    if (newPlayerDice <= 0) {
      onComplete(false);
      return;
    }
    if (newGruberDice <= 0) {
      onComplete(true);
      return;
    }

    setPlayerDice(newPlayerDice);
    setGruberDice(newGruberDice);
    setPotDice(2); // 1 from each
    setPlayerRaised(false);
    setGruberDecision(null);
    setPlayerHand(null);
    setGruberHand(null);
    setRoundWon(null);

    // Roll player's full pool (best 5 selected by engine)
    const pRoll = rollDice(newPlayerDice);
    setPlayerRoll(pRoll);
    setRollKey(k => k + 1);
    setPhase('rolling_player');
  }, [playerDice, gruberDice, soundEnabled, onComplete]);

  const handlePlayerRollComplete = useCallback(() => {
    // Pre-compute Gruber's full-pool roll (values hidden until showdown)
    const gRoll = rollDice(gruberDice);
    setGruberRoll(gRoll);

    const results = evaluateFinaleRolls(playerRoll, gRoll);
    setPlayerHand(results.playerHand);
    setGruberHand(results.gruberHand); // hidden until showdown

    setRollKey(k => k + 1);
    setPhase('rolling_gruber');
  }, [playerRoll, gruberDice]);

  const handleGruberRollComplete = useCallback(() => {
    setPhase('decision');
  }, []);

  // ── PLAYER DECISION ───────────────────────────────────────────────────────

  const handleCheck = useCallback(() => {
    playButton(soundEnabled);
    setPhase('showdown');
  }, [soundEnabled]);

  const handleRaise = useCallback(() => {
    playButton(soundEnabled);
    if (playerDice <= 0) return;

    // Player adds 1 more die to pot
    setPlayerDice(d => d - 1);
    setPotDice(p => p + 1);
    setPlayerRaised(true);

    // Gruber responds
    const gHand = gruberHand!;
    const decision = gruberRespondToRaise(gHand, config.gruberFoldThreshold, Math.random());
    setGruberDecision(decision);
    setPhase('gruber_response');
  }, [soundEnabled, playerDice, gruberHand, config.gruberFoldThreshold]);

  // After seeing Gruber's response, proceed to showdown or collect fold winnings
  const proceedAfterResponse = useCallback(() => {
    playButton(soundEnabled);
    if (gruberDecision === 'fold') {
      // Gruber folds: player wins the entire pot.
      // Both players already had their antes (and player's raise) deducted from pools.
      // Player receives all pot dice back; Gruber keeps nothing.
      const wonPot = potDice;
      const newPlayerDice = playerDice + wonPot;
      // gruberDice is unchanged (their ante already removed in startRound)
      setPlayerDice(newPlayerDice);
      setRoundPotDice(wonPot);
      setRoundWon(true);
      setPotDice(0);

      if (gruberDice === 0) {
        playWin(soundEnabled);
        setPhase('done');
        setTimeout(() => onComplete(true), 400);
        return;
      }
      playFloorAdvance(soundEnabled);
      setRound(r => r + 1);
      setPhase('round_result');
    } else {
      // Call: Gruber matches the raise (adds 1 die to pot)
      setGruberDice(d => d - 1);
      setPotDice(p => p + 1);
      setPhase('showdown');
    }
  }, [soundEnabled, gruberDecision, gruberDice, playerDice, potDice, onComplete]);

  // ── SHOWDOWN ──────────────────────────────────────────────────────────────

  const resolveRound = useCallback(() => {
    playButton(soundEnabled);
    const result = resolveShowdown(playerHand!, gruberHand!, potDice);

    // Winner receives all pot dice; loser receives nothing (their share already removed).
    const newPlayerDice = Math.max(0, playerDice + result.playerDiceDelta);
    const newGruberDice = Math.max(0, gruberDice + result.gruberDiceDelta);
    setPlayerDice(newPlayerDice);
    setGruberDice(newGruberDice);
    setRoundPotDice(potDice);
    setPotDice(0);
    setRoundWon(result.playerWins);

    if (result.playerWins) {
      playWin(soundEnabled);
    } else {
      playLose(soundEnabled);
    }

    if (newPlayerDice === 0) {
      setPhase('done');
      setTimeout(() => onComplete(false), 800);
      return;
    }
    if (newGruberDice === 0) {
      setPhase('done');
      setTimeout(() => onComplete(true), 800);
      return;
    }

    setRound(r => r + 1);
    setPhase('round_result');
  }, [soundEnabled, playerHand, gruberHand, potDice, playerDice, gruberDice, onComplete]);

  const nextRound = useCallback(() => {
    playButton(soundEnabled);
    startRound();
  }, [soundEnabled, startRound]);

  // ── HELPER TEXT ───────────────────────────────────────────────────────────

  const helperText = (): string => {
    switch (phase) {
      case 'intro':
        return 'The rooftop. Christmas Eve. Just you and Gruber.';
      case 'ante':
        return `Round ${round}. Both ante 1 die into the pot. Pot: 2 dice. Roll the bones.`;
      case 'rolling_player':
        return 'Rolling your dice...';
      case 'rolling_gruber':
        return 'Gruber deliberates. His dice hit the table...';
      case 'decision': {
        const handName = playerHand ? HAND_RANK_NAMES[playerHand.rank] : '—';
        return `Your hand: ${handName}. Gruber rolled ${gruberRoll.length} dice — hand hidden. CHECK to showdown, or RAISE to pressure him (costs 1 more die).`;
      }
      case 'gruber_response':
        if (gruberDecision === 'fold') return 'Gruber folds. He forfeits his ante. +1 die swing in your favor.';
        if (gruberDecision === 'call') return 'Gruber calls. He matches your raise. Showdown time.';
        return '';
      case 'showdown':
        return 'Showdown. Loser forfeits their pot dice.';
      case 'round_result':
        if (roundWon) return `You win the round! You take the pot (${roundPotDice} dice).`;
        return `Gruber wins the round. He takes the pot (${roundPotDice} dice).`;
      default:
        return '';
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="finale-panel">
      {/* Gruber portrait */}
      <div className="panel enemy-panel">
        <div className="enemy-panel__portrait-frame enemy-panel__portrait-frame--boss">
          <img src={GRUBER.portrait} alt={GRUBER.name} className="enemy-portrait" />
        </div>
        <div className="enemy-panel__info">
          <div className="enemy-panel__title">{GRUBER.title}</div>
          <div className="enemy-panel__name">{GRUBER.name}</div>
          <div className="enemy-panel__flavor">&ldquo;{GRUBER.flavor}&rdquo;</div>
        </div>
      </div>

      {/* Dice tracker */}
      <div className="finale-tracker panel">
        <div className="finale-tracker__side finale-tracker__side--player">
          <div className="finale-tracker__label text-cyan">McCLANE</div>
          <div className="finale-tracker__count text-cyan">{playerDice}</div>
          <div className="finale-tracker__sub">DICE</div>
        </div>
        {potDice > 0 && (
          <div className="finale-tracker__pot">
            <div className="finale-tracker__label text-amber">POT</div>
            <div className="finale-tracker__count text-amber">{potDice}</div>
          </div>
        )}
        <div className="finale-tracker__side finale-tracker__side--gruber">
          <div className="finale-tracker__label text-danger">GRUBER</div>
          <div className="finale-tracker__count text-danger">{gruberDice}</div>
          <div className="finale-tracker__sub">DICE</div>
        </div>
      </div>

      {/* Helper text */}
      <div className="helper-text">{helperText()}</div>

      {/* Phase: intro */}
      {phase === 'intro' && (
        <div className="panel action-panel">
          <div className="action-panel__title">NAKATOMI ROLL&apos;EM</div>
          <p className="action-panel__desc">
            Multi-round poker with dice. Each round: ante 1 die, then roll your full remaining
            pool — best 5 determine your hand. Check or raise. Gruber&apos;s dice stay hidden
            until showdown. Loser forfeits their pot dice. First to zero loses.
            &ldquo;Now I have a machine gun. Ho ho ho.&rdquo;
          </p>
          <button className="btn btn--primary btn--xl" onClick={startRound}>
            START ROUND {round}
          </button>
        </div>
      )}

      {/* Phase: rolling player */}
      {phase === 'rolling_player' && (
        <div className="panel action-panel">
          <div className="action-panel__title">YOUR ROLL — ROUND {round}</div>
          <DiceRoll
            key={rollKey}
            targetValues={playerRoll}
            soundEnabled={soundEnabled}
            onComplete={handlePlayerRollComplete}
          />
        </div>
      )}

      {/* Phase: rolling gruber */}
      {phase === 'rolling_gruber' && (
        <div className="panel action-panel">
          <div className="action-panel__title">GRUBER&apos;S ROLL</div>
          <div className="loot-both-rolls">
            <HandDisplay roll={playerRoll} hand={playerHand} label="YOUR HAND" isPlayer />
            <div className="vs-divider">VS</div>
            <FaceDownDiceRoll
              key={rollKey}
              count={gruberRoll.length}
              soundEnabled={soundEnabled}
              onComplete={handleGruberRollComplete}
              delayMs={400}
            />
          </div>
        </div>
      )}

      {/* Phase: player decision */}
      {phase === 'decision' && (
        <div className="panel action-panel">
          <div className="action-panel__title">YOUR MOVE</div>
          <HandDisplay roll={playerRoll} hand={playerHand} label="YOUR HAND" isPlayer />
          <div className="finale-unknown">
            <div className="finale-unknown__label text-danger">GRUBER</div>
            <div className="finale-unknown__dice">
              {gruberRoll.map((_, i) => (
                <div key={i} className="die die--md die--hidden">?</div>
              ))}
            </div>
            <div className="finale-unknown__sub">{gruberRoll.length} dice rolled — hand unknown</div>
          </div>
          <div className="finale-decision-btns">
            <button className="btn btn--secondary btn--lg" onClick={handleCheck}>
              CHECK
              <span className="btn__sub">Go to showdown now</span>
            </button>
            <button
              className="btn btn--primary btn--lg"
              onClick={handleRaise}
              disabled={playerDice <= 0}
            >
              RAISE
              <span className="btn__sub">+1 die to pot, pressure Gruber</span>
            </button>
          </div>
          <HandRankings />
        </div>
      )}

      {/* Phase: gruber response */}
      {phase === 'gruber_response' && (
        <div className="panel action-panel">
          <div className="action-panel__title">
            {gruberDecision === 'fold' ? (
              <span className="text-success">GRUBER FOLDS</span>
            ) : (
              <span className="text-danger">GRUBER CALLS</span>
            )}
          </div>
          <p className="action-panel__desc">
            {gruberDecision === 'fold'
              ? "He tosses his cards. Gruber knows when he's beat — or does he? +1 die."
              : "Gruber pushes a die into the pot without blinking. He's not worried."}
          </p>
          <button className="btn btn--primary" onClick={proceedAfterResponse}>
            {gruberDecision === 'fold' ? 'COLLECT WINNINGS' : 'GO TO SHOWDOWN'}
          </button>
        </div>
      )}

      {/* Phase: showdown */}
      {phase === 'showdown' && (
        <div className="panel action-panel">
          <div className="action-panel__title">SHOWDOWN</div>
          <div className="loot-hands">
            <HandDisplay roll={playerRoll} hand={playerHand} label="YOUR HAND" isPlayer />
            <div className="vs-divider">VS</div>
            <HandDisplay roll={gruberRoll} hand={gruberHand} label="GRUBER'S HAND" isPlayer={false} />
          </div>
          <HandRankings />
          <button className="btn btn--primary btn--lg" onClick={resolveRound}>
            REVEAL WINNER
          </button>
        </div>
      )}

      {/* Phase: round result */}
      {phase === 'round_result' && (
        <div className={`panel action-panel ${roundWon ? 'action-panel--hit' : 'action-panel--miss'}`}>
          <div className={`action-panel__title ${roundWon ? 'text-success' : 'text-danger'}`}>
            {roundWon ? 'YOU WIN THE ROUND' : 'GRUBER WINS THE ROUND'}
          </div>
          <div className="loot-hands">
            <HandDisplay roll={playerRoll} hand={playerHand} label="YOUR HAND" isPlayer />
            <div className="vs-divider">VS</div>
            <HandDisplay roll={gruberRoll} hand={gruberHand} label="GRUBER'S HAND" isPlayer={false} />
          </div>
          <div className="round-result-summary">
            <span className="text-cyan">McCLANE: {playerDice} dice</span>
            <span className="text-danger">GRUBER: {gruberDice} dice</span>
          </div>
          <button className="btn btn--primary" onClick={nextRound}>
            ROUND {round} →
          </button>
        </div>
      )}
    </div>
  );
};

export default FinalePanel;
