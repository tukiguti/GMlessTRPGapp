export type CharacterType = 'AD' | 'AP';
export type CharacterClass = 'Marksman' | 'Fighter' | 'Tank' | 'Mage' | 'Assassin';

export type SkillType = '絶対成功' | '範囲攻撃' | '妨害';

export interface CustomSkill {
  id: string;
  name: string;
  type: SkillType;
}

// ✅ 追加: attack, dodge, hp を定義
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
