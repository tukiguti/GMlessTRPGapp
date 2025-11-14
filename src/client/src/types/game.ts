// ========================================
// GMレスLoL風TRPG - 型定義
// ========================================

// ========================================
// ロール・レーン・チーム
// ========================================

/**
 * プレイヤーが選択可能な10種類のロール
 */
export type RoleType =
  | 'ad_marksman'    // ADマークスマン: 遠距離物理DPS
  | 'ad_fighter'     // ADファイター: 近接物理DPS
  | 'ad_assassin'    // ADアサシン: 高機動物理バースト
  | 'ad_tank'        // ADタンク: 物理防御型タンク
  | 'ap_mage'        // APメイジ: 遠距離魔法DPS
  | 'ap_assassin'    // APアサシン: 高機動魔法バースト
  | 'ap_fighter'     // APファイター: 近接魔法DPS
  | 'ap_tank'        // APタンク: 魔法防御型タンク
  | 'ap_support'     // APサポート: 魔法支援型
  | 'tank_support';  // タンクサポート: 防御支援型

/**
 * 5つのレーン配置
 */
export type LaneType = 'TOP' | 'JG' | 'MID' | 'BOT' | 'SUP';

/**
 * チーム（青/赤）
 */
export type TeamType = 'blue' | 'red';

/**
 * ゲームフェーズ
 */
export type GamePhase = 'declaration' | 'resolution';

/**
 * ゲームステータス
 */
export type GameStatus = 'waiting' | 'in_progress' | 'finished';

// ========================================
// ステータス
// ========================================

/**
 * 基本ステータス（4種類）
 */
export interface Stats {
  attack: number;    // 攻撃力
  defense: number;   // 防御力
  mobility: number;  // 機動力
  utility: number;   // 支援力
}

// ========================================
// バフシステム
// ========================================

/**
 * バフの種類
 */
export type BuffType =
  // ジャングルバフ
  | 'red_buff'       // 赤バフ: 攻撃力+5
  | 'blue_buff'      // 青バフ: スキルCD-1

  // ドラゴンバフ
  | 'dragon_infernal' // インファーナル: 攻撃力+3
  | 'dragon_ocean'    // オーシャン: 防御力+3
  | 'dragon_cloud'    // クラウド: 機動力+3
  | 'dragon_mountain' // マウンテン: 支援力+3
  | 'dragon_elder'    // エルダー: 全ステータス+2

  // アイテム効果バフ
  | 'item_buff'      // アイテムによる一時バフ

  // スキル効果バフ
  | 'skill_buff';    // スキルによる一時バフ

/**
 * バフ（時限効果）
 */
export interface Buff {
  type: BuffType;         // バフの種類
  duration: number;       // 残りラウンド数
  value: number;          // 効果値
  appliedAt: number;      // 適用ラウンド
  affectedStat?: keyof Stats; // 影響するステータス（特定の場合）
}

// ========================================
// スキルシステム
// ========================================

/**
 * スキルの種類
 */
export type SkillType = 'normal' | 'ultimate';

/**
 * スキル
 */
export interface Skill {
  name: string;           // スキル名
  type: SkillType;        // 通常スキル or 必殺技
  cooldown: number;       // クールダウン（ラウンド数）
  lastUsedRound: number;  // 最後に使用したラウンド
  ready: boolean;         // 使用可能か
  description?: string;   // スキル効果説明
}

// ========================================
// アイテムシステム
// ========================================

/**
 * アイテムティア
 */
export type ItemTier = 'basic' | 'advanced' | 'legendary';

/**
 * アイテムカテゴリ
 */
export type ItemCategory =
  | 'attack'     // 攻撃系
  | 'defense'    // 防御系
  | 'mobility'   // 機動力系
  | 'utility'    // 支援系
  | 'hybrid';    // 複合系

/**
 * アイテム
 */
export interface Item {
  id: string;              // アイテムID
  name: string;            // アイテム名
  tier: ItemTier;          // ティア（基本/上級/伝説）
  category: ItemCategory;  // カテゴリ
  cost: number;            // 購入価格
  stats: Partial<Stats>;   // ステータスボーナス
  passiveEffect?: string;  // パッシブ効果説明
  activeEffect?: string;   // アクティブ効果説明
}

