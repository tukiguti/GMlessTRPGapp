import { GameState, Minion, Tower } from './GameEngine';
import { Character, updateBuffs, respawn, handleDeath, addExperience } from '../systems/Character';
import { resolveMatchup, calculateMinionDamage } from '../systems/Combat';
import { ConfigLoader } from '../config/ConfigLoader';

// ========================================
// プレイヤーアクション型定義
// ========================================
export interface PlayerAction {
  characterId: string;
  actionType: 'attack' | 'farm' | 'move' | 'recall' | 'skill' | 'item_purchase' | 'wait';
  target?: string;
  destination?: string;
  skillType?: 'normal' | 'ult';
  itemName?: string;
}

// ========================================
// マッチアップペア
// ========================================
interface MatchupPair {
  attacker: Character;
  defender: Character;
  location: string;
}

// ========================================
// ラウンド管理クラス
// ========================================
export class RoundManager {
  /**
   * 行動宣言フェーズを開始
   */
  static async startDeclarationPhase(gameState: GameState): Promise<void> {
    gameState.phase = 'declaration';
    gameState.round += 1;

    console.log(`[Round ${gameState.round}] Declaration phase started`);

    // タイムリミット: 60秒
    // プレイヤーの行動宣言を待つ
    // ※ WebSocketで実装
  }

  /**
   * ラウンド解決フェーズを実行
   */
  static async resolveRound(gameState: GameState, actions: PlayerAction[]): Promise<void> {
    gameState.phase = 'resolution';

    console.log(`[Round ${gameState.round}] Resolution phase started`);

    // 1. クリーンアップ処理
    this.cleanupBuffs(gameState);
    this.updateRespawnTimers(gameState);

    // 2. 移動解決
    this.resolveMovement(gameState, actions);

    // 3. ガンク判定
    this.resolveGanks(gameState, actions);

    // 4. マッチアップ発生判定
    const matchups = this.findMatchups(gameState, actions);

    // 5. マッチアップ判定
    for (const matchup of matchups) {
      const result = resolveMatchup(matchup.attacker, matchup.defender);

      // HP減少
      result.loser.hp -= result.damage;

      // デス判定
      if (result.loser.hp <= 0) {
        handleDeath(result.loser);

        // キラーに経験値とゴールド付与
        const config = ConfigLoader.get();
        const expBonus = config.combat_system.death_penalty.exp_bonus_to_killer;
        addExperience(result.winner, expBonus, gameState.round);
        result.winner.gold += config.gold_system.kill_bonus;
      }
    }

    // 6. ファーム・リソース獲得
    this.resolveFarming(gameState, actions);

    // 7. スキル使用
    this.resolveSkills(gameState, actions);

    // 8. アイテム購入
    this.resolveItemPurchases(gameState, actions);

    // 9. ミニオン処理
    this.spawnMinions(gameState);
    this.processMinions(gameState);

    // 10. タワー攻撃処理
    this.processTowerAttacks(gameState);

    // 11. オブジェクト処理
    this.updateObjects(gameState);

    // 12. 結果更新
    this.updateExperience(gameState);

    console.log(`[Round ${gameState.round}] Resolution phase completed`);
  }

  /**
   * バフのクリーンアップ
   */
  private static cleanupBuffs(gameState: GameState): void {
    const allCharacters = [...gameState.teams.blue, ...gameState.teams.red];

    for (const character of allCharacters) {
      updateBuffs(character);
    }
  }

  /**
   * リスポーンタイマー更新
   */
  private static updateRespawnTimers(gameState: GameState): void {
    const allCharacters = [...gameState.teams.blue, ...gameState.teams.red];

    for (const character of allCharacters) {
      respawn(character);
    }
  }

  /**
   * 移動解決
   */
  private static resolveMovement(gameState: GameState, actions: PlayerAction[]): void {
    const moveActions = actions.filter(a => a.actionType === 'move');

    for (const action of moveActions) {
      const character = this.findCharacter(gameState, action.characterId);
      if (!character || !action.destination) continue;

      character.position.area = action.destination;
      console.log(`[RoundManager] ${character.name} moved to ${action.destination}`);
    }
  }

  /**
   * ガンク判定
   */
  private static resolveGanks(gameState: GameState, actions: PlayerAction[]): void {
    // ガンク判定のロジックを実装
    // ※ 複数人が同じエリアに移動した場合の処理
  }

  /**
   * マッチアップの検出
   */
  private static findMatchups(gameState: GameState, actions: PlayerAction[]): MatchupPair[] {
    const matchups: MatchupPair[] = [];
    const attackActions = actions.filter(a => a.actionType === 'attack');

    for (const action of attackActions) {
      const attacker = this.findCharacter(gameState, action.characterId);
      const defender = action.target ? this.findCharacter(gameState, action.target) : null;

      if (attacker && defender && attacker.alive && defender.alive) {
        // 同じエリアにいるかチェック
        if (attacker.position.area === defender.position.area) {
          matchups.push({
            attacker,
            defender,
            location: attacker.position.area
          });
        }
      }
    }

    return matchups;
  }

