# ホスティングオプション詳細

## 概要

GMレスLoL風TRPGアプリケーションのホスティング構成の詳細と、予算別の選択肢について説明します。

---

## 推奨構成: 月額 $7 プラン

### 構成詳細

```
┌─────────────────────────────────────────┐
│ Vercel (フロントエンド)                   │
│ - React/Vite アプリケーション              │
│ - 無料: $0/月                            │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│ Render Web Service (バックエンド)         │
│ - Node.js + Express + Socket.IO        │
│ - Starter: $7/月                        │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│ Supabase (データベース)                   │
│ - PostgreSQL 15+                        │
│ - 無料枠: $0/月                          │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│ Upstash Redis (キャッシュ)                │
│ - セッション管理・リアルタイム状態          │
│ - 無料枠: $0/月                          │
└─────────────────────────────────────────┘
```

**合計: $7/月**

---

## 各サービスの詳細

### 1. Vercel (フロントエンド) - $0/月

#### 無料枠の内容
- **帯域幅**: 100GB/月
- **ビルド時間**: 6,000分/月
- **サーバーレス関数**: 100GB-時間/月
- **デプロイ**: 無制限
- **カスタムドメイン**: 対応
- **SSL証明書**: 自動・無料

#### 利点
- 自動CI/CD（GitHubと連携）
- グローバルCDN配信（高速）
- プレビューデプロイ機能
- 簡単なセットアップ

#### 制限
- 商用利用には規約確認必要
- 同時ビルド数制限（1）
- カスタムヘッダー・リダイレクトは制限あり

#### 想定トラフィック
- **100GB/月 = 約33,000ページビュー**（1ページ3MBと仮定）
- TRPGアプリなら十分な容量

#### デプロイ方法
```bash
# package.jsonにスクリプト追加
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}

# Vercel CLIでデプロイ
npm install -g vercel
vercel --prod
```

---

### 2. Render Web Service (バックエンド) - $7/月

#### Starterプランの内容
- **メモリ**: 512MB RAM
- **CPU**: 共有vCPU 0.5
- **帯域幅**: 無制限
- **ストレージ**: 無料（ディスクは一時的）
- **稼働時間**: 24/7（常時起動）
- **カスタムドメイン**: 対応
- **SSL証明書**: 自動・無料

#### 利点
- WebSocket対応（Socket.IO使用可能）
- 自動デプロイ（GitHubと連携）
- 環境変数管理
- ログ閲覧機能
- Docker対応

#### 制限
- **メモリ512MB** = 同時接続数は制限あり（後述）
- CPU共有なので高負荷時は遅延の可能性
- ディスクストレージは揮発性（DBは外部必須）

#### 同時接続数の目安
- **1接続あたり約10-20MBメモリ使用**
- 512MB ÷ 20MB = **約20-25人の同時接続が目安**
- ゲーム進行中のユーザーのみなので、小規模運用には十分

#### デプロイ方法
```yaml
# render.yaml
services:
  - type: web
    name: trpg-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        sync: false
      - key: NODE_ENV
        value: production
```

---

### 3. Supabase (データベース) - $0/月

#### 無料枠の内容
- **データベース**: PostgreSQL 15
- **ストレージ**: 500MB
- **帯域幅**: 2GB/月
- **同時接続**: 最大60
- **API リクエスト**: 無制限
- **認証**: 50,000アクティブユーザー/月
- **自動バックアップ**: 7日間保持

#### 利点
- フルマネージドPostgreSQL
- Prismaと完全互換
- リアルタイム機能（Postgresの変更監視）
- 管理ダッシュボード
- 自動バックアップ

#### 制限
- **ストレージ500MB** = 小規模なゲーム記録なら十分
- **2GB転送/月** = 約2,000~5,000ゲームセッション相当
- プロジェクト休止期間あり（7日間アクティビティなしで一時停止）

#### データサイズ見積もり
```
1ゲームセッション:
  - ゲーム状態: 10-50KB
  - プレイヤー情報: 5KB × プレイヤー数
  - ゲーム履歴: 50-200KB

合計: 約 100-300KB/ゲーム

500MBで約1,500-5,000ゲーム保存可能
```

#### 接続設定
```typescript
// .env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]"

// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

### 4. Upstash Redis (キャッシュ) - $0/月

#### 無料枠の内容
- **メモリ**: 256MB
- **1日あたりのコマンド**: 10,000
- **最大データサイズ**: 256MB
- **同時接続**: 無制限
- **レイテンシ**: グローバルレプリケーション対応

#### 利点
- サーバーレスRedis（使った分だけ課金）
- REST APIでアクセス可能
- グローバルレプリケーション
- 永続化オプションあり

#### 制限
- **10,000コマンド/日** = **約7コマンド/分**
- メモリ256MBは小規模には十分

#### 使用用途
- **セッション管理**（WebSocket接続情報）
- **ゲーム状態キャッシュ**（頻繁にアクセスされる状態）
- **プレイヤーのオンライン状態**

#### コマンド数見積もり
```
1ゲームセッション（10ラウンド）:
  - 状態保存: 10回
  - 状態読み込み: 50回
  - セッション管理: 20回

