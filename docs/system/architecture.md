# システムアーキテクチャ設計

## 概要

GMレスLoL風TRPGをWebアプリケーションとして実装するための、システムアーキテクチャ設計書。

**採用構成**: GCP Compute Engine e2-micro（永続的無料枠）+ Vercel（フロントエンド）+ 外部マネージドサービス

**GCP e2-micro 無料枠の制限:**
- **メモリ**: 1GB RAM
- **CPU**: 0.25〜1 vCPU（共有、バースト可能）
- **ストレージ**: 30GB 標準永続ディスク
- **ネットワーク**: 1GB/月（無料）
- **リージョン**: us-west1, us-central1, us-east1のみ

---

## アーキテクチャパターン

### 採用パターン: **フロントエンド分離型 + マネージドサービス活用**

```
┌─────────────────────────────────────────────────────────┐
│           Vercel (フロントエンド配信)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │ React SPA                                         │  │
│  │  - UI表示、ユーザー入力受付                        │  │
│  │  - リアルタイム更新表示                            │  │
│  │  - 静的ファイル配信                                │  │
│  │  無料: 100GB/月の帯域幅                            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↕ HTTPS (WebSocket / REST API)
┌─────────────────────────────────────────────────────────┐
│        GCP Compute Engine e2-micro (us-west1)           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Nginx (リバースプロキシ)                           │  │
│  │  - メモリ使用: 10-20MB                             │  │
│  │  - gzip圧縮、レート制限                            │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Node.js サーバー (PM2管理)                         │  │
│  │  - メモリ使用: 200-300MB                           │  │
│  │  - Express REST API                               │  │
│  │  - Socket.IO WebSocket                            │  │
│  │  - ゲームロジック層                                │  │
│  │  - データアクセス層                                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  合計メモリ使用: 約250-350MB (1GB以内)                  │
│  ネットワーク: 1GB/月以内に最適化                       │
└─────────────────────────────────────────────────────────┘
                        ↕ SSL
┌─────────────────────────────────────────────────────────┐
│           Supabase (外部PostgreSQL)                      │
│  - 無料: 500MB ストレージ                                │
│  - 無料: 2GB/月 転送量                                   │
│  - ゲームセッション、プレイヤー、履歴データ               │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│           Upstash Redis (外部キャッシュ)                 │
│  - 無料: 256MB メモリ                                   │
│  - 無料: 10,000コマンド/日                               │
│  - セッションキャッシュ、リアルタイムゲーム状態           │
└─────────────────────────────────────────────────────────┘
```

### 設計方針

1. **フロントエンドとバックエンドの完全分離**
   - フロントエンド: Vercel（無料100GB/月）で配信
   - バックエンド: GCP e2-microでAPIとWebSocketのみ提供
   - 静的ファイルをGCPで配信せず、ネットワーク転送量を削減

2. **外部マネージドサービスの活用**
   - PostgreSQL: Supabase（無料500MB、2GB/月転送）
   - Redis: Upstash（無料256MB、10,000コマンド/日）
   - GCPインスタンスのメモリ負荷を大幅に軽減

3. **メモリ使用量の最適化（1GB以内）**
   - システムメモリ: 150-200MB
   - Nginx: 10-20MB
   - Node.jsサーバー: 200-300MB
   - バッファ・予備: 250-400MB

4. **ネットワーク転送量の削減（1GB/月以内）**
   - WebSocketメッセージを最小化（差分のみ送信）
   - gzip圧縮を有効化
   - レート制限を実装
   - 同時接続数を70以内に制限

---

## レイヤー設計

### 1. クライアント層 (Frontend - Vercel)

#### デプロイ環境
- **ホスティング**: Vercel（無料100GB/月帯域幅）
- **フレームワーク**: React SPA
- **ビルド**: Vite / Next.js

#### 責務
- ゲーム画面のレンダリング
- ユーザー入力（行動選択、移動、アイテム購入など）
- リアルタイムゲーム状態の表示
- アニメーション・エフェクト
- **静的ファイル配信（GCPの負荷を軽減）**

