import { create } from 'zustand';

// ========================================
// 型定義
// ========================================
export interface Character {
  id: string;
  name: string;
  role: string;
  lane: string;
  level: number;
  hp: number;
  maxHp: number;
  gold: number;
  stats: {
    attack: number;
    defense: number;
    mobility: number;
    utility: number;
  };
  position: {
    area: string;
    lane: string;
  };
  buffs: any[];
  items: any[];
  alive: boolean;
}

export interface Tower {
  id: string;
  team: 'blue' | 'red';
  type: string;
  lane?: string;
  hp: number;
  maxHp: number;
  destroyed: boolean;
}

export interface GameState {
  // ゲーム情報
  gameId: string | null;
  mode: string;
  round: number;
  phase: 'declaration' | 'resolution';
  status: 'waiting' | 'in_progress' | 'finished';

  // プレイヤー情報
  playerId: string | null;
  playerName: string | null;
  team: 'blue' | 'red' | null;

  // ゲームデータ
  characters: Character[];
  towers: Tower[];
  minions: any[];

  // 選択中のキャラクター
  selectedCharacterId: string | null;

  // アクション
  setGameId: (gameId: string) => void;
  setPlayerInfo: (playerId: string, playerName: string, team: 'blue' | 'red') => void;
  setGameState: (state: Partial<GameState>) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  updateTower: (id: string, updates: Partial<Tower>) => void;
  selectCharacter: (id: string) => void;
  resetGame: () => void;
}

// ========================================
// 初期状態
// ========================================
const initialState = {
  gameId: null,
  mode: 'casual',
  round: 0,
  phase: 'declaration' as const,
  status: 'waiting' as const,
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
export const useGameStore = create<GameState>((set) => ({
  ...initialState,

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
}));
