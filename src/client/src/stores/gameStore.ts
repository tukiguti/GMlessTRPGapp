import { create } from 'zustand';
import type {
  Character,
  Tower,

  GameState as BaseGameState,
  Buff,
  Item,
  CharacterStats,
} from '@gmless-trpg/game';

// ========================================
// GameStoreの型定義（BaseGameStateを拡張）
// ========================================
export interface GameStore extends Omit<BaseGameState, 'teams'> {
  // クライアント独自の拡張
  playerId: string | null;
  playerName: string | null;
  team: 'blue' | 'red' | null;
  selectedCharacterId: string | null;

  // チーム管理 (BaseGameStateのteamsを展開して扱いやすくする)
  teams: {
    blue: Character[];
    red: Character[];
  };

  // 基本アクション
  setGameId: (gameId: string) => void;
  setPlayerInfo: (playerId: string, playerName: string, team: 'blue' | 'red') => void;
  setGameState: (state: Partial<GameStore>) => void;
  syncWithServer: (serverState: BaseGameState) => void;

  updateCharacter: (id: string, updates: Partial<Character>) => void;
  updateTower: (id: string, updates: Partial<Tower>) => void;
  selectCharacter: (id: string) => void;
  resetGame: () => void;

  // バフ管理
  addBuff: (characterId: string, buff: Buff) => void;
  removeBuff: (characterId: string, buffType: Buff['type']) => void;
  updateBuffs: (characterId: string, currentRound: number) => void;

  // アイテム管理
  addItem: (characterId: string, item: Item) => void;
  removeItem: (characterId: string, itemId: string) => void;
  canPurchaseItem: (characterId: string, item: Item) => boolean;
  purchaseItem: (characterId: string, item: Item) => boolean;

  // スキル管理
  useSkill: (characterId: string, skillType: 'normal' | 'ult') => boolean;
  updateSkillCooldowns: (characterId: string, currentRound: number) => void;

  // ステータス計算
  calculateFinalStats: (character: Character) => CharacterStats;
  refreshCharacterStats: (characterId: string) => void;
}

// ========================================
// 初期状態
// ========================================
const initialState = {
  gameId: '',
  mode: 'casual' as const,
  round: 0,
  phase: 'declaration' as const,
  status: 'waiting' as const,
  playerId: null,
  playerName: null,
  team: null,
  teams: {
    blue: [],
    red: []
  },
  towers: [],
  minions: [],
  jungleBuffs: [],
  objects: [],
  selectedCharacterId: null,
};

// ========================================
// ヘルパー関数：finalStatsの計算
// ========================================
const calculateFinalStats = (character: Character): CharacterStats => {
  // 1. baseStatsから開始 (statsプロパティを使用 + hp)
  const final: CharacterStats = {
    ...character.stats,
    hp: character.maxHp // Base HP is maxHp
  };

  // 2. アイテムボーナスを加算
  character.items.forEach((item) => {
    if (item.stats.hp) final.hp += item.stats.hp;
    if (item.stats.attack) final.attack += item.stats.attack;
    if (item.stats.defense) final.defense += item.stats.defense;
    if (item.stats.mobility) final.mobility += item.stats.mobility;
    if (item.stats.utility) final.utility += item.stats.utility;
  });

  // 3. バフ効果を加算
  // Note: Buff type definition in Character.ts is simple. 
  // We assume 'effect' or 'type' determines the stat.
  // For now, we will just log or skip complex parsing to avoid type errors.
  character.buffs.forEach((_buff) => {
    // TODO: Implement proper buff effect parsing based on buff.effect or buff.type
    // Example: if (buff.effect === 'attack_boost') final.attack += buff.value;
  });

  return final;
};

