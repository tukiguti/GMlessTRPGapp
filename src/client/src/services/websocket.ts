import { io, Socket } from 'socket.io-client';
import type { GameState, PlayerAction } from '@gmless-trpg/game';

// クライアント独自のイベント型定義
export interface GameCreatedEvent {
  gameId: string;
  round: number;
  phase: string;
  status: string;
}

export interface ActionProgressEvent {
  current: number;
  total: number;
}

export interface RoundResolvedEvent {
  round: number;
  phase: string;
  state: GameState;
}

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
   * キャラクター選択
   */
  selectCharacter(gameId: string, role: string, lane: string): void {
    this.socket.emit('select_character', { gameId, role, lane });
  }

  /**
   * ゲームから退出
   */
  leaveGame(gameId: string): void {
    this.socket.emit('leave_game', { gameId });
  }

  /**
   * アクションを送信
   */
  submitAction(gameId: string, action: PlayerAction): void {
    this.socket.emit('submit_action', { gameId, action });
  }

  // ========================================
  // イベントリスナー
  // ========================================

  /**
   * ゲーム作成イベントのリスナー
   */
  onGameCreated(callback: (data: GameCreatedEvent) => void): void {
    this.socket.on('game_created', callback);
  }

  /**
   * ゲーム参加イベントのリスナー
   */
  onGameJoined(callback: (state: GameState) => void): void {
    this.socket.on('game_joined', callback);
  }

  /**
   * プレイヤー参加イベントのリスナー
   */
  onPlayerJoined(callback: (data: { playerName: string; team: string }) => void): void {
    this.socket.on('player_joined', callback);
  }

  /**
   * アクション受付イベントのリスナー
   */
  onActionAccepted(callback: (data: { actionId: number }) => void): void {
    this.socket.on('action_accepted', callback);
  }

  /**
   * アクション進捗イベントのリスナー
   */
  onActionProgress(callback: (data: ActionProgressEvent) => void): void {
    this.socket.on('action_progress', callback);
  }

  /**
   * ラウンド解決イベントのリスナー
   */
  onRoundResolved(callback: (data: RoundResolvedEvent) => void): void {
    this.socket.on('round_resolved', callback);
  }

  /**
   * 戦闘結果イベントのリスナー
   */
  onCombatResult(callback: (result: any) => void): void {
    this.socket.on('combat_result', callback);
  }

  /**
   * ラウンド開始イベントのリスナー
   */
  onRoundStart(callback: (data: any) => void): void {
    this.socket.on('round_start', callback);
  }

  /**
   * エラーイベントのリスナー
   */
  onError(callback: (error: { message: string }) => void): void {
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
   * 再接続
   */
  reconnect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }
}

export default WebSocketService;
