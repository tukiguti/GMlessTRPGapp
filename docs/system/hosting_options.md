# ホスティングオプション詳細

## 概要

GMレスLoL風TRPGアプリケーションのホスティング構成の詳細と、予算別の選択肢について説明します。

**重要**: GCP・AWS・Azureの無料枠を最大限活用した構成を優先的に提案します。

---

## 🎯 最推奨構成: AWS/GCP無料枠フル活用プラン - $0〜$3/月

### 構成A: AWS中心プラン（初年度完全無料、以降$0〜$5/月）

```
┌─────────────────────────────────────────┐
│ Vercel or Cloudflare Pages              │
│ (フロントエンド)                         │
│ - React/Vite アプリケーション            │
│ - 無料: $0/月                            │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│ AWS EC2 t3.micro (バックエンド)          │
│ - Node.js + Express + Socket.IO         │
│ - 初年度無料、以降 $0/月 (Always Free)   │
│ - 750時間/月（常時起動可能）             │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│ AWS RDS t3.micro (PostgreSQL)           │
│ - 初年度無料、以降 Supabase無料枠へ移行  │
│ - または Supabase 無料枠: $0/月          │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│ Upstash Redis (キャッシュ)              │
│ - セッション管理・リアルタイム状態       │
│ - 無料枠: $0/月                          │
└─────────────────────────────────────────┘
```

**初年度合計: $0/月**
**2年目以降: $0〜$3/月** (EC2停止時の最小ストレージ料金)

### 構成B: GCP中心プラン（永続的無料）

```
┌─────────────────────────────────────────┐
│ Vercel or Cloudflare Pages              │
│ (フロントエンド)                         │
│ - React/Vite アプリケーション            │
│ - 無料: $0/月                            │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│ GCP Compute Engine e2-micro             │
│ (バックエンド)                           │
│ - Node.js + Express + Socket.IO         │
│ - 永続的無料: $0/月                      │
│ - us-west1/us-central1/us-east1限定     │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│ Supabase (PostgreSQL)                   │
│ - 無料枠: $0/月                          │
└─────────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────────┐
│ Upstash Redis (キャッシュ)              │
│ - 無料枠: $0/月                          │
└─────────────────────────────────────────┘
```

**合計: $0/月（永続的）**

---

## 各構成の詳細比較

### 構成A: AWS EC2 + RDS/Supabase（初年度完全無料）

#### AWS無料枠の内容

**EC2 t3.micro（12ヶ月間無料）:**
- **メモリ**: 1GB RAM
- **CPU**: 2 vCPU（バースト可能）
- **ストレージ**: 30GB EBS（gp2またはgp3）
- **稼働時間**: 750時間/月（常時起動可能）
- **ネットワーク**: 15GB/月のデータ転送
- **期限**: 12ヶ月間

**RDS db.t3.micro（12ヶ月間無料）:**
- **メモリ**: 1GB RAM
- **ストレージ**: 20GB
- **稼働時間**: 750時間/月
- **バックアップ**: 20GB
- **期限**: 12ヶ月間

**永続的無料枠:**
- **Lambda**: 100万リクエスト/月
- **DynamoDB**: 25GB（使用しない場合は不要）
- **CloudWatch**: ログ5GB/月

#### メリット
- 初年度は完全無料
- EC2 1GB RAMで30-50人の同時接続に対応
- WebSocket完全対応
- フルコントロール可能
- 安定した性能

#### デメリット
- **12ヶ月後の対応が必要**（後述の移行戦略参照）
- インフラ管理が必要（セキュリティ、アップデート）
- クレジットカード登録必須

#### セットアップ手順