#### 主要コンポーネント
```
src/client/
├── components/          # UIコンポーネント
│   ├── GameBoard/      # ゲーム盤面
│   ├── CharacterCard/  # キャラクター情報
│   ├── ActionPanel/    # 行動選択パネル
│   ├── Shop/           # アイテムショップ
│   └── GameLog/        # ゲームログ
├── stores/             # 状態管理 (Zustand/Redux)
│   ├── gameState.ts
│   ├── playerState.ts
│   └── uiState.ts
├── services/           # API通信
│   ├── api.ts
│   └── websocket.ts
└── utils/              # ユーティリティ
    ├── animations.ts
    └── formatters.ts
```

#### 通信方式
- **WebSocket**: リアルタイムゲーム状態更新（差分のみ）、プレイヤー行動通知
- **REST API**: ゲーム作成、ユーザー登録、履歴取得
- **通信先**: GCP e2-micro バックエンド (https://your-domain.com/api)

---

### 2. サーバー層 (Backend - GCP e2-micro)

#### デプロイ環境
- **ホスティング**: GCP Compute Engine e2-micro (us-west1)
- **OS**: Ubuntu 22.04 LTS
- **ランタイム**: Node.js 20 LTS
- **プロセス管理**: PM2（シングルプロセスモード）
- **リバースプロキシ**: Nginx

#### メモリ最適化設定
```bash
# Node.js のヒープメモリを制限
node --max-old-space-size=384 dist/index.js

# PM2経由で起動する場合
pm2 start dist/index.js \
  --name trpg-backend \
  --max-memory-restart 400M \
  --node-args="--max-old-space-size=384"
```

#### 2-1. APIサーバー

**責務**: クライアントとの通信、セッション管理、ゲームロジック実行

**メモリ使用量**: 200-300MB

```
src/server/
├── api/                # REST APIエンドポイント
│   ├── game.ts         # ゲーム作成・参加
│   ├── player.ts       # プレイヤー管理
│   └── history.ts      # 履歴・統計
├── websocket/          # WebSocketハンドラー
│   ├── connection.ts   # 接続管理（最大70接続）
│   ├── actions.ts      # 行動送信
│   └── events.ts       # イベント配信（差分のみ）
└── middleware/         # ミドルウェア
    ├── auth.ts         # 認証
    ├── validation.ts   # バリデーション
    ├── rateLimit.ts    # レート制限（1GB/月対策）
    └── errorHandler.ts # エラーハンドリング
```

#### 2-2. ゲームロジック層

**責務**: ゲームルールの実装、判定処理

```
src/game/
├── engine/             # ゲームエンジン
│   ├── GameEngine.ts   # メインエンジン
│   ├── RoundManager.ts # ラウンド管理
│   └── StateManager.ts # 状態管理
├── rules/              # ルール処理
│   ├── combat.ts       # 戦闘判定
│   ├── movement.ts     # 移動処理
│   ├── skills.ts       # スキル処理
│   └── items.ts        # アイテム効果
├── systems/            # システム
│   ├── matchup.ts      # マッチアップ判定
│   ├── damage.ts       # ダメージ計算
│   ├── tower.ts        # タワーシステム
│   ├── minion.ts       # ミニオンシステム
│   └── objectives.ts   # オブジェクトシステム
├── ai/                 # CPU AI (オプション)
│   ├── AIController.ts # AI制御
│   ├── strategies/     # 戦略パターン
│   └── difficulty.ts   # 難易度調整
└── config/             # 設定読み込み
    └── ConfigLoader.ts # YAML設定読み込み
```

#### 2-3. データアクセス層

**責務**: データベース操作の抽象化

```
src/database/
├── models/             # データモデル
│   ├── Game.ts
│   ├── Player.ts
│   ├── Character.ts
│   └── GameHistory.ts
├── repositories/       # リポジトリ
│   ├── GameRepository.ts
│   ├── PlayerRepository.ts
│   └── HistoryRepository.ts
└── migrations/         # マイグレーション
    └── *.sql
```

---

### 3. データ層（外部マネージドサービス）

#### 3-1. Supabase (外部PostgreSQL)

**無料枠**:
- **ストレージ**: 500MB
- **転送量**: 2GB/月
- **接続数**: 無制限（実質的には数百接続まで）

**保存データ**:
- ゲームセッション（現在進行中のゲーム）
- プレイヤープロフィール
- ゲーム履歴（リプレイ用）
- ランキング・統計データ

**接続方式**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
```

#### 3-2. Upstash Redis (外部キャッシュ)

**無料枠**:
- **メモリ**: 256MB
- **コマンド数**: 10,000コマンド/日
- **レイテンシ**: グローバル分散で低遅延

**保存データ**:
- アクティブゲームのリアルタイム状態（TTL: 2時間）
- WebSocketセッション管理（TTL: 1時間）
- 一時キャッシュ（設定データ、計算結果など）

**接続方式**:
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});
```

**キャッシュ戦略**:
```typescript
// LRUキャッシュでメモリ使用量を制限
const cache = new LRUCache({
  max: 500,              // 最大アイテム数
  maxSize: 50 * 1024 * 1024, // 50MB
  ttl: 1000 * 60 * 60,   // 1時間
  sizeCalculation: (value) => JSON.stringify(value).length
});
```

---

## 主要な設計パターン

### 1. **Repository パターン**
データアクセスロジックを抽象化し、ビジネスロジックから分離。

```typescript
interface GameRepository {
  create(game: Game): Promise<Game>;
  findById(id: string): Promise<Game | null>;
  update(game: Game): Promise<Game>;
  delete(id: string): Promise<void>;
}
```

### 2. **Strategy パターン**
CPU AIの難易度別戦略を実装。

```typescript
interface AIStrategy {
  selectAction(gameState: GameState, character: Character): Action;
}

class EasyAI implements AIStrategy { /* ... */ }
class MediumAI implements AIStrategy { /* ... */ }
class HardAI implements AIStrategy { /* ... */ }
```

### 3. **Observer パターン**
ゲーム状態の変更をクライアントに通知。

```typescript
class GameEngine {
  private observers: Observer[] = [];

  notify(event: GameEvent) {
    this.observers.forEach(obs => obs.update(event));
  }
}
```

### 4. **Command パターン**
プレイヤーの行動を統一的に処理。

```typescript
interface Command {
  execute(gameState: GameState): void;
  undo?(gameState: GameState): void;
}

class AttackCommand implements Command { /* ... */ }
class MoveCommand implements Command { /* ... */ }
```

---

## データフロー

### ゲーム開始時

```
1. クライアント → サーバー: ゲーム作成リクエスト (REST)
2. サーバー: ゲームセッション作成
3. サーバー → DB: ゲーム情報保存
4. サーバー → クライアント: ゲームID返却
5. クライアント → サーバー: WebSocket接続 (game_id)
6. サーバー: プレイヤー接続登録
```

### ラウンド進行時

```
[行動宣言フェーズ]
1. クライアント → サーバー: 行動宣言 (WebSocket)
2. サーバー: 全プレイヤーの宣言を待機
3. サーバー → 全クライアント: 行動宣言完了通知

[解決フェーズ]
4. サーバー: ゲームエンジンで行動解決
   - 移動処理
   - 戦闘判定
   - ダメージ計算
   - リソース獲得
   etc.
5. サーバー → DB: ゲーム状態保存
6. サーバー → 全クライアント: ゲーム状態更新 (WebSocket)
7. クライアント: UI更新・アニメーション表示
```

---

## リソース制限と最適化

### メモリ使用量管理（1GB以内）

```
┌─────────────────────────────────────────────────┐
│ システムメモリ                      約150-200MB │
│  - OS (Ubuntu 22.04)                           │
│  - カーネル、システムプロセス                    │
├─────────────────────────────────────────────────┤
│ Nginx                               約10-20MB  │
│  - リバースプロキシ、gzip圧縮                   │
├─────────────────────────────────────────────────┤
│ Node.js サーバー                    約200-300MB │
│  - Express + Socket.IO                         │
│  - ゲームロジック                               │
│  - メモリキャッシュ (50MB以内)                  │
├─────────────────────────────────────────────────┤
│ バッファ・予備                      約250-400MB │
│  - プロセスのバースト用                         │
└─────────────────────────────────────────────────┘
合計: 約600-750MB使用 (250-400MB余裕)
```

### ネットワーク転送量管理（1GB/月以内）

**1ゲームセッション（10ラウンド）の転送量**:
- WebSocket通信: 約180KB
- REST API通信: 約8.5KB
- gzip圧縮後: 約60-80KB

**月間の想定**:
- 1GB/月 ÷ 80KB = 約12,800ゲーム/月
- = 約425ゲーム/日
- = 約17ゲーム/時間

**同時接続数の制限**:
```typescript
const MAX_CONNECTIONS = 70; // メモリベースの試算による制限

io.use((socket, next) => {
  if (connectedClients >= MAX_CONNECTIONS) {
    return next(new Error('Server full'));
  }
  connectedClients++;
  next();
});
```

### CPU使用率管理

**GCP e2-micro CPU制限**:
- ベースライン: 25% CPU使用率
- バースト: 最大100%（短時間のみ）
- 持続的な高負荷（50%以上）は避ける

**最適化策**:
- 軽量なゲームロジック（O(n)またはO(log n)）
- キャッシュの活用（game_balance.yamlをメモリにキャッシュ）
- 非同期処理の活用（Promise.all）

### スケーラビリティ戦略

#### 無料枠を超えた場合の選択肢

**オプション1: GCP e2-small へアップグレード**
- メモリ: 2GB RAM
- CPU: 2 vCPU
- 料金: 約$15/月
- 同時接続: 100-150人

**オプション2: 複数インスタンスでロードバランシング**
- GCP e2-micro × 2
- ロードバランサー: $18/月
- 合計: $18/月
- 同時接続: 100-140人

**オプション3: マネージドサービスへ移行**
- Render Professional: $25/月 (2GB RAM)
- 管理不要、自動スケーリング

---

## セキュリティ設計

### 1. **チート防止**
- すべてのゲームロジックをサーバーサイドで実行
- クライアントはUIのみ（ダイスロール、判定はサーバー側）
- 行動宣言の妥当性チェック

### 2. **認証・認可**
- JWT認証（オプション）
- セッション管理
- レート制限（DDoS対策）

### 3. **データバリデーション**
- クライアントからの入力を厳格にバリデーション
- SQLインジェクション対策
- XSS対策

---

## パフォーマンス最適化

### 1. **リアルタイム通信最適化（ネットワーク転送量削減）**

**WebSocketメッセージの最小化**:
```typescript
// ❌ 悪い例: 全ゲーム状態を毎回送信
socket.emit('game_update', {
  gameId: 'xxx',
  round: 5,
  characters: [...], // すべてのキャラクター情報
  map: {...},        // マップ全体
  history: [...]     // 全履歴
});

// ✅ 良い例: 差分のみ送信
socket.emit('game_update', {
  round: 5,
  changes: {
    characters: [
      { id: 'char1', hp: 350 }, // 変更があったキャラのみ
      { id: 'char2', position: { x: 5, y: 3 } }
    ]
  }
});
```

**gzip圧縮の有効化**:
```nginx
# Nginx設定
gzip on;
gzip_types text/plain application/json application/javascript;
gzip_min_length 1000;
gzip_comp_level 6;
```

**WebSocketメッセージのバッチ処理**:
```typescript
// 100ms間に発生した更新をまとめて送信
const updateBatch = [];
setInterval(() => {
  if (updateBatch.length > 0) {
    socket.emit('batch_update', updateBatch);
    updateBatch.length = 0;
  }
}, 100);
```

### 2. **データベース最適化**
- インデックス設計（頻繁にアクセスされるカラム）
- クエリ最適化（N+1問題の回避）
- Supabaseのコネクションプーリング活用

### 3. **キャッシング（メモリ使用量制限）**

**メモリキャッシュ（50MB以内）**:
```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 500,                  // 最大アイテム数
  maxSize: 50 * 1024 * 1024, // 50MB
  ttl: 1000 * 60 * 60,       // 1時間
  sizeCalculation: (value) => JSON.stringify(value).length
});
```

**Upstash Redis キャッシュ**:
- ゲーム設定データ（game_balance.yaml）のキャッシュ
- アクティブゲームのリアルタイム状態（TTL: 2時間）
- 計算結果のキャッシュ

### 4. **レート制限（DDoS対策 & ネットワーク転送量削減）**
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 60 // 最大60リクエスト/分
});

