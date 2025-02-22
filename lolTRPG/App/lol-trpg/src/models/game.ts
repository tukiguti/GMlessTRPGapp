// models/game.ts

export type GamePhase = 'LANE' | 'TEAM_FIGHT';
export type ActionType = 'FARM' | 'ATTACK' | 'RECALL' | 'SIDE_PUSH';

export interface GameState {
    phase: GamePhase;
    round: number;
    maxRounds: {
        lane: number;    // レーン戦フェーズのラウンド数
        teamFight: number;  // 集団戦フェーズのラウンド数
    };
    teams: {
        blue: string[];  // プレイヤーID配列
        red: string[];   // プレイヤーID配列
    };
    towers: {
        blue: number;    // タワーの残りHP
        red: number;     // タワーの残りHP
    };
    currentTurn: {
        teamId: 'blue' | 'red';
        playerId: string;
    };
    winners?: 'blue' | 'red';
}

export interface Action {
    type: ActionType;
    source: string;      // 行動を起こすプレイヤーのID
    target?: string;     // 攻撃対象のプレイヤーID（必要な場合）
    skill?: string;      // 使用するスキルID（必要な場合）
}

export interface ActionResult {
    success: boolean;
    damage?: number;
    farmPointsGained?: number;
    diceRolls?: {
        attack?: number[];
        defense?: number[];
    };
    message: string;
}

// アイテムの定義
export interface Item {
    id: string;
    name: string;
    type: 'BOOTS' | 'BOW' | 'HAMMER' | 'ARMOR' | 'SWORD';
    cost: number;
    effects: {
        dodge?: number;
        attack?: number;
        towerDamage?: number;
        hp?: number;
        damage?: number;
    };
}

// スキルの定義
export interface Skill {
    id: string;
    name: string;
    type: 'PERFECT_SUCCESS' | 'FORCE_ONE' | 'AOE' | 'INTERFERENCE';
    description: string;
    usageCount: number;
    failureCheck?: {
        dice: string;    // 例: "1d6"
        threshold: number;
        penalty?: number;
    };
}

export const INITIAL_TOWER_HP = 5;
export const TOWER_VICTORY_CONDITION = 3; // タワーを3回破壊で勝利