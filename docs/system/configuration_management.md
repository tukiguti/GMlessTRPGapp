# 設定管理設計

## 概要

ゲームバランス調整を簡単にするための設定管理システムの設計。ターン数、ステータス、ダメージ計算など、バランス調整が必要な値を外部ファイルで管理し、コードを変更せずに調整可能にする。

---

## 設計原則

### 1. **設定とコードの分離**
- すべてのバランス調整値は `config/game_balance.yaml` に集約
- コード内にマジックナンバーを含めない
- 設定変更時にコードの再コンパイル不要

### 2. **可読性と保守性**
- YAML形式で人間が読みやすい
- コメントで各設定の意味を明記
- 階層構造で論理的に整理

### 3. **型安全性**
- TypeScript型定義を自動生成
- 設定の妥当性を検証
- 実行時エラーを防止

---

## 設定ファイル構造

### 既存の config/game_balance.yaml

現在の設定ファイルは以下のセクションで構成されています：

```yaml
# 1. キャラクター初期ステータス (レベル1)
character_initial_stats:
  ad_marksman: { hp: 400, attack: 2, ... }
  ad_fighter: { hp: 600, attack: 3, ... }
  # ...

# 2. レベルアップシステム
leveling_system:
  max_level: 18
  level_up_turns: { ... }
  growth_per_level: { ... }

# 3. 戦闘システムの基本定数
combat_system:
  damage_multiplier: 10
  death_penalty: { ... }
  cc: { ... }

# 4. 戦闘時の補正値
combat_modifiers:
  gank: { ... }
  positioning: { ... }
  numerical_advantage: { ... }
  # ※ フェーズ補正、ロール相性補正は削除済み

# 5. スキルシステム
skill_system:
  normal_skills: { ... }
  ult_skills: { ... }

# 6. タワーシステム
tower_system:
  hp: { ... }
  damage_to_tower: { ... }

# 7. ミニオンシステム
minion_system:
  spawn_frequency: 3
  minion_hp: 3
  # ...

# 8. ゴールド獲得システム
gold_system:
  farming: 100
  attack_only: 50
  # ...

# 9. ジャングルバフ
jungle_buffs:
  red_buff: { ... }
  blue_buff: { ... }

# 10. オブジェクトシステム
objects:
  dragon_common: { ... }
  dragon_types: { ... }
  baron: { ... }
  herald: { ... }

# 11. アイテムシステム（基本アイテム）
basic_items:
  long_sword: { cost: 350, attack: 1.0 }
  # ...

# 12. アイテムシステム（上位アイテム）
advanced_items:
  infinity_edge: { cost: 1450, attack: 3.5, ... }
  # ...

# 13. 時間管理システム
time_system:
  turn_duration_seconds: 10
  max_game_turns: 120
  phases: { ... }

# 14. バランス調整のヒント（コメント）
```

---

## TypeScript型定義

### 1. 型定義ファイルの生成

設定ファイルに対応するTypeScript型を定義します。

```typescript
// src/game/config/types.ts

// ========================================
// キャラクターステータス
// ========================================
export interface CharacterStats {
  hp: number;
  attack: number;
  defense: number;
  mobility: number;
  utility: number;
}

export type RoleType =
  | 'ad_marksman'
  | 'ad_fighter'
  | 'ad_assassin'
  | 'ad_tank'
  | 'ap_mage'
  | 'ap_assassin'
  | 'ap_fighter'
  | 'ap_tank'
  | 'ap_support'
  | 'tank_support';

// ========================================
// レベリングシステム
// ========================================
export interface LevelingSystem {
  max_level: number;
  level_up_turns: Record<number, number>;
  growth_per_level: Record<RoleType, CharacterStats>;
}

// ========================================
// 戦闘システム
// ========================================
export interface CombatSystem {
  damage_multiplier: number;
  death_penalty: {
    respawn_time_base: number;
    respawn_time_per_level: number;
    gold_loss_percentage: number;
    exp_bonus_to_killer: number;
  };
  cc: {
    success_threshold: number;
    escape_threshold: number;
    normal_skill_penalty: number;
    ult_skill_penalty: number;
  };
}

// ========================================
// 戦闘補正
// ========================================
export interface CombatModifiers {
  gank: {
    no_vision_bonus: number;
    mobility_threshold: number;
  };
  positioning: {
    frontline_penalty: number;
    backline_vs_assassin_penalty: number;
  };
  numerical_advantage: Record<string, number>;
}

// ========================================
// スキルシステム
// ========================================
export interface SkillConfig {
  bonus?: number;
  penalty?: number;
  penalty_to_target?: number;
  cooldown: number;
  duration?: number;
  success_threshold?: number;
}

export interface SkillSystem {
  normal_skills: {
    damage: SkillConfig;
    cc: SkillConfig;
    buff: SkillConfig;
    debuff: SkillConfig;
  };
  ult_skills: {
    damage: SkillConfig;
    cc: SkillConfig;
    buff: SkillConfig;
    debuff: SkillConfig;
  };
}

// ========================================
// タワーシステム
// ========================================
export interface TowerSystem {
  hp: {
    outer_tower: number;
    inner_tower: number;
    nexus_tower: number;
    nexus: number;
  };
  damage_to_tower: {
    player_base_dice: string;
    minion_base_dice: string;
    minion_bonus_damage: number;
  };
  tower_defense: {
    damage_per_turn: number;
  };
}

// ========================================
// アイテムシステム
// ========================================
export interface ItemStats {
  cost: number;
  hp?: number;
  attack?: number;
  defense?: number;
  mobility?: number;
  utility?: number;
  // 特殊効果
  critical_threshold?: number;
  critical_multiplier?: number;
  armor_pen?: number;
  armor_reduction_percent?: number;
  // ...
}

// ========================================
// メイン設定型
// ========================================
export interface GameConfig {
  character_initial_stats: Record<RoleType, CharacterStats>;
  leveling_system: LevelingSystem;
  combat_system: CombatSystem;
  combat_modifiers: CombatModifiers;
  skill_system: SkillSystem;
  tower_system: TowerSystem;
  minion_system: {
    spawn_frequency: number;
    minion_hp: number;
    last_hit_gold: number;
    last_hit_exp: number;
  };
  gold_system: Record<string, number>;
  jungle_buffs: {
    red_buff: {
      attack_bonus: number;
      slow_effect: number;
      duration: number;
      gold_reward: number;
      respawn_time: number;
    };
    blue_buff: {
      utility_bonus: number;
      cooldown_reduction: number;
      cooldown_minimum: number;
      duration: number;
      gold_reward: number;
      respawn_time: number;
    };
  };
  objects: any; // TODO: 詳細な型定義
  basic_items: Record<string, ItemStats>;
  advanced_items: Record<string, ItemStats>;
  time_system: {
    turn_duration_seconds: number;
    max_game_turns: number;
    phases: any;
  };
}
```

