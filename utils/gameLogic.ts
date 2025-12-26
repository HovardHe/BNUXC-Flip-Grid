import { GRID_SIZE, TOTAL_CELLS, CellState } from '../types';

export const createEmptyGrid = (): CellState[] => {
  return Array(TOTAL_CELLS).fill(false);
};

// Toggle a cell and its orthogonal neighbors
export const toggleGridCell = (grid: CellState[], index: number): CellState[] => {
  const newGrid = [...grid];
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;

  // Toggle self
  newGrid[index] = !newGrid[index];

  // Toggle Up
  if (row > 0) {
    const upIndex = (row - 1) * GRID_SIZE + col;
    newGrid[upIndex] = !newGrid[upIndex];
  }

  // Toggle Down
  if (row < GRID_SIZE - 1) {
    const downIndex = (row + 1) * GRID_SIZE + col;
    newGrid[downIndex] = !newGrid[downIndex];
  }

  // Toggle Left
  if (col > 0) {
    const leftIndex = row * GRID_SIZE + (col - 1);
    newGrid[leftIndex] = !newGrid[leftIndex];
  }

  // Toggle Right
  if (col < GRID_SIZE - 1) {
    const rightIndex = row * GRID_SIZE + (col + 1);
    newGrid[rightIndex] = !newGrid[rightIndex];
  }

  return newGrid;
};

// Check if all lights are ON (true)
export const isLevelSolved = (grid: CellState[]): boolean => {
  return grid.every((cell) => cell === true);
};
