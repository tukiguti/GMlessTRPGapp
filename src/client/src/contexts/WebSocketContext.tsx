import { createContext, useContext, useRef, useEffect, ReactNode } from 'react';
import { WebSocketService } from '../services/websocket';

// ========================================
// WebSocket Context (Singleton問題の解決)
// ========================================

interface WebSocketContextValue {
  ws: WebSocketService;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

/**
 * WebSocketProvider
 * - Reactのライフサイクルに従ってWebSocketインスタンスを管理
 * - HMRで正しく動作する
 * - Singletonパターンの問題を回避
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const wsRef = useRef<WebSocketService | null>(null);

  // useEffect内でインスタンスを作成・管理
  useEffect(() => {
    // インスタンスが存在しない、または切断されている場合のみ作成
    if (!wsRef.current) {
      wsRef.current = new WebSocketService();
    } else if (!wsRef.current.isConnected()) {
      console.log('[WebSocketProvider] Reconnecting WebSocket');
      wsRef.current.reconnect();
    }

    // クリーンアップは本番環境でのアンマウント時のみ実行
    return () => {
      // 開発モードのStrictModeでは切断しない
      if (process.env.NODE_ENV === 'production') {
        wsRef.current?.disconnect();
      }
    };
  }, []);

  // インスタンスを一度だけ作成（useEffectが走る前の初回レンダリング用）
  if (!wsRef.current) {
    wsRef.current = new WebSocketService();
  }

  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current }}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * useWebSocketContext
 * - Context経由でWebSocketServiceを取得
 */
export const useWebSocketContext = (): WebSocketService => {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }

  return context.ws;
};
