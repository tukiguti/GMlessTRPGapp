import React, { useState, useEffect } from 'react';
import { WebSocketService } from '../services/websocket';

type ActionType = 'attack' | 'farm' | 'move' | 'skill' | 'recall' | null;

interface Character {
  id: string;
  name: string;
  position: { area: string };
  hp: number;
  maxHp: number;
  gold: number;
}

interface ActionPanelProps {
  myCharacters: Character[];
  enemyCharacters: Character[];
  availableAreas: string[];
  gameId?: string; // ゲームID
  roundDuration?: number; // ラウンド時間（秒）デフォルト60秒
  onActionSubmit?: (action: {
    characterId: string;
    actionType: ActionType;
    target?: string;
    destination?: string;
  }) => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  myCharacters,
  enemyCharacters,
  availableAreas,
  gameId,
  roundDuration = 60,
  onActionSubmit
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<string>(
    myCharacters[0]?.id || ''
  );
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(roundDuration);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const currentCharacter = myCharacters.find(c => c.id === selectedCharacter);
  const wsService = WebSocketService.getInstance();

  // タイマー機能
  useEffect(() => {
    if (isSubmitted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // 時間切れ：自動的にデフォルトアクション（farm）を送信
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  // ラウンドが変わったらリセット
  useEffect(() => {
    setTimeRemaining(roundDuration);
    setIsSubmitted(false);
    setSelectedAction(null);
    setSelectedTarget('');
    setSelectedDestination('');
  }, [roundDuration]);

  const handleSubmit = (isAutoSubmit = false) => {
    if (isSubmitted) return;

    const actionType = selectedAction || 'farm'; // デフォルトはfarm
    const characterId = selectedCharacter || myCharacters[0]?.id;

    if (!characterId) {
      console.error('No character selected');
      return;
    }

    // 手動送信時のバリデーション
    if (!isAutoSubmit) {
      if (!selectedAction) {
        alert('行動を選択してください');
        return;
      }

      if (selectedAction === 'attack' && !selectedTarget) {
        alert('攻撃対象を選択してください');
        return;
      }

      if (selectedAction === 'move' && !selectedDestination) {
        alert('移動先を選択してください');
        return;
      }
    }

    const action = {
      gameId: gameId || '',
      characterId,
      actionType,
      target: selectedTarget || undefined,
      destination: selectedDestination || undefined,
    };

    // WebSocketでアクションを送信
    wsService.sendAction(action);

    // 親コンポーネントのコールバックも呼び出す（オプション）
    if (onActionSubmit) {
      onActionSubmit(action);
    }

    // 送信済みフラグを立てる
    setIsSubmitted(true);

    console.log('[ActionPanel] Action submitted:', action);
  };

  const getTimeColor = () => {
    if (timeRemaining > 30) return 'text-green-400';
    if (timeRemaining > 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!currentCharacter) {
    return <div className="p-4 bg-gray-800 text-white">キャラクターが選択されていません</div>;
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-700">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">操作キャラクター:</label>
          <select
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            {myCharacters.map((char) => (
              <option key={char.id} value={char.id}>
                {char.name} - {char.position.area}
              </option>
            ))}
          </select>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-400">残り時間</p>
          <p className={`text-3xl font-bold ${getTimeColor()}`}>
            {timeRemaining}秒
          </p>
        </div>
      </div>

      {/* キャラクター情報 */}
      <div className="bg-gray-700 p-4 rounded mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white font-semibold">{currentCharacter.name}</p>
            <p className="text-sm text-gray-400">現在地: {currentCharacter.position.area}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">
              HP: {currentCharacter.hp}/{currentCharacter.maxHp}
            </p>
            <p className="text-yellow-400 font-semibold">{currentCharacter.gold}G</p>
          </div>
        </div>
      </div>

      {/* 行動選択 */}
      <div className="mb-4">
        <p className="text-lg font-semibold text-white mb-3">行動を選択してください</p>

        <div className="grid grid-cols-3 gap-3">
          {/* 攻撃 */}
          <button
            onClick={() => setSelectedAction('attack')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedAction === 'attack'
                ? 'bg-red-600 border-red-400'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
            }`}
          >
            <div className="text-3xl mb-1">⚔️</div>
            <div className="text-white font-semibold">攻撃</div>
          </button>

          {/* ファーム */}
          <button
            onClick={() => setSelectedAction('farm')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedAction === 'farm'
                ? 'bg-yellow-600 border-yellow-400'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
            }`}
          >
            <div className="text-3xl mb-1">💰</div>
            <div className="text-white font-semibold">ファーム</div>
          </button>

          {/* 移動 */}
          <button
            onClick={() => setSelectedAction('move')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedAction === 'move'
                ? 'bg-green-600 border-green-400'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
            }`}
          >
            <div className="text-3xl mb-1">🚶</div>
            <div className="text-white font-semibold">移動</div>
          </button>

          {/* スキル */}
          <button
            onClick={() => setSelectedAction('skill')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedAction === 'skill'
                ? 'bg-purple-600 border-purple-400'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
            }`}
          >
            <div className="text-3xl mb-1">✨</div>
            <div className="text-white font-semibold">スキル</div>
          </button>

          {/* リコール */}
          <button
            onClick={() => setSelectedAction('recall')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedAction === 'recall'
                ? 'bg-blue-600 border-blue-400'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
            }`}
          >
            <div className="text-3xl mb-1">🏠</div>
            <div className="text-white font-semibold">リコール</div>
          </button>
        </div>
      </div>

      {/* 詳細設定 */}
      {selectedAction && (
        <div className="bg-gray-700 p-4 rounded mb-4">
          <p className="text-white font-semibold mb-3">詳細設定</p>

          {/* 攻撃の場合 */}
          {selectedAction === 'attack' && (
            <div>
              <label className="text-sm text-gray-400 block mb-2">攻撃対象:</label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded border border-gray-500 focus:outline-none focus:border-red-500"
              >
                <option value="">-- 選択してください --</option>
                {enemyCharacters.map((enemy) => (
                  <option key={enemy.id} value={enemy.id}>
                    {enemy.name} ({enemy.position.area}) - HP: {enemy.hp}/{enemy.maxHp}
                  </option>
                ))}
              </select>

              <p className="text-xs text-gray-400 mt-2">
                ⚠️ 視界内の敵のみ攻撃できます
              </p>
            </div>
          )}

          {/* 移動の場合 */}
          {selectedAction === 'move' && (
            <div>
              <label className="text-sm text-gray-400 block mb-2">移動先:</label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded border border-gray-500 focus:outline-none focus:border-green-500"
              >
                <option value="">-- 選択してください --</option>
                {availableAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>

              <p className="text-xs text-gray-400 mt-2">
                ℹ️ 隣接するエリアにのみ移動できます
              </p>
            </div>
          )}

          {/* ファームの場合 */}
          {selectedAction === 'farm' && (
            <div className="text-gray-300 text-sm">
              <p>現在地でミニオン/モンスターを倒してゴールドを獲得します。</p>
              <p className="text-yellow-400 mt-2">
                💡 ファーム中に攻撃されるとフロントラインに配置されます
              </p>
            </div>
          )}

          {/* スキルの場合 */}
          {selectedAction === 'skill' && (
            <div>
              <label className="text-sm text-gray-400 block mb-2">使用スキル:</label>
              <div className="space-y-2">
                <button className="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-left">
                  ⚔️ ノーマルスキル (Ready)
                </button>
                <button className="w-full bg-gray-600 text-gray-400 px-4 py-2 rounded text-left cursor-not-allowed">
                  💥 ウルト (クールダウン: 3ラウンド)
                </button>
              </div>
            </div>
          )}

          {/* リコールの場合 */}
          {selectedAction === 'recall' && (
            <div className="text-gray-300 text-sm">
              <p>ネクサスに帰還してアイテムを購入できます。</p>
              <p className="text-red-400 mt-2">
                ⚠️ リコール中に攻撃されると中断されます（1ラウンド消費）
              </p>
              <p className="text-green-400 mt-2">
                ✓ リコール成功後、HPが全回復します
              </p>
            </div>
          )}
        </div>
      )}

      {/* 確定ボタン */}
      <button
        onClick={() => handleSubmit(false)}
        disabled={!selectedAction || isSubmitted}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
          selectedAction && !isSubmitted
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isSubmitted
          ? '✓ 行動を送信しました'
          : selectedAction
          ? '行動を確定する'
          : '行動を選択してください'}
      </button>

      {/* 送信済みメッセージ */}
      {isSubmitted && (
        <div className="mt-4 p-3 bg-green-900/50 border border-green-500 rounded text-green-300 text-center">
          行動を送信しました。次のラウンドまでお待ちください。
        </div>
      )}
    </div>
  );
};