app.use('/api/', apiLimiter);
```

---

## 監視・ログ

### 1. **ログ収集**
- アプリケーションログ（Winston/Pino）
- Nginxアクセスログ
- エラーログ
- **ログローテーション（ストレージ節約）**:
  ```bash
  # /etc/logrotate.d/trpg-app
  /var/log/trpg-app/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
  }
  ```

### 2. **メトリクス監視**

**メモリ使用量の監視**:
```bash
# メモリ使用量を定期的にチェック
watch -n 5 free -h

# PM2でメモリ使用量を監視
pm2 monit

# プロセス毎のメモリ使用量
ps aux --sort=-%mem | head -n 10
```

**ネットワーク転送量の監視**:
```bash
# vnStatでネットワーク使用量を追跡
sudo apt-get install vnstat
vnstat -m  # 月間使用量
vnstat -d  # 日別使用量
```

**監視項目**:
- アクティブゲーム数
- 接続プレイヤー数
- API応答時間
- CPU/メモリ使用率
- **ネットワーク転送量（月間1GB制限）**

### 3. **アラート**

**アラート設定**:
```bash
# 月末に近づいたら警告を出す
# crontab -e
0 0 * * * /home/ubuntu/check_bandwidth.sh
```

```bash
#!/bin/bash
# check_bandwidth.sh
USAGE=$(vnstat --json | jq -r '.interfaces[0].traffic.month[0].tx')
LIMIT=$((1 * 1024 * 1024 * 1024)) # 1GB

