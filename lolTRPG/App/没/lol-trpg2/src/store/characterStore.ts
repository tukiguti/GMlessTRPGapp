// src/store/characterStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Character, Skill } from '../models/types';

// ローカルストレージのキー
const STORAGE_KEY = 'lol-trpg-characters';

interface CharacterState {
  // 状態
  characters: Character[];
  selectedCharacterId: string | null;
}

interface CharacterActions {
  // アクション - キャラクター管理
  addCharacter: (character: Character) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (characterId: string) => void;
  selectCharacter: (characterId: string | null) => void;
  
  // アクション - スキル管理
  addSkillToCharacter: (characterId: string, skill: Skill) => void;
  removeSkillFromCharacter: (characterId: string, skillId: string) => void;
  
  // アクション - データ永続化
  loadCharacters: () => void;
  saveToLocalStorage: () => void;
  
  // アクション - JSON関連
  exportCharacterToJson: (characterId: string) => string;
  importCharacterFromJson: (jsonData: string) => void;
  
  // ゲッター
  getSelectedCharacter: () => Character | null;
  getAllCharacters: () => Character[];
}

type CharacterStore = CharacterState & CharacterActions;

export const useCharacterStore = create<CharacterStore>()(
  immer((set, get) => ({
    // 初期状態
    characters: [],
    selectedCharacterId: null,
    
    // キャラクター管理
    addCharacter: (character) => {
      set((state) => {
        // 同じIDのキャラクターが存在しないか確認
        const exists = state.characters.some(c => c.id === character.id);
        if (!exists) {
          state.characters.push(character);
        }
      });
      get().saveToLocalStorage();
    },
    
    updateCharacter: (characterId, updates) => {
      set((state) => {
        const index = state.characters.findIndex(c => c.id === characterId);
        if (index !== -1) {
          // 既存のキャラクターと更新内容をマージ
          state.characters[index] = { 
            ...state.characters[index], 
            ...updates 
          };
        }
      });
      get().saveToLocalStorage();
    },
    
    deleteCharacter: (characterId) => {
      set((state) => {
        state.characters = state.characters.filter(c => c.id !== characterId);
        // 選択中のキャラクターが削除された場合、選択を解除
        if (state.selectedCharacterId === characterId) {
          state.selectedCharacterId = null;
        }
      });
      get().saveToLocalStorage();
    },
    
    selectCharacter: (characterId) => {
      set((state) => {
        state.selectedCharacterId = characterId;
      });
    },
    
    // スキル管理
    addSkillToCharacter: (characterId, skill) => {
      set((state) => {
        const character = state.characters.find(c => c.id === characterId);
        if (character) {
          // 既存のスキルを全て削除して新しいスキルを追加（スキルは1つのみ）
          character.skills = [skill];
        }
      });
      get().saveToLocalStorage();
    },
    
    removeSkillFromCharacter: (characterId, skillId) => {
      set((state) => {
        const character = state.characters.find(c => c.id === characterId);
        if (character) {
          character.skills = character.skills.filter(s => s.id !== skillId);
        }
      });
      get().saveToLocalStorage();
    },
    
    // データ永続化
    loadCharacters: () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData) as Character[];
          set({ characters: parsedData });
        }
      } catch (error) {
        console.error('キャラクターデータの読み込みに失敗しました:', error);
      }
    },
    
    saveToLocalStorage: () => {
      try {
        const { characters } = get();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
      } catch (error) {
        console.error('キャラクターデータの保存に失敗しました:', error);
      }
    },
    
    // JSON関連
    exportCharacterToJson: (characterId) => {
      const character = get().characters.find(c => c.id === characterId);
      if (!character) return '';
      return JSON.stringify(character, null, 2);
    },
    
    importCharacterFromJson: (jsonData) => {
      try {
        // JSONデータを解析
        const parsedData = JSON.parse(jsonData);
        
        // 配列かどうかをチェック
        const charactersToImport = Array.isArray(parsedData) ? parsedData : [parsedData];
        
        // 各キャラクターの検証とインポート
        const validCharacters: Character[] = [];
        const errors: string[] = [];
        
        charactersToImport.forEach((character, index) => {
          // 基本的な検証
          if (!character.id || !character.name || !character.class) {
            errors.push(`キャラクター#${index + 1}: 必須フィールドが不足しています。`);
            return;
          }
          
          validCharacters.push(character);
        });
        
        // エラーがあれば例外をスロー
        if (errors.length > 0) {
          throw new Error(`検証エラー:\n${errors.join('\n')}`);
        }
        
        // 有効なキャラクターをインポート
        set((state) => {
          validCharacters.forEach(character => {
            // 既存のキャラクターと重複するIDかチェック
            const existingIndex = state.characters.findIndex(c => c.id === character.id);
            
            if (existingIndex !== -1) {
              // 既存のキャラクターを更新
              state.characters[existingIndex] = character;
            } else {
              // 新しいキャラクターを追加
              state.characters.push(character);
            }
          });
        });
        
        get().saveToLocalStorage();
        return `${validCharacters.length}人のキャラクターをインポートしました。`;
      } catch (error) {
        console.error('キャラクターのインポートに失敗しました:', error);
        throw error; // エラーを再スローして呼び出し元で処理できるようにする
      }
    },
    
    // 複数キャラクターのエクスポート機能も追加
    exportAllCharactersToJson: () => {
      const { characters } = get();
      return JSON.stringify(characters, null, 2);
    },
    
    // ゲッター
    getSelectedCharacter: () => {
      const { characters, selectedCharacterId } = get();
      if (!selectedCharacterId) return null;
      return characters.find(c => c.id === selectedCharacterId) || null;
    },
    
    getAllCharacters: () => {
      return get().characters;
    }
  }))
);

// アプリケーション起動時にローカルストレージからデータを読み込む
useCharacterStore.getState().loadCharacters();