```bash
# 1. EC2インスタンス作成
# - AMI: Ubuntu 22.04 LTS
# - Instance Type: t3.micro
# - Security Group:
#   - SSH (22) from My IP
#   - HTTP (80) from Anywhere
#   - HTTPS (443) from Anywhere
#   - Custom TCP (4000) from Anywhere

# 2. SSH接続
ssh -i your-key.pem ubuntu@ec2-xx-xx-xx-xx.compute.amazonaws.com

# 3. Node.js 20インストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. PM2インストール（プロセス管理）
sudo npm install -g pm2

# 5. アプリケーションデプロイ
git clone https://github.com/your-repo/GMlessTRPGapp.git
cd GMlessTRPGapp/server
npm install
npm run build

# 6. 環境変数設定
cat > .env <<EOF
DATABASE_URL=postgresql://user:password@your-rds-endpoint:5432/trpg_db
REDIS_URL=rediss://default:password@your-upstash-host:6379
NODE_ENV=production
PORT=4000
EOF

# 7. PM2で起動（自動再起動・クラスター化）
pm2 start dist/index.js --name trpg-backend -i max
pm2 startup
pm2 save

# 8. Nginx設定（リバースプロキシ）
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/trpg

# Nginx設定内容:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

sudo ln -s /etc/nginx/sites-available/trpg /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 9. SSL証明書（Let's Encrypt）
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 12ヶ月後の移行戦略

**オプション1: GCP e2-microへ移行（永続的無料）**
```bash
# GCPに同様の構成を作成
# 無料枠が永続的なので長期運用に最適
```

**オプション2: Fly.io/Renderへ移行（$0〜$7/月）**
```bash
# マネージドサービスへ移行
# インフラ管理不要
```

**オプション3: AWS Lightsailへ移行（$5/月）**
```bash
# シンプルな固定料金プラン
# 予測可能なコスト
```

---

### 構成B: GCP Compute Engine e2-micro（永続的無料）

#### GCP無料枠の内容

**Compute Engine e2-micro（永続的無料）:**
- **メモリ**: 1GB RAM
- **CPU**: 0.25〜1 vCPU（共有）
- **ストレージ**: 30GB HDD（標準永続ディスク）
- **リージョン**: us-west1, us-central1, us-east1のみ
- **ネットワーク**:
  - 北米から他リージョンへ: 1GB/月（無料）
  - 中国・オーストラリア以外: 1GB/月（無料）
- **期限**: **永続的（無期限）**

**その他の無料枠:**
- **Cloud Storage**: 5GB（永続的）
- **Cloud Functions**: 200万呼び出し/月
- **Cloud Run**: 200万リクエスト/月

#### メリット
- **永続的無料**（期限なし）
- 1GB RAMで30-50人の同時接続に対応
- WebSocket完全対応
- Googleのインフラで安定性高い

#### デメリット
- **リージョン制限**（us-west1/central1/east1のみ）
- CPU性能が共有型（バースト制限あり）
- インフラ管理が必要
- 日本からのレイテンシがやや高い（150-200ms）

#### セットアップ手順

```bash
# 1. gcloud CLIインストール
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# 2. e2-microインスタンス作成
gcloud compute instances create trpg-backend \
  --zone=us-west1-b \
  --machine-type=e2-micro \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --tags=http-server,https-server

# 3. ファイアウォールルール作成
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --target-tags http-server

gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --target-tags https-server

gcloud compute firewall-rules create allow-backend \
  --allow tcp:4000 \
  --target-tags http-server

# 4. SSH接続
gcloud compute ssh trpg-backend --zone=us-west1-b

# 5. 以降はAWSと同じ手順
# - Node.js 20インストール
# - PM2インストール
# - アプリケーションデプロイ
# - Nginx設定
# - SSL証明書設定
```

#### 無料枠の制限と対策

**ネットワーク制限（1GB/月）:**
```
1ゲームセッション:
  - WebSocket通信: 1-5MB
  - API通信: 0.5-1MB
  合計: 2-6MB/ゲーム

1GB/月 = 約150-500ゲーム/月
```

**対策:**
- フロントエンドはVercel（無料100GB）で配信
- バックエンドはWebSocket・APIのみ
- 静的ファイルは配信しない

**CPU制限（共有vCPU）:**
```
e2-micro:
  - ベースライン: 25% CPU使用率
  - バースト: 最大100%（短時間）
  - 制限: 持続的な高負荷は不可