if [ $USAGE -gt $((LIMIT * 80 / 100)) ]; then
  echo "警告: ネットワーク使用量が80%を超えました" | mail -s "Alert" admin@example.com
fi
```

**アラート項目**:
- メモリ使用率が80%超過
- ネットワーク転送量が月間制限の80%超過
- エラー率の急増
- サーバーダウン
- データベース接続エラー

---

## デプロイメント

### 開発環境
- **ローカル開発**: Docker Compose（任意）
- **データベース**: Supabase（無料枠）
- **Redis**: Upstash（無料枠）
- **フロントエンド**: ローカル開発サーバー（Vite）

### 本番環境

#### フロントエンド (Vercel)
```bash
# Vercel CLI でデプロイ
npm install -g vercel
vercel --prod

# 環境変数
VITE_API_URL=https://your-domain.com
VITE_WS_URL=wss://your-domain.com
```

#### バックエンド (GCP e2-micro)

**システム要件**:
- **OS**: Ubuntu 22.04 LTS (最小インストール)
- **Node.js**: 20 LTS
- **Nginx**: 1.18+
- **PM2**: プロセス管理

**セットアップ**:
完全なセットアップスクリプトは `docs/system/gcp_deployment_setup.sh` を参照してください。

**環境変数（.env）**:
```bash
NODE_ENV=production
PORT=4000

