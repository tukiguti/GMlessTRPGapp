import { ConfigLoader } from '../config/ConfigLoader';
import { Character } from '../systems/Character';

// ========================================
// タワー型定義
// ========================================
export interface Tower {
  id: string;
  team: 'blue' | 'red';
  type: 'outer' | 'inner' | 'nexus_tower' | 'nexus';
  lane?: string;
  hp: number;
  maxHp: number;
  destroyed: boolean;
}

// ========================================
// ミニオン型定義
// ========================================
export interface Minion {
  id: string;
  team: 'blue' | 'red';
  lane: string;
  hp: number;
  position: number;
}

// ========================================
// ジャングルバフ型定義
// ========================================
export interface JungleBuffState {
  id: string;
  type: 'red' | 'blue';
  team: 'blue' | 'red';
  available: boolean;
  respawnTimer: number;
}

// ========================================
// ゲームオブジェクト型定義
// ========================================
export interface GameObject {
  id: string;
  type: 'dragon' | 'baron' | 'herald';
  hp: number;
  maxHp: number;
  available: boolean;
  respawnTimer: number;
}

// ========================================
// ゲーム状態型定義
// ========================================
export interface GameState {
  gameId: string;
  mode: 'casual' | 'ranked_1v1' | 'ranked_5v5' | 'tutorial';
  round: number;
  phase: 'declaration' | 'resolution';
  teams: {
    blue: Character[];
    red: Character[];
  };
  towers: Tower[];
  minions: Minion[];
  jungleBuffs: JungleBuffState[];
  objects: GameObject[];
  status: 'waiting' | 'in_progress' | 'finished';
  winner?: 'blue' | 'red';
}

// ========================================
// ゲームエンジン
// ========================================
export class GameEngine {
  private games: Map<string, GameState> = new Map();

  /**
   * 新しいゲームを作成
   */
  createGame(gameId: string, mode: GameState['mode'] = 'casual'): GameState {
    const initialState: GameState = {
      gameId,
      mode,
      round: 0,
      phase: 'declaration',
      teams: {
        blue: [],
        red: []
      },
      towers: this.initializeTowers(),
      minions: [],
      jungleBuffs: this.initializeJungleBuffs(),
      objects: this.initializeObjects(),
      status: 'waiting'
    };

    this.games.set(gameId, initialState);
    console.log(`[GameEngine] Game created: ${gameId} (${mode})`);

    return initialState;
  }

