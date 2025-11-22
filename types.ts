
export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  PAUSED = 'PAUSED'
}

export interface Bird {
  x: number;
  y: number;
  velocity: number;
  radius: number;
  rotation: number;
  frame: number; // For animation cycle
}

export interface Pipe {
  x: number;
  topHeight: number;
  width: number;
  gap: number;
  passed: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'FEATHER' | 'DUST';
  rotation?: number;
}

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
}

export interface AppSettings {
  musicVolume: number;
  sfxVolume: number;
  hardcoreMode: boolean;
}

export interface Dimensions {
  width: number;
  height: number;
}
