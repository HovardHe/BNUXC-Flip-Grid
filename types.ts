export type CellState = boolean; // true = on (lit), false = off (dark)

export interface Level {
  id: string;
  name: string;
  initialState: CellState[]; // Array of 9 booleans for 3x3
}

export interface GameStats {
  timeSeconds: number;
  steps: number;
}

export interface LevelRecord {
  levelId: string;
  name: string;
  stats: GameStats;
}

export enum GameStatus {
  SETUP = 'SETUP', // Admin configuring levels
  IDLE = 'IDLE', // Ready to start a level (Blind state)
  PLAYING = 'PLAYING',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE', // Brief success state
  ALL_COMPLETE = 'ALL_COMPLETE', // Final summary
}

export const GRID_SIZE = 3;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;