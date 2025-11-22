
import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import SettingsModal from './components/SettingsModal';
import { GameState, GameStatus, AppSettings } from './types';
import { audioManager } from './utils/audio';

declare const window: any;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.IDLE,
    score: 0,
    highScore: parseInt(localStorage.getItem('realflap_highscore') || '0', 10)
  });
  
  const [settings, setSettings] = useState<AppSettings>({
    musicVolume: 0.5,
    sfxVolume: 0.5,
    hardcoreMode: false
  });

  const [showSettings, setShowSettings] = useState(false);
  const [triggerJump, setTriggerJump] = useState(false);

  // Update Audio Manager when settings change
  useEffect(() => {
    audioManager.setVolumes(settings.musicVolume, settings.sfxVolume);
  }, [settings]);

  // Persist High Score
  useEffect(() => {
    if (gameState.score > gameState.highScore) {
      localStorage.setItem('realflap_highscore', gameState.score.toString());
    }
  }, [gameState.score, gameState.highScore]);

  // Handle Input (Keyboard & Touch)
  const handleInput = useCallback(() => {
    if (gameState.status === GameStatus.GAME_OVER || gameState.status === GameStatus.PAUSED) return;
    
    // Prevent input if settings are open
    if (showSettings) return;

    setTriggerJump(true);
  }, [gameState.status, showSettings]);

  const restartGame = () => {
    setGameState(prev => ({
      status: GameStatus.IDLE,
      score: 0,
      highScore: prev.highScore
    }));
    audioManager.playMusic(); // Ensure music restarts if needed
  };

  const handlePause = () => {
    if (gameState.status === GameStatus.PLAYING) {
      setGameState(prev => ({ ...prev, status: GameStatus.PAUSED }));
    }
  };

  const handleResume = () => {
    if (gameState.status === GameStatus.PAUSED) {
      setGameState(prev => ({ ...prev, status: GameStatus.PLAYING }));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleInput();
      }
      if (e.code === 'Escape') {
         if (showSettings) setShowSettings(false);
         else if (gameState.status === GameStatus.PLAYING) handlePause();
         else if (gameState.status === GameStatus.PAUSED) handleResume();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, showSettings, gameState.status]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-gray-900 select-none"
      onMouseDown={handleInput}
      onTouchStart={handleInput}
    >
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState} 
        triggerJump={triggerJump}
        setTriggerJump={setTriggerJump}
        settings={settings}
      />
      
      <UIOverlay 
        gameState={gameState}
        onStart={() => setTriggerJump(true)}
        onRestart={restartGame}
        onPause={handlePause}
        onResume={handleResume}
        onOpenSettings={() => {
           handlePause();
           setShowSettings(true);
        }}
      />

      {showSettings && (
        <SettingsModal 
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Vignette Overlay for cinematic effect */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]"></div>
      
      {/* Noise Overlay for grit */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
};

export default App;
