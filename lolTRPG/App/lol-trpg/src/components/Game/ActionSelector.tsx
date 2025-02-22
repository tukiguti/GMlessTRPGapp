// src/components/Game/ActionSelector.tsx

import React from 'react';
import { GamePhase } from './GameContainer';

export type LaneAction = 'FARM' | 'ATTACK' | 'RECALL';
export type TeamFightAction = 'SIDE_PUSH' | 'ATTACK' | 'RECALL';
export type GameAction = LaneAction | TeamFightAction;

interface ActionSelectorProps {
    phase: GamePhase;
    onActionSelect: (action: GameAction) => void;
    disabled?: boolean;
}

export const ActionSelector: React.FC<ActionSelectorProps> = ({
    phase,
    onActionSelect,
    disabled = false
}) => {
    const renderActionButton = (action: GameAction, label: string, description: string) => (
        <button
            className={`action-button p-4 rounded-lg shadow-md w-full
                ${disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-50 transition-colors'}
                mb-4`}
            onClick={() => !disabled && onActionSelect(action)}
            disabled={disabled}
        >
            <h3 className="text-lg font-bold mb-2">{label}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </button>
    );

    return (
        <div className="action-selector grid grid-cols-1 gap-4">
            {phase === 'LANE' ? (
                <>
                    {renderActionButton('FARM', 'ファーム', 
                        'ファームポイントを5獲得。回避判定に-3のペナルティ')}
                    {renderActionButton('ATTACK', 'アタック', 
                        'プレイヤーに攻撃。成功時ファームポイント2獲得')}
                    {renderActionButton('RECALL', 'リコール', 
                        'ファームポイントを使用してアイテムを購入')}
                </>
            ) : (
                <>
                    {renderActionButton('SIDE_PUSH', 'サイドプッシュ', 
                        'タワーに3ダメージ。回避判定に-4のペナルティ。相手と重複すると失敗')}
                    {renderActionButton('ATTACK', 'アタック', 
                        'プレイヤーに攻撃。タワーに1ダメージ')}
                    {renderActionButton('RECALL', 'リコール', 
                        'アイテムの購入（1回のみ）')}
                </>
            )}
        </div>
    );
};