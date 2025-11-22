
import React from 'react';
import { GameState, GameStatus } from '../types';
import { Play, RotateCcw, Trophy, Pause, Settings, Medal } from 'lucide-react';

interface UIOverlayProps {
  gameState: GameState;
  onStart: () => void;
  onRestart: () => void;
  onPause: () => void;
  onResume: () => void;
  onOpenSettings: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  gameState, 
  onStart, 
  onRestart,
  onPause,
  onResume,
  onOpenSettings
}) => {
  const isIdle = gameState.status === GameStatus.IDLE;
  const isGameOver = gameState.status === GameStatus.GAME_OVER;
  const isPlaying = gameState.status === GameStatus.PLAYING;
  const isPaused = gameState.status === GameStatus.PAUSED;

  const getMedal = (score: number) => {
    if (score >= 100) return { color: 'text-indigo-400', label: 'Platinum', icon: Medal };
    if (score >= 50) return { color: 'text-yellow-400', label: 'Gold', icon: Medal };
    if (score >= 20) return { color: 'text-gray-300', label: 'Silver', icon: Medal };
    if (score >= 10) return { color: 'text-orange-400', label: 'Bronze', icon: Medal };
    return null;
  };

  const earnedMedal = getMedal(gameState.score);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
      {/* HUD (Top Bar) */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-start pointer-events-auto">
        <button 
          onClick={onOpenSettings} 
          className="bg-white/10 backdrop-blur p-2 rounded-full hover:bg-white/20 text-white transition-colors"
        >
          <Settings size={24} />
        </button>

        {(isPlaying || isGameOver || isPaused) && (
          <div className="text-6xl font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] font-mono">
            {gameState.score}
          </div>
        )}

        {(isPlaying || isPaused) && (
          <button 
            onClick={isPaused ? onResume : onPause}
            className="bg-white/10 backdrop-blur p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            {isPaused ? <Play size={24} /> : <Pause size={24} />}
          </button>
        )}
        {/* Spacer for layout balance if idle */}
        {isIdle && <div className="w-10"></div>}
      </div>

      {/* Paused Screen */}
      {isPaused && (
        <div className="bg-black/50 backdrop-blur-md p-8 rounded-2xl text-center pointer-events-auto animate-in fade-in zoom-in duration-200">
           <h2 className="text-4xl font-bold text-white mb-4">PAUSED</h2>
           <button 
            onClick={onResume}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold transition-all"
           >
             RESUME
           </button>
        </div>
      )}

      {/* Start Screen */}
      {isIdle && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl text-center pointer-events-auto animate-in fade-in zoom-in duration-300">
          <h1 className="text-5xl font-extrabold text-white mb-2 drop-shadow-lg tracking-tight">RealFlap</h1>
          <p className="text-gray-200 mb-8 text-lg">Realistic Physics Engine</p>
          <button 
            onClick={onStart}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-gradient-to-r from-orange-500 to-red-500 rounded-full hover:from-orange-600 hover:to-red-600 focus:outline-none ring-offset-2 focus:ring-2 ring-red-400 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <Play className="mr-2 w-6 h-6 fill-current" />
            START FLIGHT
          </button>
          <p className="mt-4 text-sm text-gray-300 opacity-80">Tap, Click, or Spacebar to Fly</p>
        </div>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="bg-black/40 backdrop-blur-lg border border-white/10 p-10 rounded-3xl shadow-2xl text-center pointer-events-auto animate-in slide-in-from-bottom-10 duration-500 min-w-[320px]">
          <h2 className="text-4xl font-black text-red-500 mb-6 drop-shadow-md uppercase tracking-widest">Crashed</h2>
          
          <div className="flex gap-4 mb-6 justify-center">
             {/* Medal Display */}
             {earnedMedal ? (
               <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white/10 to-transparent p-4 rounded-xl border border-white/10 w-24">
                  <earnedMedal.icon className={`w-10 h-10 ${earnedMedal.color} mb-2 drop-shadow-lg`} />
                  <span className={`text-xs uppercase font-bold ${earnedMedal.color}`}>{earnedMedal.label}</span>
               </div>
             ) : (
                <div className="flex flex-col items-center justify-center bg-white/5 p-4 rounded-xl border border-white/5 w-24 opacity-50">
                  <div className="w-10 h-10 rounded-full bg-gray-700 mb-2" />
                  <span className="text-xs uppercase text-gray-500">No Medal</span>
                </div>
             )}

             <div className="flex flex-col gap-3">
                <div className="bg-white/10 p-3 rounded-xl w-32">
                  <span className="text-gray-300 text-xs uppercase tracking-wider block mb-1">Score</span>
                  <span className="text-3xl font-bold text-white">{gameState.score}</span>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/30 p-3 rounded-xl w-32">
                  <span className="text-yellow-200 text-xs uppercase tracking-wider flex items-center justify-center mb-1">
                    <Trophy className="w-3 h-3 mr-1" /> Best
                  </span>
                  <span className="text-2xl font-bold text-yellow-400">{gameState.highScore}</span>
                </div>
             </div>
          </div>

          <button 
            onClick={onRestart}
            className="w-full flex items-center justify-center px-6 py-3 font-bold text-white transition-all duration-200 bg-emerald-600 rounded-xl hover:bg-emerald-700 focus:outline-none shadow-lg hover:scale-105 active:scale-95"
          >
            <RotateCcw className="mr-2 w-5 h-5" />
            RETRY
          </button>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
