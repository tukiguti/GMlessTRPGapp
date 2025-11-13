# GCP e2-micro 最適化システム設計

## 概要

GCP Compute Engine e2-micro（永続的無料枠）の制限内で動作するように最適化された、GMレスLoL風TRPGのシステム設計。

**GCP e2-micro 無料枠の制限:**
- **メモリ**: 1GB RAM
- **CPU**: 0.25〜1 vCPU（共有、バースト可能）
- **ストレージ**: 30GB 標準永続ディスク
- **ネットワーク**: 1GB/月（無料）
- **リージョン**: us-west1, us-central1, us-east1のみ

---

## アーキテクチャ構成

### 全体構成

```
┌─────────────────────────────────────────────────────────┐
│           Vercel (フロントエンド配信)                     │
│  - React SPA                                            │
│  - 静的ファイル配信                                       │
│  - 無料: 100GB/月の帯域幅                                │
└─────────────────────────────────────────────────────────┘
                        ↕ HTTPS
┌─────────────────────────────────────────────────────────┐
│        GCP e2-micro (us-west1)                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Node.js サーバー (PM2管理)                         │  │
│  │  - メモリ使用: 200-300MB                           │  │
│  │  - Express REST API                               │  │
│  │  - Socket.IO WebSocket                            │  │
│  │  - ゲームロジック                                   │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Nginx (リバースプロキシ)                           │  │
│  │  - メモリ使用: 10-20MB                             │  │
│  │  - gzip圧縮                                        │  │
│  │  - レート制限                                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  合計メモリ使用: 約250-350MB (1GB以内)                  │
└─────────────────────────────────────────────────────────┘
                        ↕ SSL
┌─────────────────────────────────────────────────────────┐
│           Supabase (外部PostgreSQL)                      │
│  - 無料: 500MB ストレージ                                │
│  - 無料: 2GB/月 転送量                                   │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│           Upstash Redis (外部キャッシュ)                 │
│  - 無料: 256MB メモリ                                   │
│  - 無料: 10,000コマンド/日                               │
└─────────────────────────────────────────────────────────┘
```

### 設計方針

1. **フロントエンドとバックエンドの完全分離**
   - フロントエンド: Vercel（無料100GB/月）で配信
   - バックエンド: GCP e2-microでAPIとWebSocketのみ提供

2. **外部サービスの活用**
   - DB: Supabase（無料500MB、2GB/月転送）
   - Redis: Upstash（無料256MB、10,000コマンド/日）
   - これによりGCPインスタンスのメモリ負荷を軽減

3. **ネットワーク転送量の削減**
   - 静的ファイルは一切配信しない
   - WebSocketメッセージを最小化
   - gzip圧縮を有効化

---

## メモリ使用量の最適化

### メモリ配分計画（合計1GB）

```
┌─────────────────────────────────────────────────┐
│ システムメモリ                      約150-200MB │
│  - OS (Ubuntu 22.04)                           │
│  - カーネル、システムプロセス                    │
├─────────────────────────────────────────────────┤
│ Nginx                               約10-20MB  │
│  - リバースプロキシ                             │
│  - gzip圧縮                                     │
├─────────────────────────────────────────────────┤
│ Node.js サーバー                    約200-300MB │
│  - Express + Socket.IO                         │
│  - ゲームロジック                               │
│  - メモリキャッシュ (50MB以内)                  │
├─────────────────────────────────────────────────┤
│ バッファ・予備                      約250-400MB │
│  - プロセスのバースト用                         │
│  - システムキャッシュ                           │
└─────────────────────────────────────────────────┘
合計: 約600-750MB使用 (250-400MB余裕)
```

### Node.js メモリ制限設定

```bash
# Node.js のヒープメモリを制限
node --max-old-space-size=384 dist/index.js

# PM2経由で起動する場合
pm2 start dist/index.js \
  --name trpg-backend \
  --max-memory-restart 400M \
  --node-args="--max-old-space-size=384"
```

