import { useState, useCallback } from 'react';
import type { Difficulty } from './engine/types';
import { DIFFICULTY_CONFIGS, generateFloorData } from './engine/config';
import WelcomeScreen from './ui/WelcomeScreen';
import FloorPanel from './ui/FloorPanel';
import FinalePanel from './ui/FinalePanel';
import GameOverScreen from './ui/GameOverScreen';
import StatusBar from './ui/StatusBar';
import SoundToggle from './ui/SoundToggle';

type AppPhase = 'welcome' | 'floor' | 'finale' | 'game_over';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('welcome');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [playerDice, setPlayerDice] = useState(12);
  const [gruberDice, setGruberDice] = useState(10);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [floorHealth, setFloorHealth] = useState<number[]>([]);
  const [floorLootDice, setFloorLootDice] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [victory, setVictory] = useState(false);
  const [gameOverMsg, setGameOverMsg] = useState('');
  const [floorKey, setFloorKey] = useState(0); // remount FloorPanel when advancing floors

  const startGame = useCallback((diff: Difficulty) => {
    const config = DIFFICULTY_CONFIGS[diff];
    const { health, lootDice } = generateFloorData(diff);
    setDifficulty(diff);
    setPlayerDice(config.playerStartDice);
    setGruberDice(config.gruberStartDice);
    setCurrentFloor(0);
    setFloorHealth(health);
    setFloorLootDice(lootDice);
    setFloorKey(0);
    setVictory(false);
    setGameOverMsg('');
    setPhase('floor');
  }, []);

  const handleFloorComplete = useCallback((newDice: number) => {
    setPlayerDice(newDice);
    if (currentFloor < 3) {
      setCurrentFloor(f => f + 1);
      setFloorKey(k => k + 1); // remount FloorPanel for fresh state
    } else {
      setPhase('finale');
    }
  }, [currentFloor]);

  const handleGameOver = useCallback((message: string) => {
    setGameOverMsg(message);
    setVictory(false);
    setPhase('game_over');
  }, []);

  const handleFinaleComplete = useCallback((won: boolean) => {
    setVictory(won);
    setGameOverMsg(
      won
        ? 'Gruber ran out of dice — and options. The rooftop is yours.'
        : "Gruber outlasted you on the rooftop. It wasn't your night.",
    );
    setPhase('game_over');
  }, []);

  const handleRestart = useCallback(() => {
    setPhase('welcome');
  }, []);

  return (
    <div className="app">
      {/* CRT scanline overlay */}
      <div className="scanlines" aria-hidden="true" />

      {/* Sound toggle always accessible */}
      {phase !== 'welcome' && (
        <div className="global-sound-toggle">
          <SoundToggle enabled={soundEnabled} onToggle={() => setSoundEnabled(s => !s)} />
        </div>
      )}

      {/* Status bar (shown during floor and finale phases) */}
      {(phase === 'floor' || phase === 'finale') && (
        <StatusBar
          playerDice={playerDice}
          floor={phase === 'floor' ? currentFloor : null}
          difficulty={difficulty}
          phase={phase}
        />
      )}

      {/* Main content */}
      <div className="content">
        {phase === 'welcome' && (
          <WelcomeScreen
            onStart={startGame}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(s => !s)}
          />
        )}

        {phase === 'floor' && floorHealth.length > 0 && (
          <FloorPanel
            key={floorKey}
            floor={currentFloor}
            health={floorHealth[currentFloor]}
            lootEnemyDice={floorLootDice[currentFloor]}
            playerDice={playerDice}
            soundEnabled={soundEnabled}
            difficulty={difficulty}
            onComplete={handleFloorComplete}
            onGameOver={handleGameOver}
          />
        )}

        {phase === 'finale' && (
          <FinalePanel
            key="finale"
            initialPlayerDice={playerDice}
            initialGruberDice={gruberDice}
            soundEnabled={soundEnabled}
            difficulty={difficulty}
            onComplete={handleFinaleComplete}
          />
        )}

        {phase === 'game_over' && (
          <GameOverScreen
            victory={victory}
            message={gameOverMsg}
            playerDice={playerDice}
            difficulty={difficulty}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
}