// ========================================
// ヘルパー関数：キャラクター更新
// ========================================
const updateCharacterInTeams = (
  teams: { blue: Character[]; red: Character[] },
  id: string,
  updateFn: (char: Character) => Character
) => {
  return {
    blue: teams.blue.map(c => c.id === id ? updateFn(c) : c),
    red: teams.red.map(c => c.id === id ? updateFn(c) : c)
  };
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

  syncWithServer: (serverState: BaseGameState) => set((prev) => ({
    ...prev,
    ...serverState,
    playerId: prev.playerId,
    playerName: prev.playerName,
    team: prev.team,
    selectedCharacterId: prev.selectedCharacterId
  })),

  updateCharacter: (id, updates) =>
    set((prev) => ({
      teams: updateCharacterInTeams(prev.teams, id, (char) => ({ ...char, ...updates }))
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
  // バフ管理
  // ========================================
  addBuff: (characterId, buff) =>
    set((prev) => ({
      teams: updateCharacterInTeams(prev.teams, characterId, (char) => {
        const updatedChar = { ...char, buffs: [...char.buffs, buff] };
        return updatedChar;
      })
    })),

  removeBuff: (characterId, buffType) =>
    set((prev) => ({
      teams: updateCharacterInTeams(prev.teams, characterId, (char) => ({
        ...char,
        buffs: char.buffs.filter((b) => b.type !== buffType)
      }))
    })),

  updateBuffs: (characterId, _currentRound) =>
    set((prev) => ({
      teams: updateCharacterInTeams(prev.teams, characterId, (char) => {
        const updatedBuffs = char.buffs
          .map((buff) => ({ ...buff, duration: buff.duration - 1 }))
          .filter((buff) => buff.duration > 0);
        return { ...char, buffs: updatedBuffs };
      })
    })),

  // ========================================
  // アイテム管理
  // ========================================
  addItem: (characterId, item) =>
    set((prev) => ({
      teams: updateCharacterInTeams(prev.teams, characterId, (char) => ({
        ...char,
        items: [...char.items, item]
      }))
    })),

  removeItem: (characterId, itemId) =>
    set((prev) => ({
      teams: updateCharacterInTeams(prev.teams, characterId, (char) => ({
        ...char,
        items: char.items.filter((i) => i.name !== itemId)
      }))
    })),

  canPurchaseItem: (characterId, item) => {
    const state = get();
    const char = [...state.teams.blue, ...state.teams.red].find((c) => c.id === characterId);
    if (!char) return false;
    return char.gold >= item.stats.cost;
  },

  purchaseItem: (characterId, item) => {
    const store = get();
    if (!store.canPurchaseItem(characterId, item)) return false;

    set((prev) => ({
      teams: updateCharacterInTeams(prev.teams, characterId, (char) => ({
        ...char,
        gold: char.gold - item.stats.cost,
        items: [...char.items, item]
      }))
    }));

    return true;
  },

  // ========================================
  // スキル管理
  // ========================================
  useSkill: (characterId, skillType) => {
    const state = get();
    const char = [...state.teams.blue, ...state.teams.red].find((c) => c.id === characterId);
    if (!char) return false;

    const skill = char.skills[skillType];
    if (skill.currentCooldown > 0) return false;

    set((prev) => ({
      teams: updateCharacterInTeams(prev.teams, characterId, (c) => ({
        ...c,
        skills: {
          ...c.skills,
          [skillType]: {
            ...c.skills[skillType],
            currentCooldown: c.skills[skillType].cooldown
          },
        },
      }))
    }));

    return true;
  },

  updateSkillCooldowns: (characterId, _currentRound) =>
    set((prev) => ({
      teams: updateCharacterInTeams(prev.teams, characterId, (char) => ({
        ...char,
        skills: {
          normal: {
            ...char.skills.normal,
            currentCooldown: Math.max(0, char.skills.normal.currentCooldown - 1)
          },
          ult: {
            ...char.skills.ult,
            currentCooldown: Math.max(0, char.skills.ult.currentCooldown - 1)
          },
        },
      }))
    })),

  // ========================================
  // ステータス計算
  // ========================================
  calculateFinalStats,

  refreshCharacterStats: (characterId) =>
    set((prev) => ({
      teams: updateCharacterInTeams(prev.teams, characterId, (char) => ({
        ...char,
        stats: calculateFinalStats(char) // Note: updating 'stats' property
      }))
    })),
}));