### メモリ使用量削減のベストプラクティス

1. **PostgreSQLを外部化（Supabase）**
   - PostgreSQLをGCPインスタンス内で動かすと300-500MB消費
   - Supabaseを使用することで、GCPインスタンスのメモリを節約

2. **Redisを外部化（Upstash）**
   - Redisをローカルで動かすと50-100MB消費
   - Upstashを使用することでメモリを節約

3. **軽量なNode.jsプロセス管理**
   - PM2をクラスターモードではなくシングルプロセスで起動
   - 不要なモジュールは読み込まない

4. **メモリキャッシュを制限**
   ```typescript
   // 最大50MBのメモリキャッシュ
   const cache = new LRUCache({
     max: 500, // 最大アイテム数
     maxSize: 50 * 1024 * 1024, // 50MB
     sizeCalculation: (value) => JSON.stringify(value).length
   });
   ```

5. **ストリーミング処理**
   - 大きなデータはストリーミングで処理
   - 一度に全データをメモリに読み込まない

---

## ネットワーク転送量の最適化（1GB/月以内）

### ネットワーク転送量の内訳

```
【1ゲームセッション（10ラウンド）の転送量】

WebSocket通信:
  - 初期接続: 1KB
  - ラウンド毎の行動宣言: 0.5KB × 5人 × 10ラウンド = 25KB
  - ラウンド毎のゲーム状態更新: 3KB × 5人 × 10ラウンド = 150KB
  - イベント通知: 0.2KB × 20回 = 4KB
  合計: 約180KB/ゲーム

REST API通信:
  - ゲーム作成: 1KB
  - ゲーム参加: 0.5KB × 5人 = 2.5KB
  - ゲーム終了時の履歴保存: 5KB
  合計: 約8.5KB/ゲーム

-----------------------------------------
1ゲームセッション合計: 約190KB
gzip圧縮後: 約60-80KB

【月間の想定】
1GB/月 ÷ 80KB = 約12,800ゲーム/月
= 約425ゲーム/日
= 約17ゲーム/時間

【同時接続数の試算】
1ゲーム = 平均2-5人、平均プレイ時間30-60分
同時進行ゲーム数: 10-20ゲーム
同時接続プレイヤー: 20-100人
```

### ネットワーク転送量削減のベストプラクティス

1. **フロントエンド資産をGCPで配信しない**
   ```
   ❌ 悪い例: GCPでフロントエンドも配信
   クライアント → GCP e2-micro
     - index.html: 10KB
     - bundle.js: 500KB ← これが致命的
     - styles.css: 50KB
     - 画像: 1MB

   ✅ 良い例: フロントエンドはVercelで配信
   クライアント → Vercel (100GB無料)
     - すべての静的ファイル

   クライアント → GCP e2-micro (1GB/月)
     - API とWebSocketのみ
   ```

2. **WebSocketメッセージの最小化**
   ```typescript
   // ❌ 悪い例: 全ゲーム状態を毎回送信
   socket.emit('game_update', {
     gameId: 'xxx',
     round: 5,
     phase: 'resolution',
     characters: [...], // すべてのキャラクター情報
     map: {...},       // マップ全体
     history: [...]    // 全履歴
   });

   // ✅ 良い例: 差分のみ送信
   socket.emit('game_update', {
     round: 5,
     phase: 'resolution',
     changes: {
       characters: [
         { id: 'char1', hp: 350 }, // 変更があったキャラのみ
         { id: 'char2', position: { x: 5, y: 3 } }
       ]
     }
   });
   ```

3. **gzip圧縮の有効化**
   ```nginx
   # Nginx設定
   gzip on;
   gzip_types text/plain application/json application/javascript;
   gzip_min_length 1000;
   gzip_comp_level 6;
   ```

