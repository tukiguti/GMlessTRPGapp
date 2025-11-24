import { useState } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { GameMode } from './MainMenu';

// ========================================
// Lobby コンポーネント (Task 14-17)
// ========================================

interface LobbyProps {
  mode: GameMode;
  onBack: () => void;
  onGameReady: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ mode, onBack, onGameReady }) => {
  const ws = useWebSocketContext(); // Context経由でWebSocketServiceを取得
  const [view, setView] = useState<'menu' | 'creating' | 'joining'>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  // ========================================
  // ルーム作成 (Task 15)
  // ========================================
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }

    setIsCreatingRoom(true);

    try {
      console.log('[Lobby] Creating game with mode:', mode, 'playerName:', playerName);
      // Context経由で取得したインスタンスを使用
      ws.createGame(mode, playerName);

      // game_createdイベントを待つ
      ws.onGameCreated((data) => {
        console.log('Game created:', data);
        setRoomCode(data.gameId);
        setIsCreatingRoom(false);
        onGameReady();
      });
    } catch (error) {
      console.error('Failed to create room:', error);
      setIsCreatingRoom(false);
      alert('ルームの作成に失敗しました');
    }
  };

  // ========================================
  // ルーム参加 (Task 16)
  // ========================================
  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }

    if (!roomCode.trim()) {
      alert('ルームコードを入力してください');
      return;
    }

    setIsJoiningRoom(true);

    try {
      // Context経由で取得したインスタンスを使用
      ws.joinGame(roomCode, playerName);

      // game_stateイベントを待つ
      ws.onGameState((state) => {
        console.log('Joined game:', state);
        setIsJoiningRoom(false);
        onGameReady();
      });
    } catch (error) {
      console.error('Failed to join room:', error);
      setIsJoiningRoom(false);
      alert('ルームへの参加に失敗しました');
    }
  };

  // ========================================
  // UI レンダリング
  // ========================================

  // メニュー画面
  if (view === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-2xl w-full p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">ロビー</h1>
            <p className="text-gray-400">
              モード: <span className="text-blue-400">{mode}</span>
            </p>
          </div>

          {/* プレイヤー名入力 */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">
              プレイヤー名
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="名前を入力してください"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              maxLength={20}
            />
          </div>

          {/* メニューボタン */}
          <div className="space-y-4">
            {/* ルーム作成ボタン */}
            <button
              onClick={() => setView('creating')}
              disabled={!playerName.trim()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
            >
              ルームを作成
            </button>

            {/* ルーム参加ボタン */}
            <button
              onClick={() => setView('joining')}
              disabled={!playerName.trim()}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
            >
              ルームに参加
            </button>

            {/* 戻るボタン */}
            <button
              onClick={onBack}
              className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-lg transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ルーム作成画面 (Task 15)
  if (view === 'creating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-2xl w-full p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">ルーム作成</h1>
            <p className="text-gray-400">設定を確認してルームを作成</p>
          </div>

          {/* ルーム設定 */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">プレイヤー名</span>
              <span className="font-semibold">{playerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">ゲームモード</span>
              <span className="font-semibold text-blue-400">{mode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">最大プレイヤー数</span>
              <span className="font-semibold">10人 (5vs5)</span>
            </div>
          </div>

          {/* ボタン */}
          <div className="space-y-4">
            <button
              onClick={handleCreateRoom}
              disabled={isCreatingRoom}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
            >
              {isCreatingRoom ? '作成中...' : 'ルームを作成'}
            </button>

            <button
              onClick={() => setView('menu')}
              disabled={isCreatingRoom}
              className="w-full py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ルーム参加画面 (Task 16)
  if (view === 'joining') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-2xl w-full p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">ルーム参加</h1>
            <p className="text-gray-400">ルームコードを入力してください</p>
          </div>

          {/* ルームコード入力 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              ルームコード
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="例: ABCD1234"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-center text-2xl font-mono tracking-wider"
              maxLength={8}
            />
          </div>

          {/* プレイヤー情報 */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">プレイヤー名</span>
              <span className="font-semibold">{playerName}</span>
            </div>
          </div>

          {/* ボタン */}
          <div className="space-y-4">
            <button
              onClick={handleJoinRoom}
              disabled={!roomCode.trim() || isJoiningRoom}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
            >
              {isJoiningRoom ? '参加中...' : 'ルームに参加'}
            </button>

            <button
              onClick={() => setView('menu')}
              disabled={isJoiningRoom}
              className="w-full py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
