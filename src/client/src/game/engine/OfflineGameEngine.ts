/**
 * オフラインゲームエンジン（CPU戦用）
 * サーバーを経由せず、クライアント側でゲームロジックを実行
 */

import type { Character, GameState, PlayerAction } from '../../types/offlineGame';
import { GAME_CONFIG, type RoleType } from '../config/gameConfig';
import { SimpleAI } from '../ai/SimpleAI';

export class OfflineGameEngine {
  private gameState: GameState;
  private playerTeam: 'blue' | 'red' = 'blue';
  private cpuTeam: 'red' | 'blue' = 'red';
  private roundActions: Map<string, PlayerAction> = new Map();

  constructor() {
    this.gameState = this.initializeGame();
  }

  /**
   * ゲーム初期化
   */
  private initializeGame(): GameState {
    return {
      gameId: 'offline-' + Date.now(),
      round: 0,
      phase: 'declaration',
      status: 'in_progress',
      characters: [],
      towers: this.initializeTowers(),
      minions: [],
      objects: [],
    };
  }

  /**
   * タワー初期化
   */
  private initializeTowers() {
    const towers: import('../../types/offlineGame').Tower[] = [];
    const towerNames = [
      'BLUE_TOP_OUTER', 'BLUE_TOP_INNER', 'BLUE_TOP_INHIBITOR',
      'BLUE_MID_OUTER', 'BLUE_MID_INNER', 'BLUE_MID_INHIBITOR',
      'BLUE_BOT_OUTER', 'BLUE_BOT_INNER', 'BLUE_BOT_INHIBITOR',
      'RED_TOP_OUTER', 'RED_TOP_INNER', 'RED_TOP_INHIBITOR',
      'RED_MID_OUTER', 'RED_MID_INNER', 'RED_MID_INHIBITOR',
      'RED_BOT_OUTER', 'RED_BOT_INNER', 'RED_BOT_INHIBITOR',
    ];

    for (const name of towerNames) {
      towers.push({
        id: name,
        team: name.startsWith('BLUE') ? 'blue' : 'red',
        lane: name.includes('TOP') ? 'top' : name.includes('MID') ? 'mid' : 'bot',
        currentHp: GAME_CONFIG.tower.maxHp,
        maxHp: GAME_CONFIG.tower.maxHp,
        isDestroyed: false,
      });
    }

    return towers;
  }

  /**
   * キャラクター作成
   */
  createCharacter(
    id: string,
    role: RoleType,
    lane: string,
    team: 'blue' | 'red',
    playerName: string
  ): Character {
    const baseStats = GAME_CONFIG.roles[role];
    const maxHp = 100 + baseStats.defense * 10;

    // 初期位置は自陣リスポーン（ベース）
    const initialPosition = team === 'blue' ? 'BLUE_BASE' : 'RED_BASE';

    return {
      id,
      playerName,
      role,
      lane,
      team,
      level: 1,
      experience: 0,
      gold: 500, // 初期ゴールド
      baseStats: { ...baseStats },
      finalStats: { ...baseStats },
      currentHp: maxHp,
      maxHp,
      position: initialPosition, // 初期位置は自陣リスポーン
      buffs: [],
      debuffs: [],
      items: [],
      skills: [], // オフラインモードではシンプルな配列
      isAlive: true,
      hasMovementDeclaration: false,
      hasActionDeclaration: false,
      isDeclared: false,
      lastAction: null,
    };
  }

  /**
   * ゲーム開始
   */
  startGame(playerCharacters: Character[], cpuCharacters: Character[]) {
    this.gameState.characters = [...playerCharacters, ...cpuCharacters];
    this.gameState.round = 1;
    this.gameState.phase = 'declaration';
    this.gameState.status = 'in_progress';
  }

  /**
   * フェーズ1: 移動宣言
   */
  declareMovement(characterId: string, destination: string | null) {
    const character = this.gameState.characters.find((c) => c.id === characterId);
    if (!character) return;

    // 既存のアクションがあればそれを取得、なければ新規作成
    let action = this.roundActions.get(characterId);
    if (!action) {
      action = {
        moveDestination: destination,
        actionType: 'wait', // デフォルト
      };
      this.roundActions.set(characterId, action);
    } else {
      action.moveDestination = destination;
    }

    character.hasMovementDeclaration = true;
    character.lastAction = action;
  }