合計: 約80コマンド/ゲーム

10,000コマンド/日 = 約120-150ゲーム/日まで対応可能
```

#### 接続設定
```typescript
// .env
REDIS_URL="rediss://default:[password]@[host]:6379"

// src/server/cache/RedisClient.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!
});
```

---

## 低予算案の比較

### オプション 1: 完全無料構成 - $0/月

```
Vercel (フロント) + Render Free (バックエンド) + Supabase Free + なし(Redis)
```

#### 構成
- **Vercel**: 無料枠（変更なし）
- **Render Free Tier**: $0
  - 750時間/月の無料時間（常時起動は不可）
  - 15分無アクセスでスリープ
  - 起動に30-60秒かかる
- **Supabase**: 無料枠（変更なし）
- **Redis**: なし（代わりにメモリ内キャッシュ）

#### メリット
- 完全無料

#### デメリット
- **致命的**: Renderが15分でスリープ → ゲーム中に切断される可能性
- WebSocket接続維持が困難
- レスポンスが遅い（起動待ち）

**結論: TRPGアプリには不向き（リアルタイム性が必要なため）**

---

### オプション 2: Railway利用 - $5/月〜

```
Vercel (フロント) + Railway (バックエンド+DB+Redis統合)
```

#### 構成
- **Vercel**: 無料枠
- **Railway**: $5/月（従量課金）
  - バックエンド + PostgreSQL + Redis を統合
  - 512MB RAM
  - 月$5のクレジット付与
  - 超過分は従量課金

#### メリット
- 1つのプラットフォームでバックエンド+DB+Redis管理
- 管理が簡単
- Dockerサポート

#### デメリット
- 従量課金なので予測しにくい
- トラフィックが増えると追加料金
- $5で収まる保証なし

**結論: シンプルさ重視ならアリ、予算管理が難しい**

---

### オプション 3: Fly.io利用 - $0〜$3/月

```
Vercel (フロント) + Fly.io (バックエンド) + Supabase (DB) + Upstash (Redis)
```

#### 構成
- **Vercel**: 無料枠
- **Fly.io**: 無料枠〜$3/月
  - 無料枠: 256MB RAM × 3インスタンス（共有CPU）
  - 有料: $1.94/月（256MB専有CPU）〜
- **Supabase**: 無料枠
- **Upstash**: 無料枠

#### メリット
- Fly.ioはWebSocket対応
- Docker完全サポート
- グローバル配置可能
- 無料枠が比較的寛容

#### デメリット
- 256MB RAMは制限が厳しい（10-15人同時接続が限界）
- クレジットカード登録必須

**結論: 無料に近い構成だが、制限が厳しい**

---

### オプション 4: Cloudflare Workers + D1 - $0〜$5/月

```
Cloudflare Pages (フロント) + Workers (バックエンド) + D1 (DB) + Durable Objects
```

#### 構成
- **Cloudflare Pages**: 無料
- **Cloudflare Workers**: 無料枠（10万リクエスト/日）
- **D1 (SQLite)**: $0（β版）
- **Durable Objects**: $5/月〜（WebSocket用）

#### メリット
- グローバルエッジネットワーク（超高速）
- スケーラビリティ高い

#### デメリット
- **サーバーレスアーキテクチャ** → 大幅な設計変更が必要
- Durable ObjectsはWebSocket対応だが学習コスト高い
- D1はまだβ版（本番利用は慎重に）

**結論: 将来的には検討価値あり、今すぐは不向き**

---

### オプション 5: VPS利用 - $4〜$6/月

```
Vercel (フロント) + VPS (バックエンド+DB+Redis統合)
```

#### 構成
- **Vercel**: 無料枠
- **VPS (Vultr/DigitalOcean/Linode)**: $4〜$6/月
  - 1GB RAM
  - 1 vCPU
  - 自分でNode.js + PostgreSQL + Redisをセットアップ

#### メリット
- フルコントロール
- 予測可能な料金
- パフォーマンスが安定

#### デメリット
- **セットアップが複雑**（インフラ管理が必要）
- セキュリティ管理も自分で
- バックアップ・監視も自分で

**結論: インフラ経験があればコスパ良いが、初心者には不向き**

---

## 推奨構成の理由

### なぜ $7/月プランを推奨するか

| 要件 | Render Starter ($7/月) | Render Free ($0/月) | Fly.io Free |
|------|------------------------|---------------------|-------------|
| 常時起動 | ✅ 24/7 | ❌ 15分でスリープ | ✅ |
| WebSocket | ✅ 完全対応 | ✅ | ✅ |
| メモリ | 512MB | 512MB | 256MB |
| 同時接続数 | 20-25人 | 不安定 | 10-15人 |
| 起動時間 | なし | 30-60秒 | なし |
| 信頼性 | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

#### リアルタイムTRPGでは致命的な問題
- **15分スリープ** → ゲーム中にプレイヤーが全員切断される
- **起動待ち時間** → プレイ体験が著しく悪化
- **不安定な接続** → ゲームの進行が途中で止まる

**結論: $7/月は最小限の投資で、安定したプレイ体験を提供できる**

---

## 費用対効果の分析

### $7/月で何ができるか

#### 同時対応ゲーム数
- **Render 512MB**: 約20-25人同時接続
- **1ゲーム = 2-10人** として、**2-10ゲーム同時進行可能**

#### 月間ゲーム数
- **Supabase 2GB転送**: 約2,000-5,000ゲームセッション
- **Upstash 10,000コマンド/日**: 約120-150ゲーム/日 = **3,000-4,500ゲーム/月**

#### ユーザー数
- **アクティブユーザー数**: 50-100人程度まで対応可能
- **登録ユーザー数**: 無制限（Supabaseのストレージ次第）

### スケールアップタイミング

#### $7/月で足りなくなる条件
- **同時接続が25人を超える**
- **月間ゲーム数が3,000を超える**
- **ストレージが500MBを超える**

#### 次のステップ: $25-30/月
- **Render Professional**: $25/月（2GB RAM、同時100人対応）
- **Supabase Pro**: $25/月（8GB storage、50GB transfer）
- **Upstash Pro**: $10/月（無制限コマンド）

**合計: $60/月で100人規模に対応可能**

---

## 最終推奨

### スタートアップ期（0-3ヶ月）

```
✅ 推奨: $7/月プラン
   - Vercel (フロント): $0
   - Render Starter (バックエンド): $7
   - Supabase Free (DB): $0
   - Upstash Free (Redis): $0
