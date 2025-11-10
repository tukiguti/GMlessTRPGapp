# ゲームバランス設定ファイル

このディレクトリには、ゲームの数値バランスを調整するための設定ファイルが含まれています。

## ファイル一覧

### `game_balance.yaml`

ゲーム内のすべての調整可能な数値パラメータを一元管理するファイルです。

## 使い方

### 1. 基本的な使い方

1. `game_balance.yaml` をテキストエディタで開く
2. 調整したい数値を変更する
3. ファイルを保存する
4. ゲームを再起動または設定を再読み込み

### 2. 数値の調整例

#### 例1: ゲームスピードを速くする

```yaml
# レベルアップを早める
leveling_system:
  level_up_turns:
    2: 3    # 元: 5
    3: 7    # 元: 11
    # ... 以降も同様に減らす

# ゴールド獲得を増やす
gold_system:
  farming: 150     # 元: 100
  kill: 400        # 元: 300
```

#### 例2: タンクを強化する

```yaml
# タンクロールの初期ステータスを強化
character_initial_stats:
  ad_tank:
    hp: 700        # 元: 650
    defense: 6     # 元: 5

# タンクの成長率を上げる
leveling_system:
  growth_per_level:
    ad_tank:
      hp: 100      # 元: 90
      defense: 0.6 # 元: 0.5
```

#### 例3: オブジェクトの価値を高める

```yaml
# ドラゴンの効果を強化
objects:
  dragon_types:
    infernal:
      attack_bonus: 2.0  # 元: 1.5
    mountain:
      defense_bonus: 2.0 # 元: 1.5

# バロンバフを強化
  baron:
    buff_effects:
      attack_bonus: 4.0  # 元: 3.0
      buff_duration: 24  # 元: 18
```

#### 例4: スキルの重要性を高める

```yaml
# スキルボーナスを増やす
skill_system:
  normal_skills:
    damage:
      bonus: 5     # 元: 3
  ult_skills:
    damage:
      bonus: 9     # 元: 6
```

### 3. バランス調整のワークフロー

1. **プレイテスト**: 実際にゲームをプレイして問題点を洗い出す
2. **問題の特定**: 「タンクが弱すぎる」「試合時間が長すぎる」など
3. **数値の調整**: `game_balance.yaml` で該当する数値を変更
4. **再テスト**: 調整後のバランスを確認
5. **繰り返し**: 満足のいくバランスになるまで 1-4 を繰り返す

### 4. よくあるバランス問題と対処法

| 問題 | 調整箇所 | 方向性 |
|------|---------|--------|
| 試合時間が長すぎる | `leveling_system.level_up_turns` | 必要ターン数を減らす |
| | `gold_system` | ゴールド獲得量を増やす |
| | `tower_system.hp` | タワーHPを減らす |
| 試合時間が短すぎる | 上記の逆 | 上記の逆方向に調整 |
| 特定ロールが強すぎる | `character_initial_stats` | 該当ロールのステータスを下げる |
| | `leveling_system.growth_per_level` | 該当ロールの成長率を下げる |
| スキルの価値が低い | `skill_system` | スキルボーナスを増やす |
| オブジェクトの価値が低い | `objects` | 報酬やバフ効果を増やす |
| アイテムが高すぎて買えない | `advanced_items` | コストを下げる |
| | `gold_system` | ゴールド獲得量を増やす |
| タワーが硬すぎる | `tower_system.hp` | HPを減らす |
| ミニオンの価値が低い | `minion_system.last_hit_gold` | ゴールドを増やす |

### 5. バックアップの取り方

調整前に必ずバックアップを取ることをお勧めします。

```bash
# バックアップコピーを作成
cp config/game_balance.yaml config/game_balance_backup_$(date +%Y%m%d).yaml

# 例: game_balance_backup_20251110.yaml
```

### 6. デフォルト設定への戻し方

git を使っている場合:

```bash
# 最新のコミット状態に戻す
git checkout config/game_balance.yaml
```

または、バックアップから復元:

```bash
cp config/game_balance_backup_YYYYMMDD.yaml config/game_balance.yaml
```

## 設定セクションの説明

### 主要セクション

1. **character_initial_stats**: キャラクターの初期ステータス（レベル1時）
2. **leveling_system**: レベルアップに関する設定
3. **combat_system**: 戦闘システムの基本定数
4. **combat_modifiers**: 戦闘時の各種補正値
5. **skill_system**: スキルの効果とクールダウン
6. **tower_system**: タワーのHP、ダメージ
7. **minion_system**: ミニオンの設定
8. **gold_system**: ゴールド獲得量
9. **jungle_buffs**: 赤/青バフの効果
10. **objects**: ドラゴン、バロン、ヘラルドの設定
11. **basic_items**: 基本アイテムの価格と効果
12. **advanced_items**: 上位アイテムの価格と効果
13. **time_system**: 時間管理とゲームフェーズ

## 注意事項

- **バランス調整は慎重に**: 小さな変更でも大きな影響を与えることがあります
- **複数箇所を同時に変更しない**: 変更の影響を把握しにくくなります
- **記録を取る**: どの数値をどう変更したか記録しておくと良いです
- **プレイテストは必須**: 理論上良さそうでも実際にプレイすると問題が出ることがあります

## フィードバック

バランス調整の結果や提案があれば、プロジェクトのIssueやDiscussionsで共有してください！