---

## 設定読み込みシステム

### 1. ConfigLoader の実装

```typescript
// src/game/config/ConfigLoader.ts
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { GameConfig } from './types';

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

    // その他の妥当性チェック...
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
    const stats = config.character_initial_stats[role as keyof typeof config.character_initial_stats];
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
    const growth = config.leveling_system.growth_per_level[role as keyof typeof config.leveling_system.growth_per_level];
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
```

---

## 使用例

### 1. キャラクター初期化

```typescript
// src/game/systems/character.ts
import { ConfigLoader } from '../config/ConfigLoader';

export class Character {
  hp: number;
  attack: number;
  defense: number;
  mobility: number;
  utility: number;
  level: number = 1;

  constructor(public role: string) {
    // 設定ファイルから初期ステータスを読み込む
    const initialStats = ConfigLoader.getCharacterStats(role);

    this.hp = initialStats.hp;
    this.attack = initialStats.attack;
    this.defense = initialStats.defense;
    this.mobility = initialStats.mobility;
    this.utility = initialStats.utility;
  }

  levelUp() {
    const growth = ConfigLoader.getGrowthStats(this.role);

    this.hp += growth.hp;
    this.attack += growth.attack;
    this.defense += growth.defense;
    this.mobility += growth.mobility;
    this.utility += growth.utility;
    this.level += 1;
  }
}
```

### 2. ダメージ計算

```typescript
// src/game/systems/damage.ts
import { ConfigLoader } from '../config/ConfigLoader';

export function calculateDamage(
  attackerScore: number,
  defenderScore: number,
  defenderDefense: number
): number {
  const config = ConfigLoader.get();
  const multiplier = config.combat_system.damage_multiplier;

  const difference = attackerScore - defenderScore;
  const rawDamage = difference * multiplier;
  const finalDamage = rawDamage - defenderDefense;

  return Math.max(0, finalDamage);
}
```

### 3. リスポーン時間計算

```typescript
// src/game/systems/death.ts
import { ConfigLoader } from '../config/ConfigLoader';

export function calculateRespawnTime(level: number): number {
  const config = ConfigLoader.get();
  const base = config.combat_system.death_penalty.respawn_time_base;
  const perLevel = config.combat_system.death_penalty.respawn_time_per_level;

  return base + level * perLevel;
}
```

### 4. アイテム購入

```typescript
// src/game/systems/items.ts
import { ConfigLoader } from '../config/ConfigLoader';
import { Character } from './character';

export function purchaseItem(character: Character, itemName: string): boolean {
  const itemStats = ConfigLoader.getItemStats(itemName);

  if (!itemStats) {
    console.error(`Item not found: ${itemName}`);
    return false;
  }

  // ゴールドチェック
  if (character.gold < itemStats.cost) {
    return false;
  }

  // アイテム購入
  character.gold -= itemStats.cost;

  // ステータス適用
  if (itemStats.hp) character.hp += itemStats.hp;
  if (itemStats.attack) character.attack += itemStats.attack;
  if (itemStats.defense) character.defense += itemStats.defense;
  if (itemStats.mobility) character.mobility += itemStats.mobility;
  if (itemStats.utility) character.utility += itemStats.utility;

  return true;
}
```

---

## バランス調整ワークフロー

### 開発環境での調整

