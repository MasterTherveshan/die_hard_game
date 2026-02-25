import React from 'react';
import Die from './Die';
import { HAND_RANK_NAMES } from '../engine/hands';
import type { HandResult } from '../engine/types';

interface HandDisplayProps {
  roll: number[];
  hand: HandResult | null;
  label: string;
  isPlayer?: boolean;
}

const HandDisplay: React.FC<HandDisplayProps> = ({ roll, hand, label, isPlayer = true }) => {
  const highlightSet = new Set(hand?.selectedIndices ?? []);

  return (
    <div className={`hand-display ${isPlayer ? 'hand-display--player' : 'hand-display--enemy'}`}>
      <div className="hand-display__label">{label}</div>
      <div className="dice-roll-row">
        {roll.map((value, i) => (
          <Die
            key={i}
            value={value}
            isSettled
            isHighlighted={highlightSet.has(i)}
            dim={hand !== null && !highlightSet.has(i)}
            size="sm"
          />
        ))}
      </div>
      {hand && (
        <div className={`hand-name ${isPlayer ? 'hand-name--player' : 'hand-name--enemy'}`}>
          {HAND_RANK_NAMES[hand.rank]}
        </div>
      )}
    </div>
  );
};

export default HandDisplay;