  /**
   * ゲーム状態を取得
   */
  getGameState(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  /**
   * ゲーム状態を更新
   */
  updateGameState(gameId: string, updates: Partial<GameState>): void {
    const game = this.games.get(gameId);
    if (!game) {
      console.error(`[GameEngine] Game not found: ${gameId}`);
      return;
    }

    Object.assign(game, updates);
  }

  /**
   * ゲームを削除
   */
  deleteGame(gameId: string): void {
    this.games.delete(gameId);
    console.log(`[GameEngine] Game deleted: ${gameId}`);
  }

  /**
   * キャラクターをチームに追加
   */
  addCharacterToTeam(gameId: string, character: Character, team: 'blue' | 'red'): void {
    const game = this.games.get(gameId);
    if (!game) {
      console.error(`[GameEngine] Game not found: ${gameId}`);
      return;
    }

    game.teams[team].push(character);
    console.log(`[GameEngine] Added ${character.name} to ${team} team`);
  }

  /**
   * タワーの初期化
   */
  private initializeTowers(): Tower[] {
    const config = ConfigLoader.get();
    const towerHp = config.tower_system.hp;

    const towers: Tower[] = [];

    // ブルーチーム
    towers.push(
      { id: 'blue_nexus', team: 'blue', type: 'nexus', hp: towerHp.nexus, maxHp: towerHp.nexus, destroyed: false },
      { id: 'blue_nexus_tower_1', team: 'blue', type: 'nexus_tower', hp: towerHp.nexus_tower, maxHp: towerHp.nexus_tower, destroyed: false },
      { id: 'blue_nexus_tower_2', team: 'blue', type: 'nexus_tower', hp: towerHp.nexus_tower, maxHp: towerHp.nexus_tower, destroyed: false },
      { id: 'blue_top_inner', team: 'blue', type: 'inner', lane: 'TOP', hp: towerHp.inner_tower, maxHp: towerHp.inner_tower, destroyed: false },
      { id: 'blue_mid_inner', team: 'blue', type: 'inner', lane: 'MID', hp: towerHp.inner_tower, maxHp: towerHp.inner_tower, destroyed: false },
      { id: 'blue_bot_inner', team: 'blue', type: 'inner', lane: 'BOT', hp: towerHp.inner_tower, maxHp: towerHp.inner_tower, destroyed: false },
      { id: 'blue_top_outer', team: 'blue', type: 'outer', lane: 'TOP', hp: towerHp.outer_tower, maxHp: towerHp.outer_tower, destroyed: false },
      { id: 'blue_mid_outer', team: 'blue', type: 'outer', lane: 'MID', hp: towerHp.outer_tower, maxHp: towerHp.outer_tower, destroyed: false },
      { id: 'blue_bot_outer', team: 'blue', type: 'outer', lane: 'BOT', hp: towerHp.outer_tower, maxHp: towerHp.outer_tower, destroyed: false }
    );

    // レッドチーム
    towers.push(
      { id: 'red_nexus', team: 'red', type: 'nexus', hp: towerHp.nexus, maxHp: towerHp.nexus, destroyed: false },
      { id: 'red_nexus_tower_1', team: 'red', type: 'nexus_tower', hp: towerHp.nexus_tower, maxHp: towerHp.nexus_tower, destroyed: false },
      { id: 'red_nexus_tower_2', team: 'red', type: 'nexus_tower', hp: towerHp.nexus_tower, maxHp: towerHp.nexus_tower, destroyed: false },
      { id: 'red_top_inner', team: 'red', type: 'inner', lane: 'TOP', hp: towerHp.inner_tower, maxHp: towerHp.inner_tower, destroyed: false },
      { id: 'red_mid_inner', team: 'red', type: 'inner', lane: 'MID', hp: towerHp.inner_tower, maxHp: towerHp.inner_tower, destroyed: false },
      { id: 'red_bot_inner', team: 'red', type: 'inner', lane: 'BOT', hp: towerHp.inner_tower, maxHp: towerHp.inner_tower, destroyed: false },
      { id: 'red_top_outer', team: 'red', type: 'outer', lane: 'TOP', hp: towerHp.outer_tower, maxHp: towerHp.outer_tower, destroyed: false },
      { id: 'red_mid_outer', team: 'red', type: 'outer', lane: 'MID', hp: towerHp.outer_tower, maxHp: towerHp.outer_tower, destroyed: false },
      { id: 'red_bot_outer', team: 'red', type: 'outer', lane: 'BOT', hp: towerHp.outer_tower, maxHp: towerHp.outer_tower, destroyed: false }
    );

    return towers;
  }

  /**
   * ジャングルバフの初期化
   */
  private initializeJungleBuffs(): JungleBuffState[] {
    return [
      { id: 'blue_red_buff', type: 'red', team: 'blue', available: true, respawnTimer: 0 },
      { id: 'blue_blue_buff', type: 'blue', team: 'blue', available: true, respawnTimer: 0 },
      { id: 'red_red_buff', type: 'red', team: 'red', available: true, respawnTimer: 0 },
      { id: 'red_blue_buff', type: 'blue', team: 'red', available: true, respawnTimer: 0 }
    ];
  }

  /**
   * オブジェクトの初期化
   */
  private initializeObjects(): GameObject[] {
    const config = ConfigLoader.get();

    const objects: GameObject[] = [];

    // ドラゴン
    if (config.objects.dragon_common) {
      objects.push({
        id: 'dragon',
        type: 'dragon',
        hp: config.objects.dragon_common.hp,
        maxHp: config.objects.dragon_common.hp,
        available: true,
        respawnTimer: 0
      });
    }

    // バロン
    if (config.objects.baron) {
      objects.push({
        id: 'baron',
        type: 'baron',
        hp: config.objects.baron.hp,
        maxHp: config.objects.baron.hp,
        available: true,
        respawnTimer: 0
      });
    }

    // ヘラルド
    if (config.objects.herald) {
      objects.push({
        id: 'herald',
        type: 'herald',
        hp: config.objects.herald.hp,
        maxHp: config.objects.herald.hp,
        available: true,
        respawnTimer: 0
      });
    }

    return objects;
  }

  /**
   * 勝利条件チェック
   */
  checkVictoryCondition(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;

    // ネクサス破壊チェック
    const blueNexus = game.towers.find(t => t.id === 'blue_nexus');
    const redNexus = game.towers.find(t => t.id === 'red_nexus');

    if (blueNexus && blueNexus.destroyed) {
      game.status = 'finished';
      game.winner = 'red';
      console.log('[GameEngine] Red team wins!');
    } else if (redNexus && redNexus.destroyed) {
      game.status = 'finished';
      game.winner = 'blue';
      console.log('[GameEngine] Blue team wins!');
    }
  }

  /**
   * 全ゲームのリストを取得
   */
  getAllGames(): GameState[] {
    return Array.from(this.games.values());
  }
}
