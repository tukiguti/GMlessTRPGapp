// src/components/Game/GameBattleLayout.tsx

import React, { useState } from 'react';
import { CustomCharacter } from '../../types';
import { GamePhase, GameAction, PlayerAction } from '../../types/gameTypes';

interface GameBattleLayoutProps {
    phase: GamePhase;
    blueTeam: CustomCharacter[];
    redTeam: CustomCharacter[];
    onActionsConfirmed: (actions: Record<string, PlayerAction>) => void;
}

export const GameBattleLayout: React.FC<GameBattleLayoutProps> = ({
    phase,
    blueTeam,
    redTeam,
    onActionsConfirmed
}) => {
    const [playerActions, setPlayerActions] = useState<Record<string, PlayerAction>>({});

    const getAvailableActions = (currentPhase: GamePhase): { value: GameAction; label: string }[] => {
        if (currentPhase === 'LANE') {
            return [
                { value: 'FARM', label: 'ファーム' },
                { value: 'ATTACK', label: 'アタック' },
                { value: 'RECALL', label: 'リコール' }
            ];
        }
        return [
            { value: 'SIDE_PUSH', label: 'サイドプッシュ' },
            { value: 'ATTACK', label: 'アタック' },
            { value: 'RECALL', label: 'リコール' }
        ];
    };

    const renderTeamTable = (team: CustomCharacter[], isBlueTeam: boolean) => (
        <div style={{ width: '45%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '8px', textAlign: 'left' }}>PL</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>HP FP</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>アクション</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>対象</th>
                    </tr>
                </thead>
                <tbody>
                    {team.map(player => (
                        <tr key={player.id} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '8px' }}>{player.name}</td>
                            <td style={{ padding: '8px' }}>{player.hp}/{player.maxHp} {player.farmPoints}</td>
                            <td style={{ padding: '8px' }}>
                                <select
                                    style={{
                                        width: '100%',
                                        padding: '4px'
                                    }}
                                    value={playerActions[player.id]?.action || ''}
                                    onChange={(e) => {
                                        const action = e.target.value as GameAction;
                                        setPlayerActions(prev => ({
                                            ...prev,
                                            [player.id]: {
                                                playerId: player.id,
                                                action,
                                                targetId: null
                                            }
                                        }));
                                    }}
                                >
                                    <option value="">選択</option>
                                    {getAvailableActions(phase).map(action => (
                                        <option key={action.value} value={action.value}>
                                            {action.label}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td style={{ padding: '8px' }}>
                                {playerActions[player.id]?.action === 'ATTACK' && (
                                    <select
                                        style={{
                                            width: '100%',
                                            padding: '4px'
                                        }}
                                        value={playerActions[player.id]?.targetId || ''}
                                        onChange={(e) => {
                                            setPlayerActions(prev => ({
                                                ...prev,
                                                [player.id]: {
                                                    ...prev[player.id],
                                                    targetId: e.target.value
                                                }
                                            }));
                                        }}
                                    >
                                        <option value="">選択</option>
                                        {(isBlueTeam ? redTeam : blueTeam).map(target => (
                                            <option key={target.id} value={target.id}>
                                                {target.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '20px',
                margin: '20px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h3>青チーム残りタワー: 5</h3>
                    {renderTeamTable(blueTeam, true)}
                </div>

                <div style={{ textAlign: 'center' }}>
                    <h3>赤チーム残りタワー: 5</h3>
                    {renderTeamTable(redTeam, false)}
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                    onClick={() => onActionsConfirmed(playerActions)}
                >
                    行動を確定
                </button>
            </div>
        </div>
    );
};