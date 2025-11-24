import { io, Socket } from 'socket.io-client';
import type {
  GameStateUpdate,
  GameCreatedEvent,
  RoundStartEvent,
  CombatResult,
  ErrorEvent,
} from '../types/game';

export class WebSocketService {
  private socket: Socket;
  private static instance: WebSocketService;

  // Context API用にpublicコンストラクタに変更
  constructor() {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    this.setupEventHandlers();
  }

  /**
   * シングルトンインスタンスをリセット（開発用）
   * @deprecated Context APIを使用してください
   */
  static resetInstance(): void {
    if (WebSocketService.instance) {
      WebSocketService.instance.disconnect();
      WebSocketService.instance = null as any;
    }
  }

  private setupEventHandlers(): void {
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected to server:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });
  }

  /**
   * Singletonパターンでインスタンスを取得
   * @deprecated Context APIを使用してください (useWebSocketContext)
   */
  static getInstance(): WebSocketService {
    if (!this.instance) {
      this.instance = new WebSocketService();
    }
    return this.instance;
  }

  /**
   * 接続状態を取得
   */
  isConnected(): boolean {
    return this.socket.connected;
  }

  /**
   * ゲームを作成
   */
  createGame(mode: string = 'casual', playerName: string = 'Player'): void {
    this.socket.emit('create_game', { mode, playerName });
  }

  /**
   * ゲームに参加
   */
  joinGame(gameId: string, playerName: string): void {
    this.socket.emit('join_game', { gameId, playerName });
  }

  /**
   * ゲームから退出
   */
  leaveGame(gameId: string): void {
    this.socket.emit('leave_game', { gameId });
  }

  /**
   * プレイヤーアクションを送信
   */
  sendAction(action: any): void {
    this.socket.emit('player_action', action);
  }

  /**
   * キャラクター選択
   */
  selectCharacter(gameId: string, role: string, lane: string): void {
    this.socket.emit('select_character', { gameId, role, lane });
  }

  /**
   * ゲーム作成イベントのリスナー
   */
  onGameCreated(callback: (data: GameCreatedEvent) => void): void {
    this.socket.on('game_created', callback);
  }

  /**
   * ゲーム状態更新イベントのリスナー
   */
  onGameState(callback: (state: GameStateUpdate) => void): void {
    this.socket.on('game_state', callback);
  }

  /**
   * ゲーム更新イベントのリスナー
   */
  onGameUpdate(callback: (state: GameStateUpdate) => void): void {
    this.socket.on('game_update', callback);
  }

  /**
   * ラウンド開始イベントのリスナー
   */
  onRoundStart(callback: (data: RoundStartEvent) => void): void {
    this.socket.on('round_start', callback);
  }

  /**
   * 戦闘結果イベントのリスナー
   */
  onCombatResult(callback: (result: CombatResult) => void): void {
    this.socket.on('combat_result', callback);
  }

  /**
   * エラーイベントのリスナー
   */
  onError(callback: (error: ErrorEvent) => void): void {
    this.socket.on('error', callback);
  }

  /**
   * イベントリスナーを解除
   */
  off(event: string, callback?: any): void {
    this.socket.off(event, callback);
  }

  /**
   * 接続を切断
   */
  disconnect(): void {
    this.socket.disconnect();
  }

  /**
   * 接続を再接続
   */
  reconnect(): void {
    this.socket.connect();
  }
}

export default WebSocketService;
