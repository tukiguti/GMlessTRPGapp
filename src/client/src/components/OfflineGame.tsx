/**
 * オフラインゲーム（CPU戦）
 * サーバーを使わずローカルで動作
 * 2段階宣言フェーズ: 移動宣言 → 行動宣言 → 解決
 */

import { useState, useEffect } from 'react';
import { OfflineGameEngine } from '../game/engine/OfflineGameEngine';
import type { PlayerAction } from '../types/offlineGame';

interface OfflineGameProps {
  onBack: () => void;
}

type DeclarationPhase = 'movement' | 'action';

export const OfflineGame: React.FC<OfflineGameProps> = ({ onBack }) => {
  const [gameEngine] = useState(() => new OfflineGameEngine());
  const [gameState, setGameState] = useState(gameEngine.getGameState());
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<DeclarationPhase>('movement');

  // 移動宣言用の状態
  const [selectedMovement, setSelectedMovement] = useState<string | null>(null);

  // 行動宣言用の状態
  const [selectedAction, setSelectedAction] = useState<PlayerAction['actionType'] | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  // ========================================
  // ゲーム初期化
  // ========================================
  useEffect(() => {
    if (!gameStarted) {
      // プレイヤーキャラクター（5体すべて）を作成
      const playerChars = [
        gameEngine.createCharacter('player-1', 'tank', 'top', 'blue', 'Player Tank'),
        gameEngine.createCharacter('player-2', 'fighter', 'mid', 'blue', 'Player Fighter'), // ジャングラーは一旦midから
        gameEngine.createCharacter('player-3', 'mage', 'mid', 'blue', 'Player Mage'),
        gameEngine.createCharacter('player-4', 'marksman', 'bot', 'blue', 'Player Marksman'),
        gameEngine.createCharacter('player-5', 'support', 'bot', 'blue', 'Player Support'),
      ];

      // CPUキャラクター（5体）を作成
      const cpuChars = [
        gameEngine.createCharacter('cpu-1', 'tank', 'top', 'red', 'CPU Tank'),
        gameEngine.createCharacter('cpu-2', 'fighter', 'mid', 'red', 'CPU Fighter'), // ジャングラーは一旦midから
        gameEngine.createCharacter('cpu-3', 'mage', 'mid', 'red', 'CPU Mage'),
        gameEngine.createCharacter('cpu-4', 'marksman', 'bot', 'red', 'CPU Marksman'),
        gameEngine.createCharacter('cpu-5', 'support', 'bot', 'red', 'CPU Support'),
      ];

      gameEngine.startGame(playerChars, cpuChars);
      setGameState(gameEngine.getGameState());
      setGameStarted(true);
      // 最初のキャラクターを自動選択
      setSelectedCharacterId(playerChars[0].id);
    }
  }, [gameEngine, gameStarted]);

  // ========================================
  // 移動宣言を送信
  // ========================================
  const handleDeclareMovement = () => {
    if (!selectedCharacterId) return;

    // selectedMovement が null の場合は現在位置に留まる
    gameEngine.declareMovement(selectedCharacterId, selectedMovement);
    const updatedState = gameEngine.getGameState();
    setGameState(updatedState);
    setSelectedMovement(null);

    // 行動宣言フェーズに移行
    setCurrentPhase('action');
  };

  // ========================================
  // 行動宣言を送信
  // ========================================
  const handleDeclareAction = () => {
    if (!selectedAction || !selectedCharacterId) return;

    gameEngine.declareAction(selectedCharacterId, selectedAction, selectedTarget || undefined);
    const updatedState = gameEngine.getGameState();
    setGameState(updatedState);
    setSelectedAction(null);
    setSelectedTarget(null);

    // 次の未宣言キャラクターを自動選択
    const updatedChars = updatedState.characters.filter((c) => c.team === 'blue' && c.isAlive);
    const nextUndeclared = updatedChars.find(
      (c) => !c.isDeclared && c.id !== selectedCharacterId
    );
    if (nextUndeclared) {
      setSelectedCharacterId(nextUndeclared.id);
      setCurrentPhase('movement'); // 次のキャラクターの移動宣言から開始
    } else {
      setCurrentPhase('movement'); // 全員完了したら次ラウンドに備えてリセット
    }
  };

  // ========================================
  // ラウンドを進める
  // ========================================
  const handleNextRound = async () => {
    const newState = await gameEngine.resolveRound();
    setGameState(newState);
    setCurrentPhase('movement');
    // 最初の生存キャラクターを選択
    const firstAlive = newState.characters.find((c) => c.team === 'blue' && c.isAlive);
    if (firstAlive) {
      setSelectedCharacterId(firstAlive.id);
    }
  };

  // ========================================
  // エリア一覧を取得（ベースを除く - リコールでのみアクセス可能）
  // ========================================
  const getAreaOptions = (): { id: string; name: string }[] => {
    return [
      // レーン（チーム共通）
      { id: 'TOP_LANE', name: 'Top Lane' },
      { id: 'MID_LANE', name: 'Mid Lane' },
      { id: 'BOT_LANE', name: 'Bot Lane' },
      // ジャングルエリア（ブルー側）
      { id: 'BLUE_TOP_MID_JUNGLE', name: 'Blue Top-Mid Jungle' },
      { id: 'BLUE_MID_BOT_JUNGLE', name: 'Blue Mid-Bot Jungle' },
      // ジャングルエリア（レッド側）
      { id: 'RED_TOP_MID_JUNGLE', name: 'Red Top-Mid Jungle' },
      { id: 'RED_MID_BOT_JUNGLE', name: 'Red Mid-Bot Jungle' },
      // 中立エリア
      { id: 'BARON_PIT', name: 'Baron Pit' },
      { id: 'DRAGON_PIT', name: 'Dragon Pit' },
      // 注: ベース（BLUE_BASE, RED_BASE）はリコールでのみアクセス可能
    ];
  };

  // ========================================
  // 攻撃ターゲット一覧を取得
  // ========================================
  const getAttackTargets = (): { id: string; name: string }[] => {
    return gameState.characters
      .filter((c) => c.team === 'red' && c.isAlive)
      .map((c) => ({ id: c.id, name: `${c.playerName} (${c.position})` }));
  };

  // ========================================
  // レンダリング
  // ========================================
  const selectedChar = gameState.characters.find((c) => c.id === selectedCharacterId);
  const movementDeclaredCount = gameState.characters.filter(
    (c) => c.team === 'blue' && c.hasMovementDeclaration
  ).length;
  const actionDeclaredCount = gameState.characters.filter(
    (c) => c.team === 'blue' && c.hasActionDeclaration
  ).length;
  const allDeclared = gameState.characters
    .filter((c) => c.team === 'blue' && c.isAlive)
    .every((c) => c.isDeclared);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* ヘッダー */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">オフラインゲーム（CPU戦）</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
        >
          メニューに戻る
        </button>
      </div>

      {/* ゲーム状態 */}
      <div className="mb-4 p-4 bg-gray-800 rounded">
        <div className="grid grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-gray-400">ラウンド:</span>{' '}
            <span className="font-bold">{gameState.round}</span>
          </div>
          <div>
            <span className="text-gray-400">フェーズ:</span>{' '}
            <span className="font-bold">{gameState.phase}</span>
          </div>
          <div>
            <span className="text-gray-400">ステータス:</span>{' '}
            <span className="font-bold">{gameState.status}</span>
          </div>
          <div>
            <span className="text-gray-400">移動宣言:</span>{' '}
            <span className="font-bold text-blue-400">{movementDeclaredCount}/5</span>
          </div>
          <div>
            <span className="text-gray-400">行動宣言:</span>{' '}
            <span className="font-bold text-green-400">{actionDeclaredCount}/5</span>
          </div>
        </div>
      </div>

      {/* プレイヤーキャラクター選択 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2 text-blue-400">
          あなたのキャラクター（操作するキャラクターを選択）
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {gameState.characters
            .filter((c) => c.team === 'blue')
            .map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacterId(char.id)}
                className={`p-3 rounded border-2 transition-all ${
                  selectedCharacterId === char.id
                    ? 'bg-blue-700 border-blue-400 shadow-lg'
                    : char.isDeclared
                    ? 'bg-green-900 border-green-600'
                    : char.hasMovementDeclaration
                    ? 'bg-blue-900 border-blue-600'
                    : 'bg-gray-800 border-gray-600 hover:border-blue-500'
                }`}
              >
                <div className="text-sm font-bold">{char.playerName}</div>
                <div className="text-xs">Lv.{char.level}</div>
                <div className="text-xs">
                  HP: {char.currentHp}/{char.maxHp}
                </div>
                {char.isDeclared && <div className="text-xs text-green-400 mt-1">✓ 完了</div>}
                {!char.isDeclared && char.hasMovementDeclaration && (
                  <div className="text-xs text-blue-400 mt-1">→ 移動済</div>
                )}
              </button>
            ))}
        </div>
      </div>

      {/* 選択中のキャラクター詳細 */}
      {selectedChar && (
        <div className="mb-4 p-4 bg-blue-900 rounded border-2 border-blue-400">
          <h2 className="text-xl font-bold mb-2">{selectedChar.playerName} の詳細</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>レベル: {selectedChar.level}</div>
            <div>ゴールド: {selectedChar.gold}G</div>
            <div>
              HP: {selectedChar.currentHp} / {selectedChar.maxHp}
            </div>
            <div>ポジション: {selectedChar.position}</div>
            <div>攻撃力: {selectedChar.finalStats.attack}</div>
            <div>防御力: {selectedChar.finalStats.defense}</div>
            <div>移動力: {selectedChar.finalStats.mobility}</div>
            <div>ユーティリティ: {selectedChar.finalStats.utility}</div>
          </div>
          {selectedChar.lastAction && (
            <div className="mt-2 p-2 bg-gray-800 rounded">
              <div className="text-sm">
                {selectedChar.hasMovementDeclaration && (
                  <div className="text-blue-300">
                    ✓ 移動宣言:{' '}
                    {selectedChar.lastAction.moveDestination === null
                      ? '現在位置に留まる'
                      : selectedChar.lastAction.moveDestination === 'RECALL'
                      ? 'リコール'
                      : selectedChar.lastAction.moveDestination}
                  </div>
                )}
                {selectedChar.hasActionDeclaration && (
                  <div className="text-green-300">
                    ✓ 行動宣言: {selectedChar.lastAction.actionType}{' '}
                    {selectedChar.lastAction.actionTarget &&
                      `→ ${selectedChar.lastAction.actionTarget}`}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* フェーズ1: 移動宣言 */}
      {gameState.phase === 'declaration' &&
        selectedChar &&
        !selectedChar.hasMovementDeclaration &&
        currentPhase === 'movement' && (
          <div className="mb-4 p-4 bg-gray-800 rounded border-2 border-blue-400">
            <h3 className="text-lg font-bold mb-2 text-blue-300">
              フェーズ1: {selectedChar.playerName} の移動宣言
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              現在位置: {selectedChar.position}
            </p>

            <div className="space-y-2 mb-4">
              <button
                onClick={() => setSelectedMovement(null)}
                className={`w-full px-4 py-2 rounded ${
                  selectedMovement === null ? 'bg-blue-600' : 'bg-gray-700'
                } hover:bg-blue-500`}
              >
                現在位置に留まる
              </button>
              <button
                onClick={() => setSelectedMovement('RECALL')}
                className={`w-full px-4 py-2 rounded ${
                  selectedMovement === 'RECALL' ? 'bg-purple-600' : 'bg-gray-700'
                } hover:bg-purple-500`}
              >
                リコール（ベースに戻る）
              </button>

              <div className="mt-4">
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  または別のエリアへ移動:
                </label>
                <select
                  value={selectedMovement === null || selectedMovement === 'RECALL' ? '' : selectedMovement}
                  onChange={(e) => setSelectedMovement(e.target.value || null)}
                  className="w-full p-2 bg-gray-700 rounded"
                >
                  <option value="">エリアを選択...</option>
                  {getAreaOptions().map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleDeclareMovement}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold"
            >
              移動を確定
            </button>
          </div>
        )}

      {/* フェーズ2: 行動宣言 */}
      {gameState.phase === 'declaration' &&
        selectedChar &&
        selectedChar.hasMovementDeclaration &&
        !selectedChar.hasActionDeclaration &&
        currentPhase === 'action' && (
          <div className="mb-4 p-4 bg-gray-800 rounded border-2 border-green-400">
            <h3 className="text-lg font-bold mb-2 text-green-300">
              フェーズ2: {selectedChar.playerName} の行動宣言
            </h3>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                onClick={() => setSelectedAction('attack')}
                className={`px-4 py-2 rounded ${
                  selectedAction === 'attack' ? 'bg-red-600' : 'bg-gray-700'
                } hover:bg-red-500`}
              >
                攻撃
              </button>
              <button
                onClick={() => setSelectedAction('farm')}
                className={`px-4 py-2 rounded ${
                  selectedAction === 'farm' ? 'bg-green-600' : 'bg-gray-700'
                } hover:bg-green-500`}
              >
                ファーム
              </button>
              <button
                onClick={() => setSelectedAction('wait')}
                className={`px-4 py-2 rounded ${
                  selectedAction === 'wait' ? 'bg-gray-600' : 'bg-gray-700'
                } hover:bg-gray-500`}
              >
                待機
              </button>
              <button
                onClick={() => setSelectedAction('skill')}
                className={`px-4 py-2 rounded ${
                  selectedAction === 'skill' ? 'bg-yellow-600' : 'bg-gray-700'
                } hover:bg-yellow-500`}
                disabled
              >
                スキル
              </button>
            </div>

            {/* 攻撃ターゲット選択 */}
            {selectedAction === 'attack' && (
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">攻撃対象:</label>
                <select
                  value={selectedTarget || ''}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded"
                >
                  <option value="">選択してください</option>
                  {getAttackTargets().map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 行動確定ボタン */}
            <button
              onClick={handleDeclareAction}
              disabled={
                !selectedAction || (selectedAction === 'attack' && !selectedTarget)
              }
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-bold disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              行動を確定
            </button>
          </div>
        )}

      {/* ラウンド進行ボタン */}
      {allDeclared && gameState.phase === 'declaration' && (
        <div className="mb-4 p-4 bg-green-900 rounded border-2 border-green-500">
          <div className="text-center mb-2 text-green-300 font-bold">
            全キャラクターの行動宣言が完了しました！
          </div>
          <button
            onClick={handleNextRound}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold text-lg"
          >
            ラウンドを進める（解決フェーズ）
          </button>
        </div>
      )}

      {/* 全キャラクター一覧 */}
      <div className="grid grid-cols-2 gap-4">
        {/* プレイヤーチーム */}
        <div>
          <h3 className="text-lg font-bold mb-2 text-blue-400">ブルーチーム（プレイヤー）</h3>
          {gameState.characters
            .filter((c) => c.team === 'blue')
            .map((char) => (
              <div
                key={char.id}
                className={`p-2 mb-2 rounded ${
                  char.isAlive ? 'bg-blue-800' : 'bg-gray-700'
                }`}
              >
                <div className="font-bold">{char.playerName}</div>
                <div className="text-sm">
                  HP: {char.currentHp}/{char.maxHp} | Lv.{char.level} | {char.gold}G
                </div>
                <div className="text-xs text-gray-400">{char.position}</div>
                {char.lastAction && (
                  <div className="text-xs text-yellow-400">
                    {char.lastAction.moveDestination !== null &&
                      `移動: ${
                        char.lastAction.moveDestination === 'RECALL'
                          ? 'リコール'
                          : char.lastAction.moveDestination
                      } | `}
                    行動: {char.lastAction.actionType}{' '}
                    {char.lastAction.actionTarget || ''}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* CPUチーム */}
        <div>
          <h3 className="text-lg font-bold mb-2 text-red-400">レッドチーム（CPU）</h3>
          {gameState.characters
            .filter((c) => c.team === 'red')
            .map((char) => (
              <div
                key={char.id}
                className={`p-2 mb-2 rounded ${
                  char.isAlive ? 'bg-red-800' : 'bg-gray-700'
                }`}
              >
                <div className="font-bold">{char.playerName}</div>
                <div className="text-sm">
                  HP: {char.currentHp}/{char.maxHp} | Lv.{char.level} | {char.gold}G
                </div>
                <div className="text-xs text-gray-400">{char.position}</div>
                {char.lastAction && (
                  <div className="text-xs text-yellow-400">
                    {char.lastAction.moveDestination !== null &&
                      `移動: ${
                        char.lastAction.moveDestination === 'RECALL'
                          ? 'リコール'
                          : char.lastAction.moveDestination
                      } | `}
                    行動: {char.lastAction.actionType}{' '}
                    {char.lastAction.actionTarget || ''}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* ゲーム終了 */}
      {gameState.status === 'finished' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">ゲーム終了！</h2>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded"
            >
              メニューに戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
