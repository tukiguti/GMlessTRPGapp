import { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';

// ========================================
// useWebSocket フック
// ========================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * WebSocketServiceのラッパーフック
 * 接続状態管理とイベントハンドラーを提供
 */
export const useWebSocket = (): UseWebSocketReturn => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const ws = useWebSocketContext(); // Context経由でWebSocketServiceを取得
  const wsRef = useRef(ws);

  // ========================================
  // イベントハンドラー
  // ========================================
  // Note: Handlers removed as they are now handled in OnlineGame.tsx or not used globally.

  // ========================================
  // WebSocket接続管理
  // ========================================

  useEffect(() => {
    // Context経由で取得したインスタンスを使用
    const currentWs = wsRef.current;
    let lastStatus: ConnectionStatus | null = null;

    // 接続状態チェック（状態が変わった時だけログ出力）
    const checkConnection = () => {
      const isConnected = currentWs.isConnected();
      const newStatus: ConnectionStatus = isConnected ? 'connected' : 'connecting';

      // 状態が変わった時だけログ出力
      if (newStatus !== lastStatus) {
        console.log(`[useWebSocket] Status changed: ${lastStatus || 'initial'} → ${newStatus}`);
        lastStatus = newStatus;
        setConnectionStatus(newStatus);
      }
    };

    // 初期チェック
    checkConnection();

    // 定期的に接続状態をチェック
    const intervalId = setInterval(checkConnection, 1000);

    // イベントリスナーを登録
    // Note: Game specific events are handled in OnlineGame.tsx
    // Here we only track connection status.

    // クリーンアップ
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // ========================================
  // 公開メソッド
  // ========================================

  const reconnect = useCallback(() => {
    wsRef.current?.reconnect();
    setConnectionStatus('connecting');
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
    setConnectionStatus('disconnected');
  }, []);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    reconnect,
    disconnect,
  };
};