```

**理由**:
- 安定した動作
- 管理が簡単
- 20-25人の同時接続で小規模コミュニティには十分
- トラブルが少ない

### 成長期（3-6ヶ月）

無料枠の限界に達したら段階的にアップグレード:
1. **Upstash Pro**: $10/月（コマンド制限解除）
2. **Supabase Pro**: $25/月（ストレージ・転送量増加）
3. **Render Professional**: $25/月（メモリ・CPU増強）

---

## セットアップ手順

### 1. Vercel（フロントエンド）

```bash
# Vercel CLIインストール
npm install -g vercel

# プロジェクトをVercelにデプロイ
cd client
vercel --prod

# 環境変数設定（VercelダッシュボードまたはCLI）
vercel env add VITE_API_URL
vercel env add VITE_WS_URL
```

### 2. Render（バックエンド）

1. [Render Dashboard](https://dashboard.render.com/)にログイン
2. "New +" → "Web Service"
3. GitHubリポジトリを接続
4. 設定:
   ```
   Name: trpg-backend
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Starter ($7/month)
   ```
5. 環境変数設定:
   ```
   DATABASE_URL=<Supabase接続URL>
   REDIS_URL=<Upstash接続URL>
   NODE_ENV=production
   PORT=4000
   ```

### 3. Supabase（データベース）

1. [Supabase Dashboard](https://app.supabase.com/)にログイン
2. "New Project"
3. プロジェクト情報入力
4. 接続情報をコピー:
   ```
   Host: db.xxx.supabase.co
   Database: postgres
   Port: 5432
   User: postgres
   Password: <your-password>
   ```
5. Prismaマイグレーション実行:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```

### 4. Upstash（Redis）

1. [Upstash Console](https://console.upstash.com/)にログイン
2. "Create Database"
3. 設定:
   ```
   Name: trpg-redis
   Type: Regional（低レイテンシ重視）
   Region: 最寄りのリージョン
   ```
4. 接続情報をコピー:
   ```
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   ```

---

## まとめ

| プラン | 月額 | 同時接続 | 推奨 | 注意点 |
|--------|------|----------|------|--------|
| **完全無料** | $0 | 不安定 | ❌ | スリープで切断される |
| **$7プラン** | $7 | 20-25人 | ✅ | スタートアップに最適 |
| **Railway** | $5〜 | 20-25人 | △ | 従量課金で予測困難 |
| **Fly.io** | $0〜$3 | 10-15人 | △ | メモリ制限が厳しい |
| **VPS** | $4〜$6 | 20-30人 | △ | インフラ管理が必要 |

**最終推奨: Render Starter $7/月プラン**

理由:
- リアルタイムゲームに必須の常時起動
- WebSocket完全対応
- 管理が簡単（インフラ知識不要）
- 小規模コミュニティには十分な性能
- トラブルが少なく、安心して運用できる

---

## 変更履歴

- 2025-11-11: 初版作成
