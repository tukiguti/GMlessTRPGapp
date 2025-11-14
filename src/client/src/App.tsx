import { GameBoard } from './components/GameBoard';
import { useWebSocket, ConnectionStatus } from './hooks/useWebSocket';

// ========================================
// App コンポーネント (Task 10-11)
// ========================================

function App() {
  // WebSocket接続管理 (Task 10)
  const { connectionStatus, isConnected, reconnect } = useWebSocket();

  // 接続状態の表示スタイル (Task 11)
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow-lg">
        <h1 className="text-3xl font-bold text-center">GMレスLoL風TRPG</h1>

        {/* 接続状態表示 (Task 11) */}
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
        {isConnected ? (
          <GameBoard />
        ) : (
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
        )}
      </main>
    </div>
  );
}

export default App;
