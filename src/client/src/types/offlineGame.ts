/**
 * オフラインゲームモード用の型定義
 * サーバーと独立して動作するため、シンプルな型を使用
 */

import type { GamePhase, GameStatus, Stats } from './game';

// ========================================
// オフラインゲーム固有の型
// ========================================

/**
 * オフラインゲーム用のロールタイプ
 */
export type RoleType =
  | 'tank'
  | 'fighter'
  | 'assassin'
  | 'marksman'
  | 'mage'
  | 'support'
  | 'enchanter'
  | 'catcher'
  | 'diver'
  | 'juggernaut';

/**
 * プレイヤー行動（2段階フェーズ）
 */
export interface PlayerAction {
  // フェーズ1: 移動選択
  moveDestination: string | null; // null = 現在位置に留まる, エリアID = 移動, 'RECALL' = リコール

  // フェーズ2: 行動選択
  actionType: 'attack' | 'farm' | 'skill' | 'wait'; // wait = 何もしない
  actionTarget?: string; // キャラクターID or ミニオンID or タワーID
  skillIndex?: number;
}

/**
 * バフ（オフラインゲーム用の簡易版）
 */
export interface OfflineBuff {
  type: string;
  duration: number;
  effect: Partial<Stats>;
}

/**
 * スキル（オフラインゲーム用の簡易版）
 */
export interface OfflineSkill {
  name: string;
  cooldown: number;
  ready: boolean;
}

/**
 * アイテム（オフラインゲーム用の簡易版）
 */
export interface OfflineItem {
  id: string;
  name: string;
  cost: number;
  stats: Partial<Stats>;
}

/**
 * キャラクター（オフラインゲーム用）
 */
export interface Character {
  id: string;
  playerName: string;
  role: RoleType;
  lane: string;
  team: 'blue' | 'red';
  level: number;
  experience: number;
  gold: number;
  baseStats: Stats;
  finalStats: Stats;
  currentHp: number;
  maxHp: number;
  position: string; // エリアID（シンプルな文字列）
  buffs: OfflineBuff[];
  debuffs: OfflineBuff[];
  items: OfflineItem[];
  skills: OfflineSkill[];
  isAlive: boolean;

  // 行動宣言状態
  hasMovementDeclaration: boolean; // 移動フェーズの宣言完了
  hasActionDeclaration: boolean; // 行動フェーズの宣言完了
  isDeclared: boolean; // 両方のフェーズが完了（後方互換性のため残す）
  lastAction: PlayerAction | null;
}

/**
 * タワー（オフラインゲーム用）
 */
export interface Tower {
  id: string;
  team: 'blue' | 'red';
  lane: 'top' | 'mid' | 'bot';
  currentHp: number;
  maxHp: number;
  isDestroyed: boolean;
}

/**
 * ミニオン（オフラインゲーム用の簡易版）
 */
export interface Minion {
  id: string;
  team: 'blue' | 'red';
  lane: string;
  currentHp: number;
  maxHp: number;
  isAlive: boolean;
}

/**
 * ゲームオブジェクト（ドラゴン、バロンなど）
 */
export interface GameObject {
  id: string;
  type: 'dragon' | 'baron' | 'herald';
  currentHp: number;
  maxHp: number;
  isAlive: boolean;
}

/**
 * ゲーム状態（オフラインゲーム用）
 */
export interface GameState {
  gameId: string;
  round: number;
  phase: GamePhase;
  status: GameStatus;
  characters: Character[];
  towers: Tower[];
  minions: Minion[];
  objects: GameObject[];
}
