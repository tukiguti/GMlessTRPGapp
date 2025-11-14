import { create } from 'zustand';
// ========================================
// 初期状態
// ========================================
const initialState = {
    gameId: null,
    mode: 'casual',
    round: 0,
    phase: 'declaration',
    status: 'waiting',
    playerId: null,
    playerName: null,
    team: null,
    characters: [],
    towers: [],
    minions: [],
    selectedCharacterId: null,
};
// ========================================
// Zustand Store
// ========================================
export const useGameStore = create((set) => ({
    ...initialState,
    setGameId: (gameId) => set({ gameId }),
    setPlayerInfo: (playerId, playerName, team) => set({ playerId, playerName, team }),
    setGameState: (state) => set((prev) => ({ ...prev, ...state })),
    updateCharacter: (id, updates) => set((prev) => ({
        characters: prev.characters.map((char) => char.id === id ? { ...char, ...updates } : char),
    })),
    updateTower: (id, updates) => set((prev) => ({
        towers: prev.towers.map((tower) => tower.id === id ? { ...tower, ...updates } : tower),
    })),
    selectCharacter: (id) => set({ selectedCharacterId: id }),
    resetGame: () => set(initialState),
}));
