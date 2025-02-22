// models/characterCreator.ts
import { CharacterType, CharacterClass } from './character';

export interface CustomSkill {
    id: string;
    originalType: 'PERFECT_SUCCESS' | 'FORCE_ONE' | 'AOE' | 'INTERFERENCE';
    customName: string;
    customDescription: string;
    usageCount: number;
    failureCheck?: {
        dice: string;
        threshold: number;
        penalty?: number;
    };
}

export interface CustomItem {
    id: string;
    originalType: 'BOOTS' | 'BOW' | 'HAMMER' | 'ARMOR' | 'SWORD';
    customName: string;
    customDescription: string;
    cost: number;
    effects: {
        dodge?: number;
        attack?: number;
        towerDamage?: number;
        hp?: number;
        damage?: number;
    };
}

export interface CustomCharacter {
    id: string;
    name: string;
    type: CharacterType;
    class: CharacterClass;
    customSkills: CustomSkill[];
    background?: string;  // キャラクター設定
    appearance?: string;  // 外見描写
}

export interface CharacterTemplate {
    id: string;
    name: string;
    type: CharacterType;
    class: CharacterClass;
    defaultSkills: string[];  // デフォルトのスキルID
}