4. **WebSocketメッセージのバッチ処理**
   ```typescript
   // 複数の小さなメッセージをまとめて送信
   const updateBatch = [];

   // 100ms間に発生した更新をまとめる
   setInterval(() => {
     if (updateBatch.length > 0) {
       socket.emit('batch_update', updateBatch);
       updateBatch.length = 0;
     }
   }, 100);
   ```

5. **レート制限の実装**
   ```typescript
   // プレイヤーからのメッセージ頻度を制限
   import rateLimit from 'express-rate-limit';

   const apiLimiter = rateLimit({
     windowMs: 1 * 60 * 1000, // 1分
     max: 60 // 最大60リクエスト/分
   });

   app.use('/api/', apiLimiter);
   ```

---

## CPU使用率の最適化

### CPU使用率の目安

```
GCP e2-micro:
  - ベースライン: 25% CPU使用率
  - バースト: 最大100%（短時間のみ）
  - 持続的な高負荷（50%以上）は避けるべき
```

### CPU使用率削減のベストプラクティス

1. **軽量なゲームロジック**
   - 複雑な計算を避ける
   - O(n²)のアルゴリズムを避け、O(n)またはO(log n)に最適化

2. **キャッシュの活用**
   ```typescript
   // game_balance.yamlの設定をメモリにキャッシュ
   class ConfigCache {
     private static config: GameConfig | null = null;

     static get(): GameConfig {
       if (!this.config) {
         this.config = ConfigLoader.load();
       }
       return this.config;
     }
   }
   ```

3. **非同期処理の活用**
   ```typescript
   // ブロッキングを避ける
   async function processGameRound(gameId: string) {
     const game = await GameRepository.findById(gameId);

     // 並行処理可能なタスクは Promise.all で実行
     await Promise.all([
       updateCharacterStats(game),
       updateMapState(game),
       processEvents(game)
     ]);

     await GameRepository.save(game);
   }
   ```

4. **インデックスの最適化**
   - データベースクエリを高速化
   - 頻繁にアクセスされるカラムにインデックスを作成

5. **重い処理の回避**
   - 画像処理、動画エンコーディングなどは行わない
   - 複雑なAIアルゴリズムは簡略化

---

## ストレージ使用量（30GB以内）

### ストレージ配分計画

```
┌─────────────────────────────────────────────────┐
│ OS + システムファイル               約5-8GB      │
│  - Ubuntu 22.04                                │
├─────────────────────────────────────────────────┤
│ Node.js + 依存関係                 約1-2GB      │
│  - Node.js 20                                  │
│  - npm パッケージ                               │
├─────────────────────────────────────────────────┤
│ アプリケーションコード             約100-200MB  │
│  - ビルド済みTypeScript                         │
│  - 設定ファイル                                 │
├─────────────────────────────────────────────────┤
│ ログファイル                       約1GB        │
│  - アプリケーションログ（ローテーション）        │
│  - Nginxアクセスログ                            │
├─────────────────────────────────────────────────┤
│ 予備                              約20GB       │
└─────────────────────────────────────────────────┘
合計: 約7-12GB使用 (18-23GB余裕)
```

**注意**: データベースはSupabaseを使用するため、GCPインスタンスのストレージは消費しない。

### ストレージ管理のベストプラクティス

1. **ログローテーション**
   ```bash
   # /etc/logrotate.d/trpg-app
   /var/log/trpg-app/*.log {
     daily
     rotate 7
     compress
     delaycompress
     missingok
     notifempty
     create 0644 ubuntu ubuntu
   }
   ```

2. **不要なファイルの削除**
   ```bash
   # 定期的にクリーンアップ
   npm cache clean --force
   apt-get autoremove -y
   apt-get clean
   ```

---

## 同時接続数の見積もり

### メモリベースの試算

