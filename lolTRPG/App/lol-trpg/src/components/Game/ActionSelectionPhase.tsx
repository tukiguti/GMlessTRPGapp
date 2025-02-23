// src/components/Game/ActionSelectionPhase.tsx

import React, { useState } from 'react';
import { CustomCharacter } from '../../types';
import { GamePhase, GameAction, PlayerAction } from '../../types/gameTypes';

interface ActionSelectionPhaseProps {
    phase: GamePhase;
    blueTeam: CustomCharacter[];
    redTeam: CustomCharacter[];
    onActionsConfirmed: (actions: Record<string, PlayerAction>) => void;
}

export const ActionSelectionPhase: React.FC<ActionSelectionPhaseProps> = ({
    phase,
    blueTeam,
    redTeam,
    onActionsConfirmed
}) => {
    // 初期状態の設定
    const initialPlayerActions = (team: CustomCharacter[]): PlayerAction[] => {
        return team.map(player => ({
            playerId: player.id,
            action: null,
            targetId: null
        }));
    };

    const [blueActions, setBlueActions] = useState<PlayerAction[]>(initialPlayerActions(blueTeam));
    const [redActions, setRedActions] = useState<PlayerAction[]>(initialPlayerActions(redTeam));

    const handleActionSelect = (team: 'blue' | 'red', playerIndex: number, action: GameAction) => {
        if (team === 'blue') {
            const newActions = [...blueActions];
            newActions[playerIndex] = {
                ...newActions[playerIndex],
                action
            };
            setBlueActions(newActions);
        } else {
            const newActions = [...redActions];
            newActions[playerIndex] = {
                ...newActions[playerIndex],
                action
            };
            setRedActions(newActions);
        }
    };

    const handleTargetSelect = (team: 'blue' | 'red', playerIndex: number, targetId: string) => {
        if (team === 'blue') {
            const newActions = [...blueActions];
            newActions[playerIndex] = {
                ...newActions[playerIndex],
                targetId
            };
            setBlueActions(newActions);
        } else {
            const newActions = [...redActions];
            newActions[playerIndex] = {
                ...newActions[playerIndex],
                targetId
            };
            setRedActions(newActions);
        }
    };

    const renderPlayerActions = (team: 'blue' | 'red', actions: PlayerAction[], teamPlayers: CustomCharacter[], opposingTeam: CustomCharacter[]) => (
        <div className={`${team === 'blue' ? 'bg-blue-50' : 'bg-red-50'} p-4 rounded-lg`}>
            <h3 className="text-xl font-bold mb-4">{team === 'blue' ? 'Blue Team' : 'Red Team'}</h3>
            {teamPlayers.map((player, index) => {
                const playerAction = actions[index];
                return (
                    <div key={player.id} className="mb-4 p-4 bg-white rounded-lg shadow">
                        <h4 className="font-bold">{player.name}</h4>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {phase === 'LANE' ? (
                                <>
                                    <button 
                                        className={`px-4 py-2 rounded ${
                                            playerAction.action === 'FARM' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                                        }`}
                                        onClick={() => handleActionSelect(team, index, 'FARM')}
                                    >
                                        ファーム
                                    </button>
                                    <button 
                                        className={`px-4 py-2 rounded ${
                                            playerAction.action === 'ATTACK' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                                        }`}
                                        onClick={() => handleActionSelect(team, index, 'ATTACK')}
                                    >
                                        アタック
                                    </button>
                                    <button 
                                        className={`px-4 py-2 rounded ${
                                            playerAction.action === 'RECALL' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                                        }`}
                                        onClick={() => handleActionSelect(team, index, 'RECALL')}
                                    >
                                        リコール
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        className={`px-4 py-2 rounded ${
                                            playerAction.action === 'SIDE_PUSH' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                                        }`}
                                        onClick={() => handleActionSelect(team, index, 'SIDE_PUSH')}
                                    >
                                        サイドプッシュ
                                    </button>
                                    <button 
                                        className={`px-4 py-2 rounded ${
                                            playerAction.action === 'ATTACK' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                                        }`}
                                        onClick={() => handleActionSelect(team, index, 'ATTACK')}
                                    >
                                        アタック
                                    </button>
                                    <button 
                                        className={`px-4 py-2 rounded ${
                                            playerAction.action === 'RECALL' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                                        }`}
                                        onClick={() => handleActionSelect(team, index, 'RECALL')}
                                    >
                                        リコール
                                    </button>
                                </>
                            )}
                        </div>

                        {playerAction.action === 'ATTACK' && (
                            <select
                                className="w-full p-2 border rounded mt-2"
                                value={playerAction.targetId || ''}
                                onChange={(e) => handleTargetSelect(team, index, e.target.value)}
                            >
                                <option value="">対象を選択</option>
                                {opposingTeam.map(target => (
                                    <option key={target.id} value={target.id}>
                                        {target.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const isAllActionsSelected = () => {
        const allActions = [...blueActions, ...redActions];
        return allActions.every(action => {
            if (!action.action) return false;
            if (action.action === 'ATTACK' && !action.targetId) return false;
            return true;
        });
    };

    const handleConfirm = () => {
        const actions: Record<string, PlayerAction> = {};
        [...blueActions, ...redActions].forEach(action => {
            actions[action.playerId] = action;
        });
        onActionsConfirmed(actions);
    };

    return (
        <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
                {renderPlayerActions('blue', blueActions, blueTeam, redTeam)}
                {renderPlayerActions('red', redActions, redTeam, blueTeam)}
            </div>
            <div className="mt-4 flex justify-center">
                <button
                    className={`px-6 py-3 rounded-lg ${
                        isAllActionsSelected() 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-gray-300 cursor-not-allowed'
                    }`}
                    disabled={!isAllActionsSelected()}
                    onClick={handleConfirm}
                >
                    行動を確定して実行
                </button>
            </div>
        </div>
    );
};