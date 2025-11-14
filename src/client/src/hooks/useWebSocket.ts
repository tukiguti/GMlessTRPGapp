import { useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketService } from '../services/websocket';
import { useGameStore } from '../stores/gameStore';
import type {
  GameCreatedEvent,
  GameStateUpdate,
  RoundStartEvent,
  CombatResult,
  ErrorEvent,
} from '../types/game';

// ========================================
// useWebSocket フック (Task 8-9)
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
  const wsRef = useRef<WebSocketService | null>(null);

  // GameStoreのアクション
  const setGameId = useGameStore((state) => state.setGameId);
  const setGameState = useGameStore((state) => state.setGameState);
  const updateCharacter = useGameStore((state) => state.updateCharacter);

  // ========================================
  // イベントハンドラー (Task 9)
  // ========================================

  /**
   * ゲーム作成イベントハンドラー
   */
  const handleGameCreated = useCallback(
    (data: GameCreatedEvent) => {
      console.log('[useWebSocket] Game created:', data.gameId);
      setGameId(data.gameId);

      // ゲーム状態を更新
      if (data.gameState) {
        setGameState({
          round: data.gameState.round,
          phase: data.gameState.phase,
          status: 'in_progress',
          characters: [
            ...data.gameState.teams.blue,
            ...data.gameState.teams.red,
          ],
          towers: data.gameState.towers,
          minions: data.gameState.minions,
        });
      }
    },
    [setGameId, setGameState]
  );

  /**
   * ゲーム状態更新イベントハンドラー
   */
  const handleGameState = useCallback(
    (state: GameStateUpdate) => {
      console.log('[useWebSocket] Game state update:', state);
      setGameState({
        gameId: state.gameId,
        round: state.round,
        phase: state.phase,
        characters: [
          ...state.teams.blue,
          ...state.teams.red,
        ],
        towers: state.towers,
        minions: state.minions,
      });
    },
    [setGameState]
  );

  /**
   * ゲーム更新イベントハンドラー
   */
  const handleGameUpdate = useCallback(
    (state: GameStateUpdate) => {
      console.log('[useWebSocket] Game update:', state);
      setGameState({
        round: state.round,
        phase: state.phase,
        characters: [
          ...state.teams.blue,
          ...state.teams.red,
        ],
        towers: state.towers,
        minions: state.minions,
      });
    },
    [setGameState]
  );

  /**
   * ラウンド開始イベントハンドラー
   */
  const handleRoundStart = useCallback(
    (data: RoundStartEvent) => {
      console.log('[useWebSocket] Round start:', data.round);
      setGameState({
        round: data.round,
        phase: data.phase,
      });
    },
    [setGameState]
  );

  /**
   * 戦闘結果イベントハンドラー
   */
  const handleCombatResult = useCallback(
    (result: CombatResult) => {
      console.log('[useWebSocket] Combat result:', result);

      // 被ダメージ処理
      if (result.damage > 0) {
        updateCharacter(result.defenderId, {
          hp: Math.max(0, result.damage),
        });
      }

      // キル処理
      if (result.killed) {
        updateCharacter(result.defenderId, {
          alive: false,
        });
      }
    },
    [updateCharacter]
  );

  /**
   * エラーイベントハンドラー
   */
  const handleError = useCallback((error: ErrorEvent) => {
    console.error('[useWebSocket] Error:', error.message);
    // TODO: エラー通知UIを実装する場合はここで処理
  }, []);

  // ========================================
  // WebSocket接続管理
  // ========================================

  useEffect(() => {
    // WebSocketServiceインスタンスを取得
    const ws = WebSocketService.getInstance();
    wsRef.current = ws;

    // 接続状態チェック
    const checkConnection = () => {
      if (ws.isConnected()) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('connecting');
      }
    };

    // 初期チェック
    checkConnection();

    // 定期的に接続状態をチェック
    const intervalId = setInterval(checkConnection, 1000);

    // イベントリスナーを登録 (Task 9)
    ws.onGameCreated(handleGameCreated);
    ws.onGameState(handleGameState);
    ws.onGameUpdate(handleGameUpdate);
    ws.onRoundStart(handleRoundStart);
    ws.onCombatResult(handleCombatResult);
    ws.onError(handleError);

    // クリーンアップ
    return () => {
      clearInterval(intervalId);
      // イベントリスナーを解除
      ws.off('game_created', handleGameCreated);
      ws.off('game_state', handleGameState);
      ws.off('game_update', handleGameUpdate);
      ws.off('round_start', handleRoundStart);
      ws.off('combat_result', handleCombatResult);
      ws.off('error', handleError);
    };
  }, [
    handleGameCreated,
    handleGameState,
    handleGameUpdate,
    handleRoundStart,
    handleCombatResult,
    handleError,
  ]);

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
