import React from 'react';
import type { Difficulty } from '../engine/types';

interface StatusBarProps {
  playerDice: number;
  floor: number | null; // null = finale
  difficulty: Difficulty;
  phase: string;
}

const FLOOR_LABELS = ['FLOOR 1', 'FLOOR 2', 'FLOOR 3', 'FLOOR 4', 'ROOFTOP'];

const StatusBar: React.FC<StatusBarProps> = ({ playerDice, floor, difficulty, phase }) => {
  const locationLabel =
    floor !== null ? FLOOR_LABELS[floor] ?? 'FLOOR' : 'ROOFTOP';

  return (
    <div className="status-bar">
      <div className="status-bar__item status-bar__dice">
        <span className="status-bar__label">DICE</span>
        <span className="status-bar__value status-bar__value--cyan">{playerDice}</span>
      </div>
      <div className="status-bar__item status-bar__location">
        <span className="status-bar__value">NAKATOMI PLAZA</span>
        <span className="status-bar__sublabel">{locationLabel}</span>
      </div>
      <div className="status-bar__item status-bar__diff">
        <span className="status-bar__label">MODE</span>
        <span className={`status-bar__value status-bar__value--diff-${difficulty}`}>
          {difficulty.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

export default StatusBar;
