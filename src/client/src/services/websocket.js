import { io } from 'socket.io-client';
export class WebSocketService {
    socket;
    static instance;
    constructor() {
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
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
    static getInstance() {
        if (!this.instance) {
            this.instance = new WebSocketService();
        }
        return this.instance;
    }
    /**
     * 接続状態を取得
     */
    isConnected() {
        return this.socket.connected;
    }
    /**
     * ゲームを作成
     */
    createGame(mode = 'casual') {
        this.socket.emit('create_game', { mode });
    }
    /**
     * ゲームに参加
     */
    joinGame(gameId, playerName) {
        this.socket.emit('join_game', { gameId, playerName });
    }
    /**
     * ゲームから退出
     */
    leaveGame(gameId) {
        this.socket.emit('leave_game', { gameId });
    }
    /**
     * プレイヤーアクションを送信
     */
    sendAction(action) {
        this.socket.emit('player_action', action);
    }
    /**
     * キャラクター選択
     */
    selectCharacter(gameId, role, lane) {
        this.socket.emit('select_character', { gameId, role, lane });
    }
    /**
     * ゲーム作成イベントのリスナー
     */
    onGameCreated(callback) {
        this.socket.on('game_created', callback);
    }
    /**
     * ゲーム状態更新イベントのリスナー
     */
    onGameState(callback) {
        this.socket.on('game_state', callback);
    }
    /**
     * ゲーム更新イベントのリスナー
     */
    onGameUpdate(callback) {
        this.socket.on('game_update', callback);
    }
    /**
     * ラウンド開始イベントのリスナー
     */
    onRoundStart(callback) {
        this.socket.on('round_start', callback);
    }
    /**
     * 戦闘結果イベントのリスナー
     */
    onCombatResult(callback) {
        this.socket.on('combat_result', callback);
    }
    /**
     * エラーイベントのリスナー
     */
    onError(callback) {
        this.socket.on('error', callback);
    }
    /**
     * イベントリスナーを解除
     */
    off(event, callback) {
        this.socket.off(event, callback);
    }
    /**
     * 接続を切断
     */
    disconnect() {
        this.socket.disconnect();
    }
    /**
     * 接続を再接続
     */
    reconnect() {
        this.socket.connect();
    }
}
export default WebSocketService;