1. **設定ファイルを編集**
   ```bash
   # config/game_balance.yaml を編集
   vim config/game_balance.yaml
   ```

2. **サーバーを再起動（またはホットリロード）**
   ```bash
   npm run dev
   ```

3. **テストプレイ**
   - ブラウザでゲームをプレイ
   - バランスを確認

4. **調整を繰り返す**
   - 設定を微調整
   - 再度テスト

### ホットリロード機能（開発用）

```typescript
// src/server/api/admin.ts
import express from 'express';
import { ConfigLoader } from '../game/config/ConfigLoader';

const router = express.Router();

// 管理者専用: 設定リロード
router.post('/admin/reload-config', (req, res) => {
  try {
    const newConfig = ConfigLoader.reload();
    res.json({ success: true, message: 'Config reloaded' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

---

## バリデーションシステム

### 設定値の妥当性チェック

```typescript
// src/game/config/Validator.ts
import { GameConfig } from './types';

export class ConfigValidator {
  static validate(config: GameConfig): ValidationResult {
    const errors: string[] = [];

    // 1. キャラクターステータスの検証
    for (const [role, stats] of Object.entries(config.character_initial_stats)) {
      if (stats.hp <= 0) {
        errors.push(`${role}: HP must be positive`);
      }
      if (stats.attack < 0) {
        errors.push(`${role}: Attack must be non-negative`);
      }
    }

    // 2. レベルシステムの検証
    const maxLevel = config.leveling_system.max_level;
    const levelUpTurns = config.leveling_system.level_up_turns;

    for (let level = 2; level <= maxLevel; level++) {
      if (!levelUpTurns[level]) {
        errors.push(`Missing level_up_turns for level ${level}`);
      }
    }

    // 3. ダメージ計算の検証
    if (config.combat_system.damage_multiplier <= 0) {
      errors.push('damage_multiplier must be positive');
    }

    // 4. アイテムコストの検証
    for (const [itemName, item] of Object.entries(config.basic_items)) {
      if (item.cost <= 0) {
        errors.push(`${itemName}: cost must be positive`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

---

## 環境別設定

### 開発環境・本番環境で異なる設定

```typescript
// src/game/config/ConfigLoader.ts（拡張版）
export class ConfigLoader {
  private static getConfigPath(): string {
    const env = process.env.NODE_ENV || 'development';

    switch (env) {
      case 'production':
        return path.join(__dirname, '../../../config/game_balance.yaml');
      case 'test':
        return path.join(__dirname, '../../../config/game_balance.test.yaml');
      default:
        return path.join(__dirname, '../../../config/game_balance.yaml');
    }
  }

  static load(): GameConfig {
    const configPath = this.getConfigPath();
    // ...
  }
}
```

### テスト用設定

```yaml
# config/game_balance.test.yaml
# テスト用の簡略化された設定
character_initial_stats:
  ad_marksman:
    hp: 100
    attack: 10
    defense: 5
    mobility: 5
    utility: 5

leveling_system:
  max_level: 5
  level_up_turns:
    2: 2
    3: 5
    4: 9
    5: 14
```

---

## 設定のバージョン管理

### 設定変更履歴の管理

```yaml
# config/game_balance.yaml
# ========================================
# バージョン情報
# ========================================
config_version: "1.2.0"
last_updated: "2025-11-11"

# 変更履歴
# v1.2.0 (2025-11-11):
#   - フェーズ補正を削除
#   - ロール相性補正を削除
# v1.1.0 (2025-11-10):
#   - ミニオンシステムを追加
# v1.0.0 (2025-11-07):
#   - 初版
```

### Git での管理

```bash
# 設定変更をコミット
git add config/game_balance.yaml
git commit -m "Balance: Increase Marksman late-game attack growth from 0.6 to 0.7"
```

---

## パフォーマンス最適化

### 1. 設定のキャッシング

```typescript
// ConfigLoaderは初回読み込み後にキャッシュ
// 毎回ファイルを読み込まない
static load(): GameConfig {
  if (this.instance) {
    return this.instance; // キャッシュされた設定を返す
  }
  // ファイル読み込み
}
```

### 2. プリコンパイル（オプション）

YAMLをJSONに変換してパフォーマンス向上：

```bash
# ビルド時にYAML → JSONに変換
node scripts/convert-config.js
```

```typescript
// src/game/config/ConfigLoader.ts
static load(): GameConfig {
  // 本番環境ではJSONを読み込む（高速）
  const configPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../../../config/game_balance.json')
    : path.join(__dirname, '../../../config/game_balance.yaml');

  // ...
}
```

---

## まとめ

### 設定管理の利点

1. **コード変更不要**: バランス調整時にコードを触らない
2. **可読性**: YAML形式で人間が読みやすい
3. **型安全**: TypeScriptで型チェック
4. **バージョン管理**: Gitで変更履歴を追跡
5. **テスト容易**: テスト用設定を簡単に作成

### 開発フロー

```
設計 → 実装 → テストプレイ → バランス調整（YAML編集） → 再テスト → リリース
             ↑_______________|
```

---

## 変更履歴

- 2025-11-11: 初版作成