// ========================================
// キャラクター
// ========================================

/**
 * エリア（マップ位置）
 */
export type Area =
  | 'base'           // 本拠地
  | 'tier1_tower'    // Tier1タワー周辺
  | 'tier2_tower'    // Tier2タワー周辺
  | 'tier3_tower'    // Tier3タワー周辺（インヒビター）
  | 'jungle_buff'    // ジャングルバフエリア
  | 'dragon_pit'     // ドラゴンピット
  | 'baron_pit'      // バロンピット
  | 'river';         // リバー

/**
 * キャラクター位置
 */
export interface Position {
  area: Area;       // エリア
  lane?: LaneType;  // レーン（ジャングル以外）
}

/**
 * キャラクター（プレイヤーキャラクター）
 */
export interface Character {
  // 基本情報
  id: string;
  playerId: string;
  name: string;
  role: RoleType;
  lane: LaneType;
  team: TeamType;

  // レベル・経験値・体力・ゴールド
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  gold: number;

  // ステータス
  baseStats: Stats;       // 基本ステータス（ロール固有）
  finalStats: Stats;      // 計算済みステータス（アイテム+バフ込み）

  // 位置
  position: Position;

  // バフ/スキル/アイテム
  buffs: Buff[];
  skills: {
    normal: Skill;
    ultimate: Skill;
  };
  items: Item[];

  // 状態
  alive: boolean;
  respawnAt?: number;     // リスポーンラウンド
  isRecalling: boolean;   // リコール中か
}

// ========================================
// タワー
// ========================================

/**
 * タワータイプ
 */
export type TowerType = 'tier1' | 'tier2' | 'tier3' | 'nexus';

/**
 * タワー
 */
export interface Tower {
  id: string;
  team: TeamType;
  type: TowerType;
  lane?: LaneType;      // Nexus以外はレーンあり
  hp: number;
  maxHp: number;
  destroyed: boolean;
}

// ========================================
// ミニオン
// ========================================

/**
 * ミニオンタイプ
 */
export type MinionType = 'melee' | 'caster' | 'cannon' | 'super';

/**
 * ミニオン
 */
export interface Minion {
  id: string;
  team: TeamType;
  type: MinionType;
  lane: LaneType;
  hp: number;
  maxHp: number;
  attack: number;
  alive: boolean;
}

// ========================================
// ゲーム状態
// ========================================

/**
 * ゲーム全体の状態
 */
export interface GameState {
  // ゲーム情報
  gameId: string | null;
  mode: string;
  round: number;
  phase: GamePhase;
  status: GameStatus;

  // プレイヤー情報
  playerId: string | null;
  playerName: string | null;
  team: TeamType | null;

  // ゲームデータ
  characters: Character[];
  towers: Tower[];
  minions: Minion[];

  // 選択中のキャラクター
  selectedCharacterId: string | null;

  // アクション
  setGameId: (gameId: string) => void;
  setPlayerInfo: (playerId: string, playerName: string, team: TeamType) => void;
  setGameState: (state: Partial<GameState>) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  updateTower: (id: string, updates: Partial<Tower>) => void;
  selectCharacter: (id: string) => void;
  resetGame: () => void;
}

// ========================================
// WebSocket イベント
// ========================================

/**
 * ゲーム状態更新イベント
 */
export interface GameStateUpdate {
  gameId: string;
  round: number;
  phase: GamePhase;
  teams: {
    blue: Character[];
    red: Character[];
  };
  towers: Tower[];
  minions: Minion[];
}

/**
 * ゲーム作成イベント
 */
export interface GameCreatedEvent {
  gameId: string;
  gameState: GameStateUpdate;
}

/**
 * ラウンド開始イベント
 */
export interface RoundStartEvent {
  round: number;
  phase: GamePhase;
}

/**
 * 戦闘結果イベント
 */
export interface CombatResult {
  attackerId: string;
  defenderId: string;
  damage: number;
  killed: boolean;
}

/**
 * エラーイベント
 */
export interface ErrorEvent {
  message: string;
  code?: string;
}
