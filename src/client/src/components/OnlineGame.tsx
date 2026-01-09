import React, { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import WebSocketService from '../services/websocket';

interface OnlineGameProps {
    gameId: string;
    onBack: () => void;
}

export const OnlineGame: React.FC<OnlineGameProps> = ({ gameId, onBack }) => {
    const {
        round,
        phase,
        status,
        teams,
        playerId,
        selectedCharacterId,
        syncWithServer
    } = useGameStore();

    const [movementTarget, setMovementTarget] = useState<string | null>(null);
    const [actionType, setActionType] = useState<'attack' | 'farm' | 'wait' | 'skill' | null>(null);
    const [actionTarget, setActionTarget] = useState<string | null>(null);

    useEffect(() => {
        const ws = WebSocketService.getInstance();

        // ゲーム参加
        if (playerId) {
            ws.joinGame(gameId, playerId);
        }

        // イベントリスナー設定
        ws.onGameJoined((state) => {
            syncWithServer(state);
        });

        ws.onRoundResolved((data) => {
            syncWithServer(data.state);
        });

        return () => {
            ws.leaveGame(gameId);
            ws.off('game_joined');
            ws.off('round_resolved');
        };
    }, [gameId, playerId, syncWithServer]);

    const handleSubmitAction = () => {
        if (!selectedCharacterId) return;

        const ws = WebSocketService.getInstance();
        const action = {
            playerId: playerId || 'unknown',
            characterId: selectedCharacterId,
            round,
            moveDestination: movementTarget, // null means stay
            actionType: actionType || 'wait',
            actionTarget: actionTarget || undefined
        };

        ws.submitAction(gameId, action as any);

        // Reset local selection
        setMovementTarget(null);
        setActionType(null);
        setActionTarget(null);
    };

    // 自分のキャラクターを取得
    const myCharacter = [...teams.blue, ...teams.red].find(c => c.id === selectedCharacterId);

    // 敵チームのキャラクターを取得（ターゲット用）
    const enemyTeam = teams.blue.some(c => c.id === selectedCharacterId) ? teams.red : teams.blue;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="mb-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">オンラインゲーム (ID: {gameId})</h1>
                <button onClick={onBack} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                    退出
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 左カラム: ゲーム情報 & 自分 */}
                <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded">
                        <h2 className="font-bold mb-2">ゲーム状況</h2>
                        <div>ラウンド: {round}</div>
                        <div>フェーズ: {phase}</div>
                        <div>ステータス: {status}</div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded">
                        <h2 className="font-bold mb-2">自分のキャラクター</h2>
                        {myCharacter ? (
                            <div>
                                <div className="text-xl font-bold">{myCharacter.name}</div>
                                <div>HP: {myCharacter.hp} / {myCharacter.maxHp}</div>
                                <div>Gold: {myCharacter.gold}</div>
                                <div>Position: {myCharacter.position.lane}</div>
                            </div>
                        ) : (
                            <div className="text-gray-400">キャラクターを選択してください</div>
                        )}
                    </div>
                </div>

                {/* 中央カラム: アクションパネル */}
                <div className="bg-gray-800 p-4 rounded">
                    <h2 className="font-bold mb-4">アクション選択</h2>

                    {phase === 'declaration' ? (
                        <div className="space-y-4">
                            {/* 移動選択 */}
                            <div>
                                <label className="block mb-2 font-bold">移動</label>
                                <select
                                    className="w-full bg-gray-700 p-2 rounded"
                                    value={movementTarget || ''}
                                    onChange={(e) => setMovementTarget(e.target.value || null)}
                                >
                                    <option value="">現在位置に留まる</option>
                                    <option value="TOP">Top Lane</option>
                                    <option value="MID">Mid Lane</option>
                                    <option value="BOT">Bot Lane</option>
                                    <option value="RECALL">リコール</option>
                                </select>
                            </div>

                            {/* 行動選択 */}
                            <div>
                                <label className="block mb-2 font-bold">行動</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        className={`p-2 rounded ${actionType === 'attack' ? 'bg-red-600' : 'bg-gray-700'}`}
                                        onClick={() => setActionType('attack')}
                                    >
                                        攻撃
                                    </button>
                                    <button
                                        className={`p-2 rounded ${actionType === 'farm' ? 'bg-green-600' : 'bg-gray-700'}`}
                                        onClick={() => setActionType('farm')}
                                    >
                                        ファーム
                                    </button>
                                    <button
                                        className={`p-2 rounded ${actionType === 'wait' ? 'bg-gray-600' : 'bg-gray-700'}`}
                                        onClick={() => setActionType('wait')}
                                    >
                                        待機
                                    </button>
                                    <button
                                        className={`p-2 rounded ${actionType === 'skill' ? 'bg-yellow-600' : 'bg-gray-700'}`}
                                        onClick={() => setActionType('skill')}
                                    >
                                        スキル
                                    </button>
                                </div>
                            </div>

                            {/* ターゲット選択 (攻撃時) */}
                            {actionType === 'attack' && (
                                <div>
                                    <label className="block mb-2 font-bold">ターゲット</label>
                                    <select
                                        className="w-full bg-gray-700 p-2 rounded"
                                        value={actionTarget || ''}
                                        onChange={(e) => setActionTarget(e.target.value)}
                                    >
                                        <option value="">選択してください</option>
                                        {enemyTeam.map(enemy => (
                                            <option key={enemy.id} value={enemy.id}>
                                                {enemy.name} ({enemy.hp}/{enemy.maxHp})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                className="w-full bg-blue-600 p-3 rounded font-bold hover:bg-blue-500 mt-4"
                                onClick={handleSubmitAction}
                                disabled={!myCharacter}
                            >
                                アクション送信
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            解決フェーズ中... 結果を待っています
                        </div>
                    )}
                </div>

                {/* 右カラム: チーム情報 */}
                <div className="space-y-4">
                    <div className="bg-blue-900/30 p-4 rounded border border-blue-800">
                        <h3 className="font-bold text-blue-400 mb-2">Blue Team</h3>
                        {teams.blue.map(char => (
                            <div key={char.id} className="text-sm mb-1">
                                {char.name} (HP: {char.hp})
                            </div>
                        ))}
                    </div>

                    <div className="bg-red-900/30 p-4 rounded border border-red-800">
                        <h3 className="font-bold text-red-400 mb-2">Red Team</h3>
                        {teams.red.map(char => (
                            <div key={char.id} className="text-sm mb-1">
                                {char.name} (HP: {char.hp})
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
