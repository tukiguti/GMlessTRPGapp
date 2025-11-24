/**
 * シンプルなCPU AI
 * ルールベースで基本的な戦闘判断を行う
 */

import type { Character, GameState } from '../../types/offlineGame';

export interface AIAction {
  moveDestination: string | null; // null = 現在位置, エリアID = 移動, 'RECALL' = リコール
  actionType: 'attack' | 'farm' | 'skill' | 'wait';
  actionTarget?: string; // キャラクターID or ミニオンID
  skillIndex?: number;
}

export class SimpleAI {
  /**
   * CPU の行動を決定
   */
  static decideAction(character: Character, gameState: GameState): AIAction {
    const team = character.team;
    const enemyTeam = team === 'blue' ? 'red' : 'blue';
    const allies = gameState.characters.filter((c) => c.team === team && c.isAlive);
    const enemies = gameState.characters.filter((c) => c.team === enemyTeam && c.isAlive);

    // HP が低い（30%以下）ならリコール
    if (character.currentHp < character.maxHp * 0.3) {
      return {
        moveDestination: 'RECALL',
        actionType: 'wait',
      };
    }

    // 同じエリアに敵がいるか確認
    const enemiesInSameArea = enemies.filter((e) => e.position === character.position);

    if (enemiesInSameArea.length > 0) {
      // 数的有利か確認
      const alliesInSameArea = allies.filter((a) => a.position === character.position);
      const numAdvantage = alliesInSameArea.length - enemiesInSameArea.length;

      // 数的有利（同数以上）または HP が十分（> 50%）なら攻撃
      if (numAdvantage >= 0 || character.currentHp > character.maxHp * 0.5) {
        // 最もHPが低い敵を狙う
        const weakestEnemy = enemiesInSameArea.reduce((weakest, enemy) =>
          enemy.currentHp < weakest.currentHp ? enemy : weakest
        );
        return {
          moveDestination: null, // 現在位置に留まる
          actionType: 'attack',
          actionTarget: weakestEnemy.id,
        };
      } else {
        // 数的不利で HP が低いなら逃げる（安全なエリアへ移動）
        const safeArea = this.findSafeArea(character, gameState);
        return {
          moveDestination: safeArea,
          actionType: 'wait',
        };
      }
    }

    // 敵がいない場合
    // ゴールドが足りなければファーム
    if (character.gold < 1000) {
      return {
        moveDestination: null, // 現在位置に留まる
        actionType: 'farm',
      };
    }

    // ゴールドが十分あれば敵を探しに移動
    const targetArea = this.findEnemyArea(character, enemies);
    if (targetArea) {
      return {
        moveDestination: targetArea,
        actionType: 'farm', // 移動先でファーム
      };
    }

    // デフォルト: ファーム
    return {
      moveDestination: null, // 現在位置に留まる
      actionType: 'farm',
    };
  }

  /**
   * 安全なエリアを探す（自陣方向）
   */
  private static findSafeArea(character: Character, _gameState: GameState): string {
    const team = character.team;
    const baseArea = team === 'blue' ? 'BLUE_BASE' : 'RED_BASE';

    // 自陣ベースへリコール
    return baseArea;
  }

  /**
   * 敵がいるエリアを探す
   */
  private static findEnemyArea(_character: Character, enemies: Character[]): string | null {
    if (enemies.length === 0) return null;

    // ランダムに敵を選んで、そのエリアへ移動
    const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
    return randomEnemy.position;
  }
}
