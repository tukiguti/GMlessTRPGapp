import { create } from 'zustand';
import { SkillType } from '../types/character';

interface BattleState {
  actions: { [playerId: string]: { action: string; target?: string } };
  hp: { [playerId: string]: number };
  setActions: (playerId: string, actionData: { action: string; target?: string }) => void;
  updateHp: (playerId: string, newHp: number) => void;
  applySkill: (playerId: string, skill: SkillType) => void;
}

export const useBattleStore = create<BattleState>((set) => ({
  actions: {},
  hp: {},

  setActions: (playerId, actionData) =>
    set((state) => ({
      actions: { ...state.actions, [playerId]: actionData },
    })),

  updateHp: (playerId, newHp) =>
    set((state) => ({
      hp: { ...state.hp, [playerId]: Math.max(0, newHp) },
    })),

  applySkill: (playerId, skill) =>
    set((state) => ({
      actions: { ...state.actions, [playerId]: { action: skill, target: undefined } },
    })),
}));
