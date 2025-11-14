import { create } from 'zustand';
import type {
  Character,
  Tower,
  Minion,
  GameState as BaseGameState,
  TeamType,
  GamePhase,
  GameStatus,
  Buff,
  Item,
  Stats,
} from '../types/game';

// Re-export types for external use
export type { Character, Tower, Minion, Buff, Item, Stats };

// ========================================
// GameStoreの型定義（BaseGameStateを拡張）
// ========================================
export interface GameStore extends Omit<BaseGameState, 'setGameId' | 'setPlayerInfo' | 'setGameState' | 'updateCharacter' | 'updateTower' | 'selectCharacter' | 'resetGame'> {
  // 基本アクション
  setGameId: (gameId: string) => void;
  setPlayerInfo: (playerId: string, playerName: string, team: TeamType) => void;
  setGameState: (state: Partial<GameStore>) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  updateTower: (id: string, updates: Partial<Tower>) => void;
  selectCharacter: (id: string) => void;
  resetGame: () => void;

  // バフ管理 (Task 6)
  addBuff: (characterId: string, buff: Buff) => void;
  removeBuff: (characterId: string, buffType: Buff['type']) => void;
  updateBuffs: (characterId: string, currentRound: number) => void;

  // アイテム管理 (Task 6)
  addItem: (characterId: string, item: Item) => void;
  removeItem: (characterId: string, itemId: string) => void;
  canPurchaseItem: (characterId: string, item: Item) => boolean;
  purchaseItem: (characterId: string, item: Item) => boolean;

  // スキル管理 (Task 6)
  useSkill: (characterId: string, skillType: 'normal' | 'ultimate') => boolean;
  updateSkillCooldowns: (characterId: string, currentRound: number) => void;

  // ステータス計算 (Task 7)
  calculateFinalStats: (character: Character) => Stats;
  refreshCharacterStats: (characterId: string) => void;
}

// ========================================
// 初期状態
// ========================================
const initialState = {
  gameId: null,
  mode: 'casual',
  round: 0,
  phase: 'declaration' as GamePhase,
  status: 'waiting' as GameStatus,
  playerId: null,
  playerName: null,
  team: null,
  characters: [] as Character[],
  towers: [] as Tower[],
  minions: [] as Minion[],
  selectedCharacterId: null,
};

// ========================================
// ヘルパー関数：finalStatsの計算 (Task 7)
// ========================================
const calculateFinalStats = (character: Character): Stats => {
  // 1. baseStatsから開始
  const final: Stats = { ...character.baseStats };

  // 2. アイテムボーナスを加算
  character.items.forEach((item) => {
    if (item.stats.attack) final.attack += item.stats.attack;
    if (item.stats.defense) final.defense += item.stats.defense;
    if (item.stats.mobility) final.mobility += item.stats.mobility;
    if (item.stats.utility) final.utility += item.stats.utility;
  });

  // 3. バフ効果を加算
  character.buffs.forEach((buff) => {
    if (buff.affectedStat) {
      final[buff.affectedStat] += buff.value;
    } else {
      // 全ステータスに影響（例：エルダードラゴン）
      final.attack += buff.value;
      final.defense += buff.value;
      final.mobility += buff.value;
      final.utility += buff.value;
    }
  });

  return final;
};

