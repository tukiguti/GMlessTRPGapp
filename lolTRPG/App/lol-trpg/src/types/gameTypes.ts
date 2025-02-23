// src/types/gameTypes.ts

export type GamePhase = 'LANE' | 'TEAM_FIGHT';
export type LaneAction = 'FARM' | 'ATTACK' | 'RECALL';
export type TeamFightAction = 'SIDE_PUSH' | 'ATTACK' | 'RECALL';
export type GameAction = LaneAction | TeamFightAction;

export interface PlayerAction {
    playerId: string;
    action: GameAction | null;
    targetId?: string | null;
}

export interface GameState {
    phase: GamePhase;
    round: number;
    currentTeam: string;
    currentPlayer: string;
    blueTower: number;
    redTower: number;
}

export interface ActionDescription {
    value: GameAction;
    label: string;
    description: string;
}

// アクションの説明を定数として定義
export const LANE_ACTIONS: ActionDescription[] = [
    {
        value: 'FARM',
        label: 'ファーム',
        description: 'ファームポイントを5獲得、回避判定に-3のペナルティ'
    },
    {
        value: 'ATTACK',
        label: 'アタック',
        description: 'プレイヤーに攻撃、成功時ファームポイント2獲得'
    },
    {
        value: 'RECALL',
        label: 'リコール',
        description: 'ファームポイントを使用してアイテムを購入'
    }
];

export const TEAM_FIGHT_ACTIONS: ActionDescription[] = [
    {
        value: 'SIDE_PUSH',
        label: 'サイドプッシュ',
        description: 'タワーに3ダメージ、回避判定に-4のペナルティ'
    },
    {
        value: 'ATTACK',
        label: 'アタック',
        description: 'プレイヤーに攻撃、タワーに1ダメージ'
    },
    {
        value: 'RECALL',
        label: 'リコール',
        description: 'アイテムの購入（1回のみ）'
    }
];