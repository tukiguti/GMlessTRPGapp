import { create } from 'zustand';

interface GamePhaseState {
  gamePhase: 'setup' | 'teamSelect' | 'lane' | 'siege';
  setGamePhase: (phase: 'setup' | 'teamSelect' | 'lane' | 'siege') => void;
}

export const useGamePhaseStore = create<GamePhaseState>((set) => ({
  gamePhase: 'setup',

  setGamePhase: (phase) => set({ gamePhase: phase }),
}));
