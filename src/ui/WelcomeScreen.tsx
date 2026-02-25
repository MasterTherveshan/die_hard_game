import React, { useState } from 'react';
import type { Difficulty } from '../engine/types';
import SoundToggle from './SoundToggle';

interface WelcomeScreenProps {
  onStart: (difficulty: Difficulty) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, soundEnabled, onToggleSound }) => {
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>('medium');

  return (
    <div className="welcome-screen">
      {/* Title */}
      <div className="welcome-title">
        <div className="welcome-title__sub">NAKATOMI PLAZA — CHRISTMAS EVE, 1988</div>
        <h1 className="welcome-title__main">DIE HARD</h1>
        <div className="welcome-title__tagline">THE DICE GAME</div>
      </div>

      {/* Intro blurb */}
      <div className="panel">
        <p className="welcome-intro">
          You are John McClane — NYPD cop, barefoot, wrong place, wrong time.
          &ldquo;Chance&rdquo; Gruber and his men have taken Nakatomi Plaza.
          You have your wits, your fists, and a pool of dice.
          Fight your way up 4 floors, then settle it on the rooftop.
        </p>
      </div>

      {/* Step-by-step rules */}
      <div className="rules">
        <div className="rules__step panel">
          <div className="rules__icon">🎲</div>
          <div className="rules__body">
            <div className="rules__title">YOUR DICE POOL</div>
            <div className="rules__text">
              Your dice are your life — health, ammo, and poker chips all in one.
              Hit zero and you&apos;re done. &ldquo;Welcome to the party, pal.&rdquo;
            </div>
          </div>
        </div>

        <div className="rules__step panel">
          <div className="rules__icon">🏢</div>
          <div className="rules__body">
            <div className="rules__title">THE CLIMB</div>
            <div className="rules__text">
              4 floors. 4 of Gruber&apos;s men. Each has a Health number.
              Beat it with your dice roll to advance.
            </div>
            <div className="rules__tower">
              {['ROOFTOP', 'FL 4', 'FL 3', 'FL 2', 'FL 1'].map((f, i) => (
                <div key={i} className={`rules__tower-floor ${i === 0 ? 'rules__tower-floor--boss' : ''}`}>{f}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="rules__step panel">
          <div className="rules__icon">⚔️</div>
          <div className="rules__body">
            <div className="rules__title">FIGHTING</div>
            <div className="rules__text">
              Choose how many dice to roll. Sum must beat the henchman&apos;s Health.
              Miss? You lose 1 die from your pool and try again.
              Dice used in a winning fight are <em>not</em> consumed — just borrowed.
            </div>
          </div>
        </div>

        <div className="rules__step panel">
          <div className="rules__icon">🃏</div>
          <div className="rules__body">
            <div className="rules__title">THE GAMBLE — NAKATOMI ROLL&apos;EM</div>
            <div className="rules__text">
              After a win, you can <strong>LOOT</strong>: play a poker-with-dice showdown
              against the henchman. Win = +1 die. Lose = −1 die.
              Or play it safe and <strong>CLIMB</strong> to the next floor.
            </div>
          </div>
        </div>

        <div className="rules__step rules__step--highlight panel">
          <div className="rules__icon">⚖️</div>
          <div className="rules__body">
            <div className="rules__title">THE KEY TRADEOFF</div>
            <div className="rules__text">
              You can only loot with dice you did <em>not</em> use to fight.
            </div>
            <div className="rules__tradeoff">
              <div className="rules__tradeoff-side rules__tradeoff-side--safe">
                <div className="rules__tradeoff-label">MORE FIGHT DICE</div>
                <div className="rules__tradeoff-arrow">→</div>
                <div className="rules__tradeoff-desc">Safer win, fewer loot dice</div>
              </div>
              <div className="rules__tradeoff-vs">VS</div>
              <div className="rules__tradeoff-side rules__tradeoff-side--risky">
                <div className="rules__tradeoff-label">FEWER FIGHT DICE</div>
                <div className="rules__tradeoff-arrow">→</div>
                <div className="rules__tradeoff-desc">Risky win, more loot dice</div>
              </div>
            </div>
            <div className="rules__tradeoff-note">
              Every floor is a bet on yourself.
            </div>
          </div>
        </div>

        <div className="rules__step panel">
          <div className="rules__icon">🔫</div>
          <div className="rules__body">
            <div className="rules__title">THE ROOFTOP FINALE</div>
            <div className="rules__text">
              Gruber plays Nakatomi Roll&apos;em for keeps. Multi-round poker with real stakes:
              ante dice, raise, bluff, fold. Last one standing wins.
              He always knew the odds. Show him he was wrong.
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty selector */}
      <div className="panel difficulty-panel">
        <div className="difficulty-panel__title">SELECT DIFFICULTY</div>
        <div className="difficulty-panel__options">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
            <button
              key={diff}
              className={`btn btn--diff ${selectedDiff === diff ? 'btn--diff-active' : ''} btn--diff-${diff}`}
              onClick={() => setSelectedDiff(diff)}
            >
              <span className="btn--diff-name">{diff.toUpperCase()}</span>
              <span className="btn--diff-desc">
                {diff === 'easy' && '8 dice • Gruber starts weak'}
                {diff === 'medium' && '6 dice • Even odds'}
                {diff === 'hard' && '6 dice • Gruber loaded'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button className="btn btn--primary btn--xl" onClick={() => onStart(selectedDiff)}>
        GOT IT — DEAL ME IN
      </button>

      <div className="welcome-footer">
        <SoundToggle enabled={soundEnabled} onToggle={onToggleSound} />
      </div>
    </div>
  );
};

export default WelcomeScreen;
