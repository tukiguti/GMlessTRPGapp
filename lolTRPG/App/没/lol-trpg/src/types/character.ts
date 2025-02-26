export type CharacterType = 'AD' | 'AP';
export type CharacterClass = 'Marksman' | 'Fighter' | 'Tank' | 'Mage' | 'Assassin';
export type SkillType = '絶対成功' | '範囲攻撃' | '妨害';

export interface CustomSkill {
  id: string;
  name: string;
  type: SkillType;
}

// ✅ キャラクターの基本情報
export interface CustomCharacter {
  id: string;
  name: string;
  type: CharacterType;
  class: CharacterClass;
  skills: CustomSkill[];
  attack: string;  // 例: "3D6" や "1D6+4"
  dodge: string;   // 例: "1D6+4"
  hp: number;      // 例: 3 (HPの初期値)
}

// ✅ AD / AP による選択可能なクラスの制限
export const CLASS_OPTIONS: Record<CharacterType, CharacterClass[]> = {
  AD: ['Marksman', 'Fighter', 'Tank'],
  AP: ['Mage', 'Assassin'],
};

// ✅ クラスごとの攻撃・回避・HPの初期値
export const CLASS_STATS: Record<CharacterClass, { attack: string; dodge: string; hp: number }> = {
  Marksman: { attack: '3D6', dodge: '1D6', hp: 2 },
  Fighter: { attack: '1D6+4', dodge: '1D6+4', hp: 4 },
  Tank: { attack: '1D6', dodge: '1D6', hp: 5 },
  Mage: { attack: '2D6', dodge: '1D6+4', hp: 3 },
  Assassin: { attack: '2D3+3', dodge: '2D6+3', hp: 2 },
};

// ✅ 固定のスキル効果リスト
export const PRESET_SKILLS: SkillType[] = ['絶対成功', '範囲攻撃', '妨害'];