```
Node.jsプロセスのメモリ: 300MB

1 WebSocket接続あたりのメモリ: 約2-3MB
  - Socket.IOオーバーヘッド: 1MB
  - ゲーム状態（キャッシュ）: 1-2MB

利用可能メモリ: 300MB - 50MB（基本メモリ） = 250MB
最大接続数: 250MB ÷ 2.5MB = 約100接続

実際の推奨接続数: 50-70接続（余裕を持たせる）
```

### 同時接続数の制限実装

```typescript
// Socket.IO接続数制限
import { Server } from 'socket.io';

const io = new Server(server, {
  maxHttpBufferSize: 1e6, // 1MB
  pingTimeout: 60000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  }
});

let connectedClients = 0;
const MAX_CONNECTIONS = 70;

io.use((socket, next) => {
  if (connectedClients >= MAX_CONNECTIONS) {
    return next(new Error('Server full'));
  }
  connectedClients++;
  next();
});

io.on('disconnect', () => {
  connectedClients--;
});
```

---

## デプロイメント構成

### システム要件

- **OS**: Ubuntu 22.04 LTS (最小インストール)
- **Node.js**: 20 LTS
- **Nginx**: 1.18+
- **PM2**: プロセス管理

### セットアップスクリプト

完全なセットアップスクリプトは `server_setup.sh` を参照してください。

### 環境変数

```bash
# .env
NODE_ENV=production
PORT=4000

# 外部サービス
DATABASE_URL=postgresql://[user]:[pass]@[supabase-host]:5432/[db]
REDIS_URL=rediss://default:[pass]@[upstash-host]:6379

# メモリ制限
NODE_OPTIONS=--max-old-space-size=384

# 同時接続数制限
MAX_CONNECTIONS=70
```

---

## モニタリング

### メモリ使用量の監視

```bash
# メモリ使用量を定期的にチェック
watch -n 5 free -h

# PM2でメモリ使用量を監視
pm2 monit

# プロセス毎のメモリ使用量
ps aux --sort=-%mem | head -n 10
```

### ネットワーク転送量の監視

```bash
# vnStatでネットワーク使用量を追跡
sudo apt-get install vnstat
vnstat -m  # 月間使用量
vnstat -d  # 日別使用量
```

### アラート設定

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

---

## パフォーマンス最適化チェックリスト

### メモリ最適化
- [x] PostgreSQLを外部化（Supabase）
- [x] Redisを外部化（Upstash）
- [x] Node.jsのヒープサイズを制限（384MB）
- [x] PM2をシングルプロセスモードで起動
- [x] メモリキャッシュを50MB以内に制限

### ネットワーク最適化
- [x] フロントエンドをVercelで配信
- [x] WebSocketメッセージを最小化（差分のみ）
- [x] gzip圧縮を有効化
- [x] レート制限を実装
- [x] 同時接続数を70以内に制限

### CPU最適化
- [x] 軽量なゲームロジック
- [x] キャッシュの活用（設定ファイル）
- [x] 非同期処理の活用
- [x] インデックスの最適化

### ストレージ最適化
- [x] ログローテーション
- [x] 定期的なクリーンアップ
- [x] データベースを外部化

---

## トラブルシューティング

### メモリ不足エラー

```bash
# メモリ使用量を確認
free -h

# プロセスを再起動
pm2 restart trpg-backend

# メモリ制限を調整
pm2 delete trpg-backend
pm2 start dist/index.js --name trpg-backend --max-memory-restart 350M
```

### ネットワーク制限超過

```bash
# 現在の使用量を確認
vnstat -m

# 一時的に接続数を減らす
# .env ファイルを編集
MAX_CONNECTIONS=30

# サービス再起動
pm2 restart trpg-backend
```

### CPU使用率が高い

```bash
# CPU使用率を確認
top

# ボトルネックを特定
pm2 monit

# 必要に応じてゲーム数を制限
```

---

## スケーリング戦略

### 無料枠を超えた場合の選択肢

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

## 変更履歴

- 2025-11-13: 初版作成（GCP e2-micro最適化設計）
