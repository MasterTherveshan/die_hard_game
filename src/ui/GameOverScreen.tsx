import React from 'react';
import type { Difficulty } from '../engine/types';

interface GameOverScreenProps {
  victory: boolean;
  message: string;
  playerDice: number;
  difficulty: Difficulty;
  onRestart: () => void;
}

const VICTORY_QUOTES = [
  '"Come out to the coast, we\'ll get together, have a few laughs." — So you did.',
  '"Yippee-ki-yay." That\'s all there is to say.',
  'Hans. Gruber. Meet gravity.',
  'Nakatomi Plaza is clear. Merry Christmas.',
];

const DEFEAT_QUOTES = [
  '"Do you think you stand a chance?" — Apparently not.',
  'You came without shoes. You left without dice.',
  '"Now I have a machine gun." He did.',
  'The building won. Gruber smiled.',
];

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  victory,
  message,
  playerDice,
  difficulty,
  onRestart,
}) => {
  const quote = victory
    ? VICTORY_QUOTES[Math.floor(Math.random() * VICTORY_QUOTES.length)]
    : DEFEAT_QUOTES[Math.floor(Math.random() * DEFEAT_QUOTES.length)];

  return (
    <div className="gameover-screen">
      <div className={`gameover-title ${victory ? 'gameover-title--win' : 'gameover-title--lose'}`}>
        {victory ? 'YIPPEE-KI-YAY' : 'GAME OVER'}
      </div>

      {victory && (
        <div className="gameover-subtitle text-success">
          NAKATOMI PLAZA SECURED
        </div>
      )}

      {!victory && (
        <div className="gameover-subtitle text-danger">
          MCCLANE IS DOWN
        </div>
      )}

      <div className="panel gameover-panel">
        <div className="gameover-message">{message}</div>
        <div className="gameover-quote">&ldquo;{quote}&rdquo;</div>
        <div className="gameover-stats">
          <div className="gameover-stat">
            <span className="gameover-stat__label">DICE LEFT</span>
            <span className={`gameover-stat__value ${victory ? 'text-success' : 'text-danger'}`}>
              {playerDice}
            </span>
          </div>
          <div className="gameover-stat">
            <span className="gameover-stat__label">DIFFICULTY</span>
            <span className="gameover-stat__value text-amber">{difficulty.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {victory && (
        <div className="gameover-fireworks">
          {'★'.repeat(7)}
        </div>
      )}

      <button className="btn btn--primary btn--xl" onClick={onRestart}>
        {victory ? 'PLAY AGAIN' : 'TRY AGAIN'}
      </button>

      <div className="gameover-footer">
        Nakatomi Plaza · Christmas Eve, 1988
      </div>
    </div>
  );
};

export default GameOverScreen;
