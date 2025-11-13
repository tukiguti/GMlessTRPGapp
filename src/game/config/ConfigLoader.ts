import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { GameConfig, RoleType, CharacterStats, ItemStats } from './types';

export class ConfigLoader {
  private static instance: GameConfig | null = null;
  private static configPath = path.join(__dirname, '../../../config/game_balance.yaml');

  /**
   * 設定ファイルを読み込む（キャッシュあり）
   */
  static load(): GameConfig {
    if (this.instance) {
      return this.instance;
    }

    console.log('[ConfigLoader] Loading config from:', this.configPath);

    try {
      const fileContents = fs.readFileSync(this.configPath, 'utf8');
      this.instance = yaml.load(fileContents) as GameConfig;

      // 妥当性検証
      this.validate(this.instance);

      console.log('[ConfigLoader] Config loaded successfully');
      return this.instance;
    } catch (error) {
      console.error('[ConfigLoader] Failed to load config:', error);
      throw new Error(`Failed to load game configuration: ${error}`);
    }
  }

  /**
   * 設定をリロード（開発時・バランス調整時）
   */
  static reload(): GameConfig {
    console.log('[ConfigLoader] Reloading config...');
    this.instance = null;
    return this.load();
  }

  /**
   * 設定の妥当性を検証
   */
  private static validate(config: GameConfig): void {
    // 必須フィールドの存在確認
    if (!config.character_initial_stats) {
      throw new Error('Missing character_initial_stats');
    }
    if (!config.leveling_system) {
      throw new Error('Missing leveling_system');
    }

    // 数値の範囲チェック
    const maxLevel = config.leveling_system.max_level;
    if (maxLevel < 1 || maxLevel > 100) {
      throw new Error(`Invalid max_level: ${maxLevel}`);
    }

    console.log('[ConfigLoader] Config validation passed');
  }

  /**
   * 特定の設定を取得
   */
  static get(): GameConfig {
    if (!this.instance) {
      return this.load();
    }
    return this.instance;
  }

  /**
   * キャラクターの初期ステータスを取得
   */
  static getCharacterStats(role: string): CharacterStats {
    const config = this.get();
    const stats = config.character_initial_stats[role as RoleType];
    if (!stats) {
      throw new Error(`Unknown role: ${role}`);
    }
    return stats;
  }

  /**
   * レベルアップに必要なターン数を取得
   */
  static getLevelUpTurns(level: number): number {
    const config = this.get();
    return config.leveling_system.level_up_turns[level] || 0;
  }

  /**
   * 成長率を取得
   */
  static getGrowthStats(role: string): CharacterStats {
    const config = this.get();
    const growth = config.leveling_system.growth_per_level[role as RoleType];
    if (!growth) {
      throw new Error(`Unknown role: ${role}`);
    }
    return growth;
  }

  /**
   * アイテム情報を取得
   */
  static getItemStats(itemName: string): ItemStats | null {
    const config = this.get();
    return config.basic_items[itemName] || config.advanced_items[itemName] || null;
  }
}
