import { create } from 'zustand';
import { CustomCharacter, SkillType } from '../types/character';

interface GameState {
  characters: CustomCharacter[];
  teamSize: number;
  blueTeam: CustomCharacter[];
  redTeam: CustomCharacter[];
  actions: { [playerId: string]: string };
  gamePhase: 'setup' | 'lane' | 'siege';

  addCharacter: (char: CustomCharacter) => void;
  setTeamSize: (size: number) => void;
  setTeams: (blue: CustomCharacter[], red: CustomCharacter[]) => void;
  loadCharactersFromJson: (jsonData: { characters: CustomCharacter[] }) => void;
  
  setActions: (playerId: string, action: string) => void;
  updateHp: (playerId: string, newHp: number) => void;
  applySkill: (playerId: string, skill: SkillType) => void;
  setGamePhase: (phase: 'setup' | 'lane' | 'siege') => void;
}

export const useGameStore = create<GameState>((set) => ({
  characters: [],
  teamSize: 1,
  blueTeam: [],
  redTeam: [],
  actions: {},
  gamePhase: 'setup',

  // ✅ キャラクターを追加
  addCharacter: (char) => set((state) => ({
    characters: [...state.characters, char],
  })),

  // ✅ チームサイズ変更
  setTeamSize: (size) => set({ teamSize: size }),

  // ✅ チーム編成
  setTeams: (blue, red) => set({ blueTeam: blue, redTeam: red }),

  // ✅ JSONからキャラクターをロード
  loadCharactersFromJson: (jsonData) => set((state) => ({
    characters: [...state.characters, ...jsonData.characters],
  })),

  // ✅ 各プレイヤーの行動を設定
  setActions: (playerId, action) => set((state) => ({
    actions: { ...state.actions, [playerId]: action },
  })),

  // ✅ HPを更新
  updateHp: (playerId, newHp) => set((state) => ({
    blueTeam: state.blueTeam.map(p =>
      p.id === playerId ? { ...p, hp: Math.max(0, newHp) } : p
    ),
    redTeam: state.redTeam.map(p =>
      p.id === playerId ? { ...p, hp: Math.max(0, newHp) } : p
    ),
  })),

  // ✅ スキル適用（スキルの種類ごとに効果を適用）
  applySkill: (playerId, skill) => set((state) => {
    const modifyCharacter = (char: CustomCharacter) => {
      if (char.id !== playerId) return char;

      switch (skill) {
        case '絶対成功':
          return { ...char, attack: '6D6' }; // 攻撃力を最大化
        case '範囲攻撃':
          return { ...char, attack: '2D6+3' }; // 攻撃力アップ
        case '妨害':
          return { ...char, dodge: '1D6' }; // 回避率をダウン
        default:
          return char;
      }
    };

    return {
      blueTeam: state.blueTeam.map(modifyCharacter),
      redTeam: state.redTeam.map(modifyCharacter),
    };
  }),

  // ✅ ゲームフェーズを設定（`setup` → `lane` → `siege`）
  setGamePhase: (phase) => set({ gamePhase: phase }),
}));