# 外部サービス
DATABASE_URL=postgresql://[user]:[pass]@[supabase-host]:5432/[db]
REDIS_URL=rediss://default:[pass]@[upstash-host]:6379

# Supabase
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_KEY=[anon-key]

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://[endpoint].upstash.io
UPSTASH_REDIS_REST_TOKEN=[token]

# メモリ制限
NODE_OPTIONS=--max-old-space-size=384

# 同時接続数制限
MAX_CONNECTIONS=70
```

**PM2 起動設定**:
```bash
pm2 start dist/index.js \
  --name trpg-backend \
  --max-memory-restart 400M \
  --node-args="--max-old-space-size=384"
```

#### CI/CD
- **フロントエンド**: Vercel の自動デプロイ（Git連携）
- **バックエンド**: GitHub Actions（手動またはタグベース）

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy to GCP e2-micro

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GCP
        run: |
          # SSH経由でデプロイスクリプトを実行
          ssh user@gcp-instance 'cd /app && git pull && npm install && npm run build && pm2 restart trpg-backend'
```

---

## 今後の拡張性

### フェーズ1: MVP (最小機能)
- 1vs1対戦モード
- 基本的なゲームルール実装
- シンプルなUI

### フェーズ2: マルチプレイヤー
- 2-10人対戦
- チャット機能
- リプレイ機能

### フェーズ3: 高度な機能
- CPUモード（AI実装）
- ランクマッチ
- カスタムマッチ
- オブザーバーモード

### フェーズ4: ソーシャル機能
- フレンド機能
- ランキング
- トーナメント機能

---

## 変更履歴

- 2025-11-13: GCP e2-micro 最適化設計に基づいて全面改訂
  - アーキテクチャをフロントエンド分離型（Vercel）+ GCP e2-micro + 外部マネージドサービスに変更
  - データベースをSupabase（外部PostgreSQL）に変更
  - RedisをUpstash（外部キャッシュ）に変更
  - メモリ、CPU、ネットワーク、ストレージの制限を考慮した最適化設計を追加
  - リソース監視とアラート設定を追加
  - デプロイメント構成をGCP e2-micro向けに具体化
- 2025-11-11: 初版作成
