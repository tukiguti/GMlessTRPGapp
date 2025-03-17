// src/store/teamStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Character, CharacterClass, Role } from '../models/types';
import { useCharacterStore } from './characterStore';

// チームメンバー情報
interface TeamMember {
  characterId: string | null;
  role: Role;
}

// チーム情報
interface Team {
  members: TeamMember[];
}

// ストアの状態
interface TeamState {
  blueTeam: Team;
  redTeam: Team;
}

// アクション
interface TeamActions {
  assignCharacter: (
    team: 'BLUE' | 'RED', 
    role: Role, 
    characterId: string | null
  ) => void;
  validateTeams: () => { valid: boolean; errors: string[] };
  resetTeams: () => void;
  saveTeamFormation: () => void;
  loadTeamFormation: () => void;
  isRoleAllowed: (characterClass: CharacterClass, role: Role) => boolean;
}

// ロールごとに許可されるキャラクタークラスのマッピング
const ROLE_CLASS_MAPPING: Record<Role, CharacterClass[]> = {
  'TOP': ['タンク', 'ファイター', 'マークスマン', 'メイジ', 'アサシン'],
  'JG': ['ファームJG', 'ガンクJG'],
  'MID': ['メイジ', 'アサシン', 'マークスマン'],
  'ADC': ['マークスマン', 'メイジ', 'アサシン'],
  'SUP': ['サポート']
};

// チームストア
export const useTeamStore = create<TeamState & TeamActions>()(
  immer((set, get) => ({
    // 初期状態
    blueTeam: {
      members: [
        { characterId: null, role: 'TOP' },
        { characterId: null, role: 'JG' },
        { characterId: null, role: 'MID' },
        { characterId: null, role: 'ADC' },
        { characterId: null, role: 'SUP' }
      ]
    },
    redTeam: {
      members: [
        { characterId: null, role: 'TOP' },
        { characterId: null, role: 'JG' },
        { characterId: null, role: 'MID' },
        { characterId: null, role: 'ADC' },
        { characterId: null, role: 'SUP' }
      ]
    },

    // キャラクターをチームとロールに割り当てる
    assignCharacter: (team, role, characterId) => {
      set((state) => {
        const targetTeam = team === 'BLUE' ? state.blueTeam : state.redTeam;
        const otherTeam = team === 'BLUE' ? state.redTeam : state.blueTeam;
        
        // 同じキャラクターが他のロールや他のチームで使用されていないか確認
        if (characterId) {
          // 同じチーム内の他のロールで使用されていないか
          const alreadyInTeam = targetTeam.members.some(
            member => member.role !== role && member.characterId === characterId
          );
          
          // 他のチームで使用されていないか
          const alreadyInOtherTeam = otherTeam.members.some(
            member => member.characterId === characterId
          );
          
          if (alreadyInTeam || alreadyInOtherTeam) {
            console.error('このキャラクターは既に別のポジションに配置されています');
            return;
          }
          
          // ロールとクラスの互換性チェック
          const character = useCharacterStore.getState().characters.find(
            c => c.id === characterId
          );
          
          if (character && !get().isRoleAllowed(character.class, role)) {
            console.error(`${character.class}は${role}ポジションに配置できません`);
            return;
          }
        }
        
        // キャラクターを割り当て
        const memberIndex = targetTeam.members.findIndex(m => m.role === role);
        if (memberIndex !== -1) {
          targetTeam.members[memberIndex].characterId = characterId;
        }
      });
      
      // 変更を保存
      get().saveTeamFormation();
    },
    
    // チーム編成の検証
    validateTeams: () => {
      const { blueTeam, redTeam } = get();
      const errors: string[] = [];
      
      // 両チームがすべてのロールを埋めているか確認
      const blueEmpty = blueTeam.members.some(m => m.characterId === null);
      const redEmpty = redTeam.members.some(m => m.characterId === null);
      
      if (blueEmpty) {
        errors.push('ブルーチームの全てのポジションにキャラクターを配置してください');
      }
      
      if (redEmpty) {
        errors.push('レッドチームの全てのポジションにキャラクターを配置してください');
      }
      
      return { valid: errors.length === 0, errors };
    },
    
    // チーム編成をリセット
    resetTeams: () => {
      set((state) => {
        state.blueTeam.members.forEach(m => m.characterId = null);
        state.redTeam.members.forEach(m => m.characterId = null);
      });
      get().saveTeamFormation();
    },
    
    // チーム編成をローカルストレージに保存
    saveTeamFormation: () => {
      try {
        const { blueTeam, redTeam } = get();
        localStorage.setItem('lol-trpg-team-formation', JSON.stringify({
          blueTeam,
          redTeam
        }));
      } catch (error) {
        console.error('チーム編成の保存に失敗しました:', error);
      }
    },
    
    // チーム編成をローカルストレージから読み込み
    loadTeamFormation: () => {
      try {
        const savedData = localStorage.getItem('lol-trpg-team-formation');
        if (savedData) {
          const { blueTeam, redTeam } = JSON.parse(savedData);
          set({ blueTeam, redTeam });
        }
      } catch (error) {
        console.error('チーム編成の読み込みに失敗しました:', error);
      }
    },
    
    // キャラクタークラスとロールの互換性をチェック
    isRoleAllowed: (characterClass, role) => {
      return ROLE_CLASS_MAPPING[role].includes(characterClass);
    }
  }))
);

// アプリケーション起動時にローカルストレージから読み込む
useTeamStore.getState().loadTeamFormation();