  /**
   * ファーム処理
   */
  private static resolveFarming(gameState: GameState, actions: PlayerAction[]): void {
    const farmActions = actions.filter(a => a.actionType === 'farm');
    const config = ConfigLoader.get();

    for (const action of farmActions) {
      const character = this.findCharacter(gameState, action.characterId);
      if (!character || !character.alive) continue;

      character.gold += config.gold_system.farming;
      console.log(`[RoundManager] ${character.name} gained ${config.gold_system.farming} gold from farming`);
    }
  }

  /**
   * スキル使用処理
   */
  private static resolveSkills(gameState: GameState, actions: PlayerAction[]): void {
    const skillActions = actions.filter(a => a.actionType === 'skill');

    for (const action of skillActions) {
      const character = this.findCharacter(gameState, action.characterId);
      if (!character || !character.alive || !action.skillType) continue;

      const skill = character.skills[action.skillType];

      // クールダウンチェック
      if (skill.currentCooldown > 0) {
        console.log(`[RoundManager] ${character.name}'s ${action.skillType} skill is on cooldown`);
        continue;
      }

      // スキル使用
      console.log(`[RoundManager] ${character.name} used ${action.skillType} skill`);
      skill.currentCooldown = skill.cooldown;

      // スキル効果の適用
      // ※ 実装は後続
    }
  }

  /**
   * アイテム購入処理
   */
  private static resolveItemPurchases(gameState: GameState, actions: PlayerAction[]): void {
    const purchaseActions = actions.filter(a => a.actionType === 'item_purchase');

    for (const action of purchaseActions) {
      const character = this.findCharacter(gameState, action.characterId);
      if (!character || !action.itemName) continue;

      // アイテム購入は Character システムで実装済み
      // ここでは呼び出しのみ
    }
  }

  /**
   * ミニオンのスポーン
   */
  private static spawnMinions(gameState: GameState): void {
    const config = ConfigLoader.get();

    // スポーン頻度チェック
    if (gameState.round % config.minion_system.spawn_frequency !== 0) {
      return;
    }

    const lanes = ['TOP', 'MID', 'BOT'];

    for (const lane of lanes) {
      // ブルーチームのミニオン
      gameState.minions.push({
        id: `blue_${lane}_${gameState.round}`,
        team: 'blue',
        lane,
        hp: config.minion_system.minion_hp,
        position: 0
      });

      // レッドチームのミニオン
      gameState.minions.push({
        id: `red_${lane}_${gameState.round}`,
        team: 'red',
        lane,
        hp: config.minion_system.minion_hp,
        position: 0
      });
    }

    console.log(`[RoundManager] Spawned minions for round ${gameState.round}`);
  }

  /**
   * ミニオン処理
   */
  private static processMinions(gameState: GameState): void {
    // ミニオンの移動
    for (const minion of gameState.minions) {
      minion.position += 1;
    }

    // ミニオンvsミニオン
    // ミニオンvsタワー
    // ※ 実装は後続
  }

  /**
   * タワー攻撃処理
   */
  private static processTowerAttacks(gameState: GameState): void {
    const config = ConfigLoader.get();

    for (const tower of gameState.towers) {
      if (tower.destroyed) continue;

      // タワー範囲内の敵を攻撃
      const towerDamage = config.tower_system.tower_defense.damage_per_turn;

      // ※ 実装は後続
    }
  }

  /**
   * オブジェクトの更新
   */
  private static updateObjects(gameState: GameState): void {
    for (const obj of gameState.objects) {
      if (!obj.available && obj.respawnTimer > 0) {
        obj.respawnTimer -= 1;

        if (obj.respawnTimer === 0) {
          obj.available = true;
          obj.hp = obj.maxHp;
          console.log(`[RoundManager] ${obj.type} has respawned`);
        }
      }
    }

    // ジャングルバフのリスポーン
    for (const buff of gameState.jungleBuffs) {
      if (!buff.available && buff.respawnTimer > 0) {
        buff.respawnTimer -= 1;

        if (buff.respawnTimer === 0) {
          buff.available = true;
          console.log(`[RoundManager] ${buff.type} buff has respawned`);
        }
      }
    }
  }

  /**
   * 経験値更新
   */
  private static updateExperience(gameState: GameState): void {
    const allCharacters = [...gameState.teams.blue, ...gameState.teams.red];

    for (const character of allCharacters) {
      // パッシブ経験値獲得
      // ※ 実装は後続
    }
  }

  /**
   * キャラクターを検索
   */
  private static findCharacter(gameState: GameState, characterId: string): Character | null {
    const allCharacters = [...gameState.teams.blue, ...gameState.teams.red];
    return allCharacters.find(c => c.id === characterId) || null;
  }
}
