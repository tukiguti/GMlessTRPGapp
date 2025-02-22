// src/types/index.ts

export type CharacterType = 'AD' | 'AP';
export type CharacterClass = 'Marksman' | 'Fighter' | 'Tank' | 'Mage' | 'Assassin';

export interface CharacterStats {
    attack: string;
    dodge: string;
    hp: number;
    maxHp: number;
}

export interface CustomSkill {
    id: string;
    originalType: 'PERFECT_SUCCESS' | 'FORCE_ONE' | 'AOE' | 'INTERFERENCE';
    customName: string;
    customDescription: string;
    usageCount: number;
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
    stats: CharacterStats;
    hp: number;
    maxHp: number;
    farmPoints: number;
    items: string[];
    skills: string[];
    isDead: boolean;
    background?: string;
    appearance?: string;
}

export const CHARACTER_BASE_STATS: Record<CharacterClass, CharacterStats> = {
    Marksman: {
        attack: "3d6",
        dodge: "1d6",
        hp: 2,
        maxHp: 2
    },
    Fighter: {
        attack: "1d6+4",
        dodge: "1d6+4",
        hp: 4,
        maxHp: 4
    },
    Tank: {
        attack: "1d6",
        dodge: "1d6",
        hp: 5,
        maxHp: 5
    },
    Mage: {
        attack: "2d6",
        dodge: "1d6+4",
        hp: 3,
        maxHp: 3
    },
    Assassin: {
        attack: "2d3+3",
        dodge: "2d6+3",
        hp: 2,
        maxHp: 2
    }
};