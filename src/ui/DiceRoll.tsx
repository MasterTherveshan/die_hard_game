import React, { useState, useEffect, useRef } from 'react';
import Die from './Die';
import { playDiceTick, playDiceSettle } from '../audio/sounds';

interface DiceRollProps {
  targetValues: number[];
  highlightIndices?: number[];
  onDieSettle?: (settledValues: number[]) => void;
  onComplete?: () => void;
  soundEnabled: boolean;
  delayMs?: number;
  dieSize?: 'sm' | 'md' | 'lg';
  dimUnselected?: boolean; // dim dice not in highlightIndices after completion
}

const DiceRoll: React.FC<DiceRollProps> = ({
  targetValues,
  highlightIndices = [],
  onDieSettle,
  onComplete,
  soundEnabled,
  delayMs = 0,
  dieSize = 'md',
  dimUnselected = false,
}) => {
  const [displayValues, setDisplayValues] = useState<number[]>(() =>
    targetValues.map(() => 1)
  );
  const [dieStates, setDieStates] = useState<Array<'waiting' | 'rolling' | 'settled'>>(() =>
    targetValues.map(() => 'waiting')
  );
  const [allSettled, setAllSettled] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const n = targetValues.length;
    const settled: number[] = [];
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    setDisplayValues(targetValues.map(() => 1));
    setDieStates(targetValues.map(() => 'waiting'));
    setAllSettled(false);

    if (n === 0) {
      onComplete?.();
      return;
    }

    const rollDie = (dieIdx: number) => {
      if (cancelledRef.current) return;

      setDieStates(prev => {
        const next = [...prev];
        next[dieIdx] = 'rolling';
        return next;
      });

      const tumbleDuration = 300 + Math.random() * 200;
      const startTime = Date.now();
      let currentInterval = 40;

      const tick = () => {
        if (cancelledRef.current) return;
        const elapsed = Date.now() - startTime;

        if (elapsed >= tumbleDuration) {
          // Settle this die
          const finalValue = targetValues[dieIdx];
          setDisplayValues(prev => {
            const next = [...prev];
            next[dieIdx] = finalValue;
            return next;
          });
          setDieStates(prev => {
            const next = [...prev];
            next[dieIdx] = 'settled';
            return next;
          });
          playDiceSettle(soundEnabled, dieIdx);

          settled[dieIdx] = finalValue;
          onDieSettle?.(settled.filter(v => v !== undefined));

          if (dieIdx === n - 1) {
            setAllSettled(true);
            const t = setTimeout(() => {
              if (!cancelledRef.current) onComplete?.();
            }, 150);
            timeouts.push(t);
          } else {
            const pause = 80 + Math.floor(Math.random() * 70);
            const t = setTimeout(() => rollDie(dieIdx + 1), pause);
            timeouts.push(t);
          }
          return;
        }

        // Show random tumbling value
        setDisplayValues(prev => {
          const next = [...prev];
          next[dieIdx] = Math.floor(Math.random() * 6) + 1;
          return next;
        });
        playDiceTick(soundEnabled);

        // Decelerate slightly toward end
        currentInterval = Math.min(80, 40 + (elapsed / tumbleDuration) * 40);
        const t = setTimeout(tick, currentInterval);
        timeouts.push(t);
      };

      const t = setTimeout(tick, currentInterval);
      timeouts.push(t);
    };

    const startT = setTimeout(() => rollDie(0), delayMs);
    timeouts.push(startT);

    return () => {
      cancelledRef.current = true;
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty — remount (via key) to re-roll

  return (
    <div className="dice-roll-row">
      {displayValues.map((value, i) => (
        <Die
          key={i}
          value={value}
          isRolling={dieStates[i] === 'rolling'}
          isHighlighted={highlightIndices.includes(i)}
          isSettled={dieStates[i] === 'settled'}
          dim={
            dimUnselected &&
            allSettled &&
            highlightIndices.length > 0 &&
            !highlightIndices.includes(i)
          }
          size={dieSize}
        />
      ))}
    </div>
  );
};

export default DiceRoll;
