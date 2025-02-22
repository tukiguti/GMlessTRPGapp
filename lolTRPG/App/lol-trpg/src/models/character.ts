// models/character.ts

export type CharacterType = 'AD' | 'AP';
export type CharacterClass = 'Marksman' | 'Fighter' | 'Tank' | 'Mage' | 'Assassin';

export interface CharacterStats {
    attack: string;     // ダイス表記 (例: "3d6")
    dodge: string;      // ダイス表記
    hp: number;
    maxHp: number;
}

export interface Character {
    id: string;
    name: string;
    type: CharacterType;
    class: CharacterClass;
    stats: CharacterStats;
    farmPoints: number;
    items: string[];    // アイテムID配列
    skills: string[];   // スキルID配列
    isDead: boolean;
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