import { create } from 'zustand';

interface BattleState {
  actions: Record<string, { action: string; target?: string }>;
  hp: Record<string, number>;
  setActions: (id: string, action: { action: string; target?: string }) => void;
  updateHp: (id: string, newHp: number) => void;
}

export const useBattleStore = create<BattleState>((set) => ({
  actions: {},
  hp: {},
  setActions: (id, action) => set((state) => ({ actions: { ...state.actions, [id]: action } })),
  updateHp: (id, newHp) => set((state) => ({ hp: { ...state.hp, [id]: newHp } })),
}));
