import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { MainMenu, GameMode } from './components/MainMenu';
import { Lobby } from './components/Lobby';
import { CharacterSelection } from './components/CharacterSelection';
import { OfflineGame } from './components/OfflineGame';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { useWebSocket, ConnectionStatus } from './hooks/useWebSocket';
import { useGameStore } from './stores/gameStore';

// ========================================
// App コンポーネント - Context API版
// ========================================

/**
 * ゲームフロー
 * 1. メインメニュー → モード選択
 * 2. ロビー → ルーム作成/参加
 * 3. キャラクター選択 → ロール/レーン選択
 * 4. ゲームプレイ → 実際のゲーム画面
 * 5. オフラインゲーム → CPU戦（サーバー不要）
 */
type GameFlow = 'menu' | 'lobby' | 'character-selection' | 'game' | 'offline';

/**
 * AppContent - WebSocketProvider内で実行される実際のアプリコンテンツ
 */
interface AppContentProps {
  initialMode: GameMode;
  onBackToMenu: () => void;
}

function AppContent({ initialMode, onBackToMenu: onBackToMainMenu }: AppContentProps) {
  // ========================================
  // 状態管理
  // ========================================
  const [gameFlow, setGameFlow] = useState<GameFlow>('lobby');
  const [selectedMode] = useState<GameMode>(initialMode);

  // WebSocket接続管理（Context経由）
  const { connectionStatus, isConnected, reconnect } = useWebSocket();

  // ゲームストア
  const gameId = useGameStore((state) => state.gameId);
  const gameStatus = useGameStore((state) => state.status);

  // ========================================
  // ゲームフロー制御
  // ========================================

  /**
   * ロビーから戻る
   */
  const handleBackToMenu = () => {
    onBackToMainMenu();
  };

  /**
   * ルーム作成/参加完了 → キャラクター選択へ
   */
  const handleGameReady = () => {
    setGameFlow('character-selection');
  };

  /**
   * キャラクター選択完了 → ゲーム開始
   */
  const handleCharacterSelected = () => {
    setGameFlow('game');
  };

  // ========================================
  // ゲームステータスの監視
  // ========================================
  useEffect(() => {
    // ゲームが終了したらメニューに戻る
    if (gameStatus === 'finished') {
      setGameFlow('menu');
    }
  }, [gameStatus]);

  // ========================================
  // 接続状態の表示スタイル
  // ========================================
  const getConnectionStatusStyle = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'bg-green-600';
      case 'connecting':
        return 'bg-yellow-600 animate-pulse';
      case 'disconnected':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getConnectionStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return '接続済み';
      case 'connecting':
        return '接続中...';
      case 'disconnected':
        return '切断';
      default:
        return '不明';
    }
  };

  // ========================================
  // レンダリング
  // ========================================

  // 接続が確立されていない場合は接続画面を表示
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 p-4 shadow-lg">
          <h1 className="text-3xl font-bold text-center">GMレスLoL風TRPG</h1>

          {/* 接続状態表示 */}
          <div className="text-center mt-2 flex items-center justify-center gap-3">
            <span
              className={`inline-block px-3 py-1 rounded text-sm font-medium ${getConnectionStatusStyle(
                connectionStatus
              )}`}
            >
              {getConnectionStatusText(connectionStatus)}
            </span>

            {/* 再接続ボタン (切断時のみ表示) */}
            {connectionStatus === 'disconnected' && (
              <button
                onClick={reconnect}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
              >
                再接続
              </button>
            )}
          </div>
        </header>

        <main className="container mx-auto p-4">
          <div className="text-center mt-20">
            <div className="text-lg text-gray-400">
              {connectionStatus === 'connecting' && (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>サーバーに接続中...</p>
                </>
              )}
              {connectionStatus === 'disconnected' && (
                <>
                  <p className="mb-4">サーバーに接続できませんでした</p>
                  <button
                    onClick={reconnect}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
                  >
                    再接続
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 接続が確立されている場合はゲームフローに応じた画面を表示
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ヘッダー (ゲーム中のみ表示) */}
      {gameFlow === 'game' && (
        <header className="bg-gray-800 p-4 shadow-lg">
          <h1 className="text-3xl font-bold text-center">GMレスLoL風TRPG</h1>

          {/* 接続状態表示 */}
          <div className="text-center mt-2 flex items-center justify-center gap-3">
            <span
              className={`inline-block px-3 py-1 rounded text-sm font-medium ${getConnectionStatusStyle(
                connectionStatus
              )}`}
            >
              {getConnectionStatusText(connectionStatus)}
            </span>

            {/* Game ID表示 */}
            {gameId && (
              <span className="inline-block px-3 py-1 rounded text-sm font-medium bg-blue-600">
                Game ID: {gameId.substring(0, 8)}
              </span>
            )}
          </div>
        </header>
      )}

      {/* メインコンテンツ */}
      <main>
        {/* 1. ロビー */}
        {gameFlow === 'lobby' && (
          <Lobby
            mode={selectedMode}
            onBack={handleBackToMenu}
            onGameReady={handleGameReady}
          />
        )}

        {/* 2. キャラクター選択 */}
        {gameFlow === 'character-selection' && gameId && (
          <CharacterSelection
            gameId={gameId}
            onSelectionComplete={handleCharacterSelected}
          />
        )}

        {/* 3. ゲームプレイ */}
        {gameFlow === 'game' && gameId && <GameBoard />}
      </main>
    </div>
  );
}

/**
 * App - WebSocketProviderでラップ
 * オフラインモードは接続不要なので、外側で処理
 */
function App() {
  const [gameFlow, setGameFlow] = useState<GameFlow>('menu');
  const [selectedMode, setSelectedMode] = useState<GameMode>('casual');

  const handleStartGame = (mode: GameMode) => {
    setSelectedMode(mode);

    // CPU練習モードの場合はオフラインゲームへ（接続不要）
    if (mode === 'cpu') {
      setGameFlow('offline');
    } else {
      setGameFlow('lobby');
    }
  };

  const handleBackToMenu = () => {
    setGameFlow('menu');
  };

  // オフラインモードの場合は接続不要
  if (gameFlow === 'offline') {
    return <OfflineGame onBack={handleBackToMenu} />;
  }

  // メインメニューを表示（オンラインモード選択前）
  if (gameFlow === 'menu') {
    return <MainMenu onStartGame={handleStartGame} />;
  }

  // オンラインモードの場合はWebSocketProvider内で処理
  return (
    <WebSocketProvider>
      <AppContent initialMode={selectedMode} onBackToMenu={handleBackToMenu} />
    </WebSocketProvider>
  );
}

export default App;
