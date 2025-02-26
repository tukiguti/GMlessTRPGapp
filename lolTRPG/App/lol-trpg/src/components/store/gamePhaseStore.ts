import { create } from 'zustand';

interface GamePhaseState {
  currentPhase: string;
  setGamePhase: (phase: string) => void;
}

export const useGamePhaseStore = create<GamePhaseState>((set) => ({
  currentPhase: 'setup',
  setGamePhase: (phase) => set({ currentPhase: phase }), // ✅ `setGamePhase()` を定義
}));
