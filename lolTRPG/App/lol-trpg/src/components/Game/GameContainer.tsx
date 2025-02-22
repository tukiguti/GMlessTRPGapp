// src/components/Game/GameContainer.tsx

import React, { useState, useEffect } from 'react';
import { CustomCharacter } from '../../types';
import { ActionSelector, GameAction } from './ActionSelector';

interface GameContainerProps {
    initialTeamSize: number;
    blueTeam: CustomCharacter[];
    redTeam: CustomCharacter[];
}

export type GamePhase = 'LANE' | 'TEAM_FIGHT';
export type TurnPhase = 'BLUE_TEAM' | 'RED_TEAM';

interface GameState {
    phase: GamePhase;
    currentRound: number;
    maxRounds: {
        lane: number;
        teamFight: number;
    };
    currentTurn: {
        team: TurnPhase;
        playerIndex: number;
    };
    towers: {
        blue: number;
        red: number;
    };
}

export const GameContainer: React.FC<GameContainerProps> = ({
    initialTeamSize,
    blueTeam,
    redTeam
}) => {
    // ゲームの状態管理
    const [gameState, setGameState] = useState<GameState>({
        phase: 'LANE',
        currentRound: 1,
        maxRounds: {
            lane: 4,
            teamFight: Math.ceil(initialTeamSize * 2.5) // チームサイズに応じて集団戦のラウンド数を決定
        },
        currentTurn: {
            team: 'BLUE_TEAM',
            playerIndex: 0
        },
        towers: {
            blue: 5,
            red: 5
        }
    });

    // アクション結果の状態管理
    const [actionResult, setActionResult] = useState<string | null>(null);

    // フェーズ切り替えの処理
    const switchPhase = () => {
        if (gameState.phase === 'LANE' && gameState.currentRound >= gameState.maxRounds.lane) {
            setGameState(prev => ({
                ...prev,
                phase: 'TEAM_FIGHT',
                currentRound: 1
            }));
        }
    };

    // ターン進行の処理
    const nextTurn = () => {
        setGameState(prev => {
            const newState = { ...prev };
            
            if (prev.currentTurn.team === 'BLUE_TEAM') {
                if (prev.currentTurn.playerIndex >= blueTeam.length - 1) {
                    // 青チームの最後のプレイヤーなら赤チームの最初のプレイヤーへ
                    newState.currentTurn = {
                        team: 'RED_TEAM',
                        playerIndex: 0
                    };
                } else {
                    // 次の青チームプレイヤーへ
                    newState.currentTurn.playerIndex++;
                }
            } else {
                if (prev.currentTurn.playerIndex >= redTeam.length - 1) {
                    // 赤チームの最後のプレイヤーなら次のラウンドへ
                    newState.currentRound++;
                    newState.currentTurn = {
                        team: 'BLUE_TEAM',
                        playerIndex: 0
                    };
                } else {
                    // 次の赤チームプレイヤーへ
                    newState.currentTurn.playerIndex++;
                }
            }

            return newState;
        });
    };

    // アクション実行の処理
    const handleAction = (action: GameAction) => {
        console.log(`Selected action: ${action}`); // デバッグログ
        
        // TODO: アクションの実装
        switch (action) {
            case 'FARM':
                setActionResult('ファームを実行しました。（実装予定）');
                break;
            case 'ATTACK':
                setActionResult('攻撃を実行しました。（実装予定）');
                break;
            case 'RECALL':
                setActionResult('リコールを実行しました。（実装予定）');
                break;
            case 'SIDE_PUSH':
                setActionResult('サイドプッシュを実行しました。（実装予定）');
                break;
        }

        // アクション実行後に次のターンへ
        nextTurn();
    };

    // 現在のターンのプレイヤーを取得
    const getCurrentPlayer = () => {
        const team = gameState.currentTurn.team === 'BLUE_TEAM' ? blueTeam : redTeam;
        return team[gameState.currentTurn.playerIndex];
    };

    // ラウンド変更時の処理
    useEffect(() => {
        switchPhase();
    }, [gameState.currentRound]);

    return (
        <div className="game-container p-4">
            {/* ゲーム状況の表示 */}
            <div className="game-status bg-white rounded-lg p-4 shadow mb-4">
                <h2 className="text-xl font-bold mb-2">ゲーム状況</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="mb-2">フェーズ: {gameState.phase === 'LANE' ? 'レーン戦' : '集団戦'}</p>
                        <p className="mb-2">ラウンド: {gameState.currentRound}</p>
                        <p className="mb-2">現在のターン: {gameState.currentTurn.team === 'BLUE_TEAM' ? '青チーム' : '赤チーム'}</p>
                        <p className="mb-2">プレイヤー: {getCurrentPlayer()?.name}</p>
                    </div>
                    <div>
                        <p className="mb-2">青チームタワー: {gameState.towers.blue}</p>
                        <p className="mb-2">赤チームタワー: {gameState.towers.red}</p>
                    </div>
                </div>
            </div>

            {/* アクション選択エリア */}
            <div className="action-area bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4">行動選択</h3>
                <ActionSelector
                    phase={gameState.phase}
                    onActionSelect={handleAction}
                />
            </div>

            {/* アクション結果の表示 */}
            {actionResult && (
                <div className="action-result mt-4 p-4 bg-blue-100 rounded-lg">
                    <p>{actionResult}</p>
                </div>
            )}
        </div>
    );
};