  /**
   * フェーズ2: 行動宣言
   */
  declareAction(characterId: string, actionType: PlayerAction['actionType'], target?: string) {
    const character = this.gameState.characters.find((c) => c.id === characterId);
    if (!character) return;

    // 既存のアクションがあればそれを取得
    let action = this.roundActions.get(characterId);
    if (!action) {
      // 移動宣言がなかった場合は現在位置に留まる
      action = {
        moveDestination: null, // 現在位置に留まる
        actionType,
        actionTarget: target,
      };
      this.roundActions.set(characterId, action);
    } else {
      action.actionType = actionType;
      action.actionTarget = target;
    }

    character.hasActionDeclaration = true;
    character.isDeclared = character.hasMovementDeclaration && character.hasActionDeclaration;
    character.lastAction = action;
  }

  /**
   * CPUの行動を自動決定
   */
  private declareCPUActions() {
    const cpuCharacters = this.gameState.characters.filter((c) => c.team === this.cpuTeam && c.isAlive);

    for (const cpu of cpuCharacters) {
      const aiAction = SimpleAI.decideAction(cpu, this.gameState);

      // AI行動を PlayerAction 形式に変換
      const action: PlayerAction = {
        moveDestination: aiAction.moveDestination,
        actionType: aiAction.actionType,
        actionTarget: aiAction.actionTarget,
        skillIndex: aiAction.skillIndex,
      };

      this.roundActions.set(cpu.id, action);
      cpu.hasMovementDeclaration = true;
      cpu.hasActionDeclaration = true;
      cpu.isDeclared = true;
      cpu.lastAction = action;
    }
  }

  /**
   * ラウンドを解決
   */
  async resolveRound(): Promise<GameState> {
    // CPUの行動を自動決定
    this.declareCPUActions();

    // 解決フェーズに移行
    this.gameState.phase = 'resolution';

    // ステップ1: クリーンアップ（バフ・デバフの持続時間減少など）
    // TODO: 後で実装

    // ステップ2: 移動解決（リコール、ローム）
    for (const [characterId, action] of Array.from(this.roundActions)) {
      if (action.moveDestination !== null) {
        const character = this.gameState.characters.find((c) => c.id === characterId);
        if (character && character.isAlive) {
          if (action.moveDestination === 'RECALL') {
            this.processRecall(character);
          } else {
            this.processMove(character, action.moveDestination);
          }
        }
      }
    }

    // ステップ3: ガンク判定
    // TODO: 後で実装

    // ステップ4-13: マッチアップ決定と戦闘、ファームなど
    for (const [characterId, action] of Array.from(this.roundActions)) {
      const character = this.gameState.characters.find((c) => c.id === characterId);
      if (!character || !character.isAlive) continue;

      // 移動以外の行動を処理
      if (action.actionType === 'attack') {
        this.processAttack(character, action.actionTarget!);
      } else if (action.actionType === 'farm') {
        this.processFarm(character);
      } else if (action.actionType === 'skill') {
        // スキル処理は後で実装
        console.log(`[Skill] ${character.playerName} used skill (not implemented)`);
      }
      // 'wait' の場合は何もしない
    }

    // ラウンド終了処理
    this.gameState.round++;
    this.gameState.phase = 'declaration';
    this.roundActions.clear();

    // 全キャラクターの宣言状態をリセット
    for (const character of this.gameState.characters) {
      character.hasMovementDeclaration = false;
      character.hasActionDeclaration = false;
      character.isDeclared = false;

      // 死亡キャラクターのリスポーン処理（簡易版：即座にリスポーン）
      if (!character.isAlive) {
        character.isAlive = true;
        character.currentHp = character.maxHp;
        const baseArea = character.team === 'blue' ? 'BLUE_BASE' : 'RED_BASE';
        character.position = baseArea;
        console.log(`[Respawn] ${character.playerName} respawned at ${baseArea}`);
      }
    }

    // 勝敗判定
    this.checkGameEnd();

    return this.gameState;
  }