```

**対策:**
- 軽量なゲームロジック設計
- Redisでキャッシュ活用
- 重い処理はバックグラウンドジョブ化

---

## 予備案: 完全無料構成 - $7 プラン

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

## 構成比較表

| 構成 | 月額 | 同時接続数 | メモリ | 期限 | 管理難易度 | 推奨度 |
|------|------|-----------|--------|------|----------|--------|
| **GCP e2-micro** | **$0** | 30-50人 | 1GB | 永続的 | 中 | ⭐⭐⭐⭐⭐ |
| **AWS EC2 t3.micro** | **$0** | 30-50人 | 1GB | 12ヶ月 | 中 | ⭐⭐⭐⭐⭐ |
| Render Starter | $7 | 20-25人 | 512MB | 無期限 | 易 | ⭐⭐⭐⭐ |
| Railway | $5〜 | 20-25人 | 512MB | 無期限 | 易 | ⭐⭐⭐ |
| Fly.io | $0〜$3 | 10-15人 | 256MB | 無期限 | 中 | ⭐⭐⭐ |
| Render Free | $0 | 不安定 | 512MB | 無期限 | 易 | ⭐ |

---

## 最終推奨（優先順位順）

### 🥇 第1推奨: GCP e2-micro（永続的無料）

```
✅ 最推奨: GCP構成
   - Vercel/Cloudflare Pages (フロント): $0
   - GCP Compute Engine e2-micro (バックエンド): $0
   - Supabase Free (DB): $0
   - Upstash Free (Redis): $0

   合計: $0/月（永続的）
```

**推奨理由:**
- ✅ **完全無料で永続的**（期限なし）
- ✅ 1GB RAMで30-50人の同時接続に対応
- ✅ WebSocket完全対応
- ✅ 長期運用に最適
- ⚠️ リージョン制限あり（米国のみ）
- ⚠️ インフラ管理が必要

**こんな人におすすめ:**
- 長期的に無料で運用したい
- インフラ管理の学習もしたい
- 米国リージョンでも問題ない（レイテンシ150-200ms許容可）

---

### 🥈 第2推奨: AWS EC2 t3.micro（初年度無料）

```
✅ 推奨: AWS構成
   - Vercel/Cloudflare Pages (フロント): $0
   - AWS EC2 t3.micro (バックエンド): $0（初年度）
   - Supabase Free (DB): $0
   - Upstash Free (Redis): $0

   初年度合計: $0/月
   2年目以降: GCPへ移行または$5/月
```

**推奨理由:**
- ✅ **初年度完全無料**
- ✅ 1GB RAMで30-50人の同時接続に対応
- ✅ EC2のCPU性能が高い（2 vCPU）
- ✅ 12ヶ月後にGCPへ移行可能
- ⚠️ 12ヶ月後の対応が必要

**こんな人におすすめ:**
- まず1年間無料で試したい
- AWS学習も兼ねたい
- 1年後にGCPへ移行する計画

---

### 🥉 第3推奨: Render Starter（$7/月）

```
✅ 推奨: Render構成
   - Vercel (フロント): $0
   - Render Starter (バックエンド): $7
   - Supabase Free (DB): $0
   - Upstash Free (Redis): $0

   合計: $7/月