// ========================================
// Zustand Store
// ========================================
export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  // ========================================
  // 基本アクション
  // ========================================
  setGameId: (gameId) => set({ gameId }),

  setPlayerInfo: (playerId, playerName, team) =>
    set({ playerId, playerName, team }),

  setGameState: (state) => set((prev) => ({ ...prev, ...state })),

  updateCharacter: (id, updates) =>
    set((prev) => ({
      characters: prev.characters.map((char) =>
        char.id === id ? { ...char, ...updates } : char
      ),
    })),

  updateTower: (id, updates) =>
    set((prev) => ({
      towers: prev.towers.map((tower) =>
        tower.id === id ? { ...tower, ...updates } : tower
      ),
    })),

  selectCharacter: (id) => set({ selectedCharacterId: id }),

  resetGame: () => set(initialState),

  // ========================================
  // バフ管理 (Task 6)
  // ========================================
  addBuff: (characterId, buff) =>
    set((prev) => ({
      characters: prev.characters.map((char) => {
        if (char.id === characterId) {
          const updatedChar = {
            ...char,
            buffs: [...char.buffs, buff],
          };
          // バフ追加後、finalStatsを再計算
          updatedChar.finalStats = calculateFinalStats(updatedChar);
          return updatedChar;
        }
        return char;
      }),
    })),

  removeBuff: (characterId, buffType) =>
    set((prev) => ({
      characters: prev.characters.map((char) => {
        if (char.id === characterId) {
          const updatedChar = {
            ...char,
            buffs: char.buffs.filter((b) => b.type !== buffType),
          };
          // バフ削除後、finalStatsを再計算
          updatedChar.finalStats = calculateFinalStats(updatedChar);
          return updatedChar;
        }
        return char;
      }),
    })),

  updateBuffs: (characterId, _currentRound) =>
    set((prev) => ({
      characters: prev.characters.map((char) => {
        if (char.id === characterId) {
          // バフのdurationを減算し、0以下のものを削除
          const updatedBuffs = char.buffs
            .map((buff) => ({ ...buff, duration: buff.duration - 1 }))
            .filter((buff) => buff.duration > 0);

          const updatedChar = {
            ...char,
            buffs: updatedBuffs,
          };
          // バフ更新後、finalStatsを再計算
          updatedChar.finalStats = calculateFinalStats(updatedChar);
          return updatedChar;
        }
        return char;
      }),
    })),

  // ========================================
  // アイテム管理 (Task 6)
  // ========================================
  addItem: (characterId, item) =>
    set((prev) => ({
      characters: prev.characters.map((char) => {
        if (char.id === characterId) {
          const updatedChar = {
            ...char,
            items: [...char.items, item],
          };
          // アイテム追加後、finalStatsを再計算
          updatedChar.finalStats = calculateFinalStats(updatedChar);
          return updatedChar;
        }
        return char;
      }),
    })),

  removeItem: (characterId, itemId) =>
    set((prev) => ({
      characters: prev.characters.map((char) => {
        if (char.id === characterId) {
          const updatedChar = {
            ...char,
            items: char.items.filter((item) => item.id !== itemId),
          };
          // アイテム削除後、finalStatsを再計算
          updatedChar.finalStats = calculateFinalStats(updatedChar);
          return updatedChar;
        }
        return char;
      }),
    })),

  canPurchaseItem: (characterId, item) => {
    const char = get().characters.find((c) => c.id === characterId);
    if (!char) return false;
    return char.gold >= item.cost;
  },

  purchaseItem: (characterId, item) => {
    const store = get();
    if (!store.canPurchaseItem(characterId, item)) return false;

    set((prev) => ({
      characters: prev.characters.map((char) => {
        if (char.id === characterId) {
          const updatedChar = {
            ...char,
            gold: char.gold - item.cost,
            items: [...char.items, item],
          };
          // アイテム購入後、finalStatsを再計算
          updatedChar.finalStats = calculateFinalStats(updatedChar);
          return updatedChar;
        }
        return char;
      }),
    }));

    return true;
  },

  // ========================================
  // スキル管理 (Task 6)
  // ========================================
  useSkill: (characterId, skillType) => {
    const char = get().characters.find((c) => c.id === characterId);
    if (!char) return false;

    const skill = char.skills[skillType];
    if (!skill.ready) return false;

    const currentRound = get().round;

    set((prev) => ({
      characters: prev.characters.map((c) => {
        if (c.id === characterId) {
          return {
            ...c,
            skills: {
              ...c.skills,
              [skillType]: {
                ...skill,
                ready: false,
                lastUsedRound: currentRound,
              },
            },
          };
        }
        return c;
      }),
    }));

    return true;
  },

  updateSkillCooldowns: (characterId, currentRound) =>
    set((prev) => ({
      characters: prev.characters.map((char) => {
        if (char.id === characterId) {
          return {
            ...char,
            skills: {
              normal: {
                ...char.skills.normal,
                ready:
                  currentRound - char.skills.normal.lastUsedRound >=
                  char.skills.normal.cooldown,
              },
              ultimate: {
                ...char.skills.ultimate,
                ready:
                  currentRound - char.skills.ultimate.lastUsedRound >=
                  char.skills.ultimate.cooldown,
              },
            },
          };
        }
        return char;
      }),
    })),

  // ========================================
  // ステータス計算 (Task 7)
  // ========================================
  calculateFinalStats,

  refreshCharacterStats: (characterId) =>
    set((prev) => ({
      characters: prev.characters.map((char) => {
        if (char.id === characterId) {
          return {
            ...char,
            finalStats: calculateFinalStats(char),
          };
        }
        return char;
      }),
    })),
}));