  /**
   * 攻撃処理
   */
  private processAttack(attacker: Character, targetId: string) {
    const defender = this.gameState.characters.find((c) => c.id === targetId);
    if (!defender || !defender.isAlive) return;

    // 簡易戦闘判定
    const attackRoll = Math.floor(Math.random() * 20) + 1;
    const defenseRoll = Math.floor(Math.random() * 20) + 1;

    const attackTotal = attackRoll + attacker.finalStats.attack;
    const defenseTotal = defenseRoll + defender.finalStats.defense;

    if (attackTotal > defenseTotal) {
      // 攻撃成功
      const baseDamage = Math.floor(
        Math.random() * (GAME_CONFIG.combat.baseDamageMax - GAME_CONFIG.combat.baseDamageMin)
      ) + GAME_CONFIG.combat.baseDamageMin;

      let damage = baseDamage;

      // クリティカル判定
      if (attackRoll === GAME_CONFIG.combat.criticalHit) {
        damage *= GAME_CONFIG.combat.criticalMultiplier;
      }

      // ダメージ適用
      defender.currentHp = Math.max(0, defender.currentHp - damage);

      // デス処理
      if (defender.currentHp === 0) {
        defender.isAlive = false;
        attacker.gold += GAME_CONFIG.gold.kill;

        // 経験値取得（レベルアップ判定）
        attacker.experience += 100;
        this.checkLevelUp(attacker);
      }

      console.log(
        `[Combat] ${attacker.playerName} (${attackTotal}) attacked ${defender.playerName} (${defenseTotal}) for ${damage} damage`
      );
    } else {
      // 攻撃失敗
      console.log(
        `[Combat] ${attacker.playerName} (${attackTotal}) missed ${defender.playerName} (${defenseTotal})`
      );
    }
  }

  /**
   * ファーム処理
   */
  private processFarm(character: Character) {
    // シンプルにゴールド獲得
    const goldGained = GAME_CONFIG.gold.minionKill;
    character.gold += goldGained;
    character.experience += 20;
    this.checkLevelUp(character);

    console.log(`[Farm] ${character.playerName} farmed ${goldGained} gold`);
  }

  /**
   * 移動処理
   */
  private processMove(character: Character, targetArea: string) {
    character.position = targetArea;
    console.log(`[Move] ${character.playerName} moved to ${targetArea}`);
  }

  /**
   * リコール処理
   */
  private processRecall(character: Character) {
    // HP全回復
    character.currentHp = character.maxHp;

    // 自陣ベースへ移動
    const baseArea = character.team === 'blue' ? 'BLUE_BASE' : 'RED_BASE';
    character.position = baseArea;

    console.log(`[Recall] ${character.playerName} recalled to base`);
  }

  /**
   * レベルアップ判定
   */
  private checkLevelUp(character: Character) {
    const expNeeded = character.level * 100;
    if (character.experience >= expNeeded) {
      character.level++;
      character.experience -= expNeeded;

      // ステータス上昇
      character.baseStats.attack += GAME_CONFIG.levelUp.attack;
      character.baseStats.defense += GAME_CONFIG.levelUp.defense;
      character.baseStats.mobility += GAME_CONFIG.levelUp.mobility;
      character.baseStats.utility += GAME_CONFIG.levelUp.utility;
      character.maxHp += GAME_CONFIG.levelUp.maxHp;
      character.currentHp += GAME_CONFIG.levelUp.maxHp;

      // finalStatsを再計算
      character.finalStats = { ...character.baseStats };

      console.log(`[Level Up] ${character.playerName} reached level ${character.level}!`);
    }
  }

  /**
   * ゲーム終了判定
   */
  private checkGameEnd() {
    const blueAlive = this.gameState.characters.filter((c) => c.team === 'blue' && c.isAlive).length;
    const redAlive = this.gameState.characters.filter((c) => c.team === 'red' && c.isAlive).length;

    if (blueAlive === 0) {
      this.gameState.status = 'finished';
      console.log('[Game End] Red team wins!');
    } else if (redAlive === 0) {
      this.gameState.status = 'finished';
      console.log('[Game End] Blue team wins!');
    }

    // 最大ラウンド到達
    if (this.gameState.round >= GAME_CONFIG.round.maxRounds) {
      this.gameState.status = 'finished';
      console.log('[Game End] Max rounds reached!');
    }
  }

  /**
   * 現在のゲーム状態を取得
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * プレイヤーチームを取得
   */
  getPlayerTeam(): 'blue' | 'red' {
    return this.playerTeam;
  }
}