```

**推奨理由:**
- ✅ **インフラ管理不要**（最も簡単）
- ✅ 安定した動作
- ✅ 自動デプロイ・管理ダッシュボード
- ✅ トラブルが少ない
- ⚠️ 月額$7のコスト

**こんな人におすすめ:**
- インフラ管理をしたくない
- 月額$7は問題ない
- 安定性・管理のしやすさを優先

---

## フェーズ別の推奨戦略

### フェーズ1: スタートアップ期（0-6ヶ月）

**最優先: GCP e2-micro（$0/月・永続的）**

まずは完全無料のGCP構成で開始し、以下を検証:
- ゲームの人気度
- 実際のユーザー数
- トラフィック量

**利点:**
- コストゼロでリスクなく開始
- 実際の需要を把握できる
- 必要に応じてスケールアップ可能

### フェーズ2: 成長期（6-12ヶ月）

無料枠の限界に達したら段階的にアップグレード:

**シナリオA: 同時接続50人超え**
1. **GCP e2-small**: $15/月（2GB RAM、100人対応）
2. **Upstash Pro**: $10/月（コマンド制限解除）

**シナリオB: ネットワーク1GB/月超え**
1. **Cloudflare Tunnelで最適化**
2. または **Cloud CDN利用**（従量課金）

**シナリオC: ストレージ500MB超え**
1. **Supabase Pro**: $25/月（8GB storage、50GB transfer）

### フェーズ3: スケール期（12ヶ月以降）

**オプション1: GCPでスケールアップ**
- e2-medium: $25/月（4GB RAM、200人対応）
- Managed PostgreSQL検討

**オプション2: マネージドサービスへ移行**
- Render Professional: $25/月
- Railway Pro: $20/月
- Fly.io Dedicated: $30/月

**合計予算: $60-80/月で100-200人規模に対応可能**

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

## まとめ: 無料枠活用時の注意事項

### GCP e2-micro使用時の注意点

**✅ 必ず守ること:**
1. **リージョン**: us-west1/us-central1/us-east1のいずれか
2. **マシンタイプ**: e2-microのみ（他は課金対象）
3. **ディスク**: 標準永続ディスク30GB以内
4. **ネットワーク**: 1GB/月以内（超過分は課金）

**🔧 最適化のベストプラクティス:**
- CloudflareをCDNとして使用（無料・無制限）
- 静的ファイルはVercelで配信
- WebSocketの通信を最小化
- Redisでキャッシュを活用

### AWS EC2 t3.micro使用時の注意点

**✅ 12ヶ月無料枠:**
- アカウント作成から12ヶ月間のみ
- 750時間/月（1インスタンス常時起動可能）
- t3.micro以外は課金対象

**⚠️ 12ヶ月後の選択肢:**
1. GCP e2-microへ移行（永続的無料）
2. AWS Lightsailへ移行（$5/月）
3. 他のマネージドサービスへ移行

### コスト最適化の鉄則

**無料枠を最大限活用する方法:**
1. **フロントエンド**: Vercel/Cloudflare Pages（無料100GB）
2. **バックエンド**: GCP e2-micro（永続的無料）
3. **データベース**: Supabase（無料500MB）
4. **キャッシュ**: Upstash Redis（無料10,000コマンド/日）
5. **CDN**: Cloudflare（無料・無制限）

**これで完全無料で30-50人の同時接続をサポート可能！**

---

## 最終推奨まとめ

### 🎯 絶対的推奨: GCP e2-micro（永続的$0/月）

**理由:**
- ✅ **完全無料で永続的**（期限なし）
- ✅ 1GB RAMで十分な性能（30-50人対応）
- ✅ WebSocket完全対応
- ✅ リアルタイムゲームに最適
- ✅ 長期運用に安心

**唯一の欠点:**
- ⚠️ リージョンが米国のみ（レイテンシ150-200ms）
  - ただし、TRPGはターン制なので影響は限定的
  - レイテンシが気になる場合は日本リージョンで有料プラン検討

**結論: まずGCP e2-microで開始し、需要を見てスケールアップ**

---

## クイックスタートガイド

### 最速セットアップ（GCP e2-micro）

```bash
# 1. GCPアカウント作成（クレカ登録必要だが課金なし）
https://cloud.google.com/

# 2. gcloud CLI インストール
curl https://sdk.cloud.google.com | bash

# 3. e2-microインスタンス作成
gcloud compute instances create trpg-backend \
  --zone=us-west1-b \
  --machine-type=e2-micro \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud

# 4. SSH接続してアプリデプロイ
gcloud compute ssh trpg-backend --zone=us-west1-b

# 5. セットアップスクリプト実行（後述）
curl -s https://raw.githubusercontent.com/.../setup.sh | bash

# 完了！
```

**所要時間: 約30分**

---

## 変更履歴

- 2025-11-13: GCP/AWS無料枠を考慮した構成に大幅改訂
  - GCP e2-microを第1推奨に変更
  - AWS EC2 t3.microを第2推奨に追加
  - 無料枠活用の詳細ガイド追加
  - セットアップ手順を詳細化
- 2025-11-11: 初版作成
