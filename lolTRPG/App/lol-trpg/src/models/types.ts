// src/models/types.ts

// キャラクターのクラス
export type CharacterClass = 
  // AD系
  | 'マークスマン' 
  | 'ファイター' 
  | 'タンク' 
  // AP系
  | 'メイジ' 
  | 'アサシン' 
  // JG系
  | 'ファームJG' 
  | 'ガンクJG'
  // SUP系
  | 'サポート';

// キャラクターのロール（ポジション）
export type Role = 'TOP' | 'JG' | 'MID' | 'ADC' | 'SUP';

// サポートのサブアクション
export type SupportActionType = 'エンチャント' | 'フック' | 'タンク';

// スキルタイプ
export type SkillType = 
  | '絶対成功' 
  | '範囲攻撃' 
  | '妨害' 
  | '固定値増加' 
  | 'ダイス個数増加';

// アイテムタイプ
export type ItemType = 
  | '靴' 
  | '弓' 
  | 'ハンマー' 
  | '鎧' 
  | '剣' 
  | '指輪' 
  | '本';

// スキル情報
export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  usedCount: number; // 使用回数
}

// アイテム情報
export interface Item {
  id: string;
  name: string;
  type: ItemType;
  cost: number;
  effect: string;
}

// キャラクター情報
export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  hp: number;
  maxHp: number;
  fp: number; // ファームポイント（初期値0）
  attackDice: string; // "2D6+3" などのダイス表記
  avoidDice: string;  // "1D6+2" などのダイス表記
  skills: Skill[];
  items: Item[];
  role?: Role;      // チーム編成時に割り当てられる
  team?: 'BLUE' | 'RED'; // チーム編成時に割り当てられる
}

// 各クラスのデフォルトステータス定義
export const CLASS_STATS: Record<CharacterClass, { hp: number, attackDice: string, avoidDice: string }> = {
  'マークスマン': { hp: 2, attackDice: '3D6', avoidDice: '1D6' },
  'ファイター': { hp: 4, attackDice: '1D6+4', avoidDice: '1D6+4' },
  'タンク': { hp: 6, attackDice: '1D6+2', avoidDice: '1D6+2' },
  'メイジ': { hp: 3, attackDice: '2D6', avoidDice: '1D6+4' },
  'アサシン': { hp: 1, attackDice: '2D6+2', avoidDice: '2D6+3' },
  'ファームJG': { hp: 2, attackDice: '1D6+4', avoidDice: '2D6+3' },
  'ガンクJG': { hp: 2, attackDice: '2D6', avoidDice: '1D6+3' },
  'サポート': { hp: 1, attackDice: '', avoidDice: '' }, // サポートは攻撃・回避なし
};

// スキルの詳細説明
export const SKILL_DESCRIPTIONS: Record<SkillType, string> = {
  '絶対成功': '発動可能なダイスが全て最大値として算出されます。2回目からは1D6で2以上出すことで失敗します。失敗した場合ダイス一個を１として換算します。',
  '範囲攻撃': '攻撃対象を全体まで増やせます。2回目からは1D6で3以上だすことで失敗します。失敗した場合攻撃に-6の判定を追加します。ただし、攻撃対象は全体のままです。',
  '妨害': '相手のダイス一つを1として計算します。2回目からは1D6で3以上を出すことで失敗します。失敗すると自身の判定に-3が付きます。',
  '固定値増加': 'ダイスに対して+4の判定を付与します。2回目からは1D6で3以上を出すことで失敗します。失敗すると-2の判定を付与します。',
  'ダイス個数増加': '判定時に1D6ダイスを追加することができます。2回目からは1D6で3以上出すことでスキルが失敗します。失敗した場合判定時に-1d6ダイスを追加します。'
};

// アクションタイプ
export type ActionType = 'ファーム' | 'アタック' | 'リコール' | 'サイドプッシュ' | 'スキル';

// ゲームフェーズ
export type GamePhase = 'CHARACTER_CREATION' | 'TEAM_FORMATION' | 'LANE_BATTLE' | 'TEAM_BATTLE' | 'END';

// プレイヤーアクション
export interface PlayerAction {
  characterId: string;
  actionType: ActionType;
  targetId?: string; // アタック対象
  skillId?: string;  // 使用するスキルID
}

// ゲームの状態
export interface GameState {
  phase: GamePhase;
  round: number;
  blueTeam: Character[];
  redTeam: Character[];
  blueTowers: number;
  redTowers: number;
}

// ユーティリティ関数: 新しいキャラクターの作成
export const createNewCharacter = (name: string, characterClass: CharacterClass): Character => {
  const stats = CLASS_STATS[characterClass];
  return {
    id: `char_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    class: characterClass,
    hp: stats.hp,
    maxHp: stats.hp,
    fp: 0,
    attackDice: stats.attackDice,
    avoidDice: stats.avoidDice,
    skills: [],
    items: []
  };
};

// ユーティリティ関数: 新しいスキルの作成
export const createNewSkill = (name: string, type: SkillType): Skill => {
  return {
    id: `skill_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    type,
    description: SKILL_DESCRIPTIONS[type],
    usedCount: 0
  };
};

export interface TurnResult {
  characterId: string;
  targetId?: string;
  action: ActionType;
  supportType?: SupportActionType;
  rolls: DiceRoll[];
  success: boolean;
  damage?: number;
  fpGained?: number;
  buffAdded?: number;
  debuffAdded?: number;
  tankEffect?: boolean;
  towerDamage?: number;
  forceRecall?: boolean;
  itemPurchased?: string;
  killedTarget?: boolean;
}

export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  hp: number;
  maxHp: number;
  fp: number; // ファームポイント
  attackDice: string; // "2D6+3" などの形式
  avoidDice: string;
  skills: Skill[];
  items: Item[];
  role?: Role;
  team?: 'BLUE' | 'RED';  // 明示的に'BLUE'または'RED'に限定
}