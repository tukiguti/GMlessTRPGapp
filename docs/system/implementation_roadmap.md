# システム実装ロードマップ

## 概要

GMレスLoL風TRPGをWebアプリケーションとして実装するための詳細な手順書。
GCP e2-micro（無料枠）での運用を前提とした設計で、フェーズごとに段階的に実装を進める。

**GCP最適化方針:**
- フロントエンド: Vercel（無料100GB/月）
- バックエンド: GCP e2-micro（1GB RAM、1GB/月ネットワーク）
- DB: Supabase PostgreSQL（無料500MB）
- Redis: Upstash（無料256MB、10,000コマンド/日）

---

## 前提条件

### 必要な環境
- Node.js 20 LTS以上
- npm または yarn
- Git
- GCPアカウント（無料枠）
- Vercelアカウント（無料プラン）
- Supabaseアカウント（無料プラン）
- Upstashアカウント（無料プラン）

### 参照ドキュメント
- [アーキテクチャ設計](./architecture.md)
- [技術スタック](./technology_stack.md)
- [設定管理設計](./configuration_management.md)
- [GCP最適化設計](./gcp_optimized_design.md) ⭐ **重要**
- [ゲームルール総合索引](../game_rules.md)

---

## フェーズ0: プロジェクト初期化 ✅

### 0.1 プロジェクト構造の作成

```bash
# ルートディレクトリで実行
mkdir -p src/{client,server,game,database,shared}
mkdir -p src/client/{components,stores,services,utils}
mkdir -p src/server/{api,websocket,middleware}
mkdir -p src/game/{engine,rules,systems,ai,config}
mkdir -p src/database/{models,repositories,migrations}
mkdir -p tests/{unit,integration,e2e}
```

**確認項目**:
- [x] ディレクトリ構造が作成された
- [x] config/ ディレクトリが存在する
- [x] docs/ ディレクトリが存在する

---

### 0.2 package.json の初期化

#### ルートの package.json (モノレポ構成)

```bash
npm init -y
```

```json
{
  "name": "gmless-trpg",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "src/client",
    "src/server"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "npm run dev --workspace=server",
    "dev:client": "npm run dev --workspace=client",
    "build": "npm run build --workspaces",
    "test": "vitest"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

**確認項目**:
- [x] package.json が作成された
- [x] workspaces が設定された

---

### 0.3 TypeScript 設定

#### tsconfig.json (ルート)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@client/*": ["src/client/*"],
      "@server/*": ["src/server/*"],
      "@game/*": ["src/game/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

**確認項目**:
- [x] tsconfig.json が作成された
- [x] パスエイリアスが設定された

---

### 0.4 Git設定の確認

```bash
# .gitignore の確認
cat .gitignore
```

**.gitignore** に以下を追加（未追加の場合）:
```
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
```

**確認項目**:
- [x] .gitignore が適切に設定された
- [x] config/game_balance.yaml はコミット対象（除外しない）

---

## フェーズ1: バックエンド基盤構築 ⏳

### 1.1 外部サービスのセットアップ 🆕

#### Supabase PostgreSQL のセットアップ

1. https://supabase.com にアクセスしてプロジェクト作成
2. Database設定からConnection Stringを取得
3. 無料プラン確認：
   - ストレージ: 500MB
   - データ転送: 2GB/月
   - 同時接続: 最大60接続

#### Upstash Redis のセットアップ

1. https://upstash.com にアクセスしてデータベース作成
2. Redis設定からREDIS_URLを取得
3. 無料プラン確認：
   - メモリ: 256MB
   - コマンド数: 10,000/日
   - 同時接続: 最大100接続

**確認項目**:
- [ ] Supabaseプロジェクトが作成された
- [ ] PostgreSQL接続文字列を取得
- [ ] Upstash Redisデータベースが作成された
- [ ] Redis接続文字列を取得

---

### 1.2 サーバープロジェクトの初期化

```bash
cd src/server
npm init -y
```

#### src/server/package.json

```json
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node --max-old-space-size=384 dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.7.0",
    "@prisma/client": "^5.0.0",
    "ioredis": "^5.3.0",
    "js-yaml": "^4.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/js-yaml": "^4.0.0",
    "@types/cors": "^2.8.0",
    "@types/compression": "^1.7.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "nodemon": "^3.0.0",
    "prisma": "^5.0.0"
  }
}
```

**GCP最適化のポイント**:
- `--max-old-space-size=384`: Node.jsのヒープメモリを384MBに制限
- `compression`: gzip圧縮でネットワーク転送量を削減
- `express-rate-limit`: レート制限でネットワーク使用量を管理
- `ioredis`: Upstash Redis用のクライアント

```bash
npm install
```

**確認項目**:
- [ ] package.json が作成された
- [ ] 依存関係がインストールされた
- [ ] GCP最適化パッケージ（compression、rate-limit）が含まれている

---

### 1.3 環境変数の設定

#### src/server/.env

```env
NODE_ENV=development
PORT=4000

# Supabase PostgreSQL (無料500MB)
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]

# Upstash Redis (無料256MB)
REDIS_URL=rediss://default:[password]@[host]:6379

# GCP最適化設定
NODE_OPTIONS=--max-old-space-size=384
MAX_CONNECTIONS=70

# クライアントURL
CLIENT_URL=http://localhost:3000
```

**GCP最適化のポイント**:
- `MAX_CONNECTIONS=70`: 同時接続数を70に制限（メモリ使用量管理）
- `NODE_OPTIONS`: Node.jsメモリ制限

**確認項目**:
- [ ] .env ファイルが作成された
- [ ] .gitignore に .env が含まれている
- [ ] Supabase DATABASE_URLが設定された
- [ ] Upstash REDIS_URLが設定された

---

### 1.4 Prismaの初期化

```bash
cd src/server
npx prisma init
```

#### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Game {
  id        String   @id @default(uuid())
  mode      String   // "casual", "ranked_1v1", "ranked_5v5", "tutorial"
  round     Int      @default(0)
  phase     String   @default("declaration") // "declaration", "resolution"
  state     Json     // ゲーム状態全体（差分更新で最小化）
  status    String   @default("waiting") // "waiting", "in_progress", "finished"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  players   Player[]

  @@index([status])
  @@index([createdAt])
}

model Player {
  id          String   @id @default(uuid())
  gameId      String
  socketId    String?
  playerName  String
  team        String   // "blue", "red"
  characters  Character[]

  game        Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)

  @@index([gameId])
  @@index([socketId])
}

model Character {
  id          String @id @default(uuid())
  playerId    String
  name        String
  role        String // "ad_marksman", "ad_fighter", etc.
  lane        String // "TOP", "JG", "MID", "BOT"
  level       Int    @default(1)
  hp          Int
  maxHp       Int
  gold        Int    @default(0)
  stats       Json   // { attack, defense, mobility, utility }
  position    Json   // { area, lane }
  buffs       Json   // [{ type, duration, value }]
  skills      Json   // { normal: {...}, ult: {...} }
  items       Json   // [{ name, stats }]

  player      Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@index([playerId])
}
```

**GCP最適化のポイント**:
- インデックスを最小限に抑える（ストレージ削減）
- `state`フィールドにJson型を使用（柔軟性とストレージ効率）

```bash
# マイグレーション実行
npx prisma migrate dev --name init
npx prisma generate
```

**確認項目**:
- [ ] Prismaスキーマが作成された
- [ ] Supabaseにマイグレーションが実行された
- [ ] Prisma Clientが生成された

---

### 1.5 基本サーバーの実装（GCP最適化版）

#### src/server/src/index.ts

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// GCP最適化: 同時接続数制限
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS || '70', 10);
let connectedClients = 0;

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e6, // 1MB (GCP最適化: ネットワーク転送量削減)
  pingTimeout: 60000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  }
});

// GCP最適化: 接続数制限ミドルウェア
io.use((socket, next) => {
  if (connectedClients >= MAX_CONNECTIONS) {
    console.warn('[WebSocket] Server full, rejecting connection');
    return next(new Error('Server full'));
  }
  connectedClients++;
  console.log(`[WebSocket] Connection accepted (${connectedClients}/${MAX_CONNECTIONS})`);
  next();
});

// GCP最適化: gzip圧縮（ネットワーク転送量削減）
app.use(compression());

// GCP最適化: レート制限（ネットワーク使用量管理）
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 60, // 最大60リクエスト/分
  message: 'Too many requests from this IP'
});

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: '100kb' })); // GCP最適化: ペイロードサイズ制限
app.use('/api/', apiLimiter);

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connections: connectedClients,
    maxConnections: MAX_CONNECTIONS,
    memoryUsage: process.memoryUsage()
  });
});

// メモリ使用量監視（開発時のみ）
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log('[Memory] Heap:', Math.round(memUsage.heapUsed / 1024 / 1024), 'MB');
  }, 30000); // 30秒ごと
}

// WebSocket接続
io.on('connection', (socket) => {
  console.log('[WebSocket] Client connected:', socket.id);

  socket.on('disconnect', () => {
    connectedClients--;
    console.log('[WebSocket] Client disconnected:', socket.id, `(${connectedClients}/${MAX_CONNECTIONS})`);
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] Max connections: ${MAX_CONNECTIONS}`);
  console.log(`[Server] Memory limit: 384MB`);
});
```

**GCP最適化のポイント**:
- 同時接続数を70に制限
- gzip圧縮でネットワーク転送量を削減
- レート制限でAPI使用量を管理
- メモリ使用量を監視

```bash
npm run dev
```

**確認項目**:
- [ ] サーバーが起動する
- [ ] http://localhost:4000/health にアクセスできる
- [ ] メモリ使用量が表示される（開発モード）

---

### 1.6 ConfigLoaderの実装

#### src/game/config/types.ts

```typescript
// 設定管理設計ドキュメントの型定義をコピー
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

export interface GameConfig {
  character_initial_stats: Record<RoleType, CharacterStats>;
  leveling_system: {
    max_level: number;
    growth_per_level: Record<RoleType, CharacterStats>;
  };
  combat_system: {
    damage_multiplier: number;
  };
  tower_system: {
    hp: {
      nexus: number;
      nexus_tower: number;
      inner_tower: number;
      outer_tower: number;
    };
  };
  minion_system: {
    spawn_frequency: number;
  };
  // ... 他の設定
}
```

#### src/game/config/ConfigLoader.ts

```typescript
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { GameConfig, RoleType } from './types';

export class ConfigLoader {
  private static instance: GameConfig | null = null;
  private static configPath = path.join(__dirname, '../../../config/game_balance.yaml');

  static load(): GameConfig {
    if (this.instance) {
      return this.instance;
    }

    console.log('[ConfigLoader] Loading config from:', this.configPath);

    try {
      const fileContents = fs.readFileSync(this.configPath, 'utf8');
      this.instance = yaml.load(fileContents) as GameConfig;

      console.log('[ConfigLoader] Config loaded successfully');
      return this.instance;
    } catch (error) {
      console.error('[ConfigLoader] Failed to load config:', error);
      throw new Error(`Failed to load game configuration: ${error}`);
    }
  }

  static reload(): GameConfig {
    console.log('[ConfigLoader] Reloading config...');
    this.instance = null;
    return this.load();
  }

  static get(): GameConfig {
    if (!this.instance) {
      return this.load();
    }
    return this.instance;
  }

  static getCharacterStats(role: string) {
    const config = this.get();
    return config.character_initial_stats[role as RoleType];
  }

  static getGrowthStats(role: string) {
    const config = this.get();
    return config.leveling_system.growth_per_level[role as RoleType];
  }
}
```

**テスト**:

```typescript
// src/game/config/ConfigLoader.test.ts
import { describe, it, expect } from 'vitest';
import { ConfigLoader } from './ConfigLoader';

describe('ConfigLoader', () => {
  it('should load config successfully', () => {
    const config = ConfigLoader.load();
    expect(config).toBeDefined();
    expect(config.character_initial_stats).toBeDefined();
  });

  it('should get marksman stats', () => {
    const stats = ConfigLoader.getCharacterStats('ad_marksman');
    expect(stats.hp).toBe(400);
    expect(stats.attack).toBe(2);
  });
});
```

```bash
npm run test
```

**確認項目**:
- [x] ConfigLoader が実装された
- [x] game_balance.yaml が正常に読み込める
- [x] テストが通る

---

## フェーズ2: ゲームロジック実装 ✅

*(フェーズ2の内容は既に実装済みのため、詳細は省略)*

**完了済み**:
- [x] GameEngine実装
- [x] Character システム
- [x] Combat システム
- [x] RoundManager実装

---

## フェーズ3: フロントエンド基盤構築 ✅

*(フェーズ3の内容は既に実装済みのため、詳細は省略)*

**完了済み**:
- [x] クライアントプロジェクト初期化
- [x] Tailwind CSS設定
- [x] WebSocketサービス実装
- [x] Zustand状態管理
- [x] 基本UIコンポーネント
- [x] MapView、ActionPanel、CombatLog実装

**次のステップ**: Vercelへのデプロイ準備（フェーズ7で実施）

---

## フェーズ4: 統合とテスト ⏳

### 4.1 サーバーとクライアントの接続

#### src/server/src/websocket/connection.ts

```typescript
import { Server, Socket } from 'socket.io';
import { GameEngine } from '../../game/engine/GameEngine';
import Redis from 'ioredis';

const gameEngine = new GameEngine();

// GCP最適化: Upstash Redis接続
const redis = new Redis(process.env.REDIS_URL || '');

export function setupWebSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('[WebSocket] Player connected:', socket.id);

    socket.on('create_game', async (data) => {
      const gameId = crypto.randomUUID();
      const gameState = gameEngine.createGame(gameId);

      // GCP最適化: ゲーム状態をRedisにキャッシュ（メモリ節約）
      await redis.set(`game:${gameId}`, JSON.stringify(gameState), 'EX', 3600);

      socket.join(gameId);

      // GCP最適化: 必要最小限の情報のみ送信
      socket.emit('game_created', { gameId, round: gameState.round, phase: gameState.phase });
    });

    socket.on('join_game', async ({ gameId }) => {
      socket.join(gameId);

      // GCP最適化: Redisからゲーム状態を取得
      const cachedState = await redis.get(`game:${gameId}`);
      const gameState = cachedState ? JSON.parse(cachedState) : gameEngine.getGameState(gameId);

      socket.emit('game_state', gameState);
    });

    socket.on('player_action', async (action) => {
      const gameId = Array.from(socket.rooms)[1];
      // アクション処理
      const newState = gameEngine.getGameState(gameId);

      // GCP最適化: 差分のみ送信
      io.to(gameId).emit('game_update', {
        round: newState.round,
        phase: newState.phase,
        changes: action.changes // 変更があった部分のみ
      });
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Player disconnected:', socket.id);
    });
  });
}
```

**GCP最適化のポイント**:
- Redisにゲーム状態をキャッシュしてメモリ使用量を削減
- WebSocketメッセージは差分のみ送信（ネットワーク転送量削減）

#### src/server/src/index.ts に統合

```typescript
import { setupWebSocket } from './websocket/connection';

// ...

setupWebSocket(io);
```

**確認項目**:
- [ ] WebSocket接続が動作する
- [ ] クライアントからサーバーに接続できる
- [ ] Redisにゲーム状態がキャッシュされる

---

### 4.2 動作テスト

```bash
# ターミナル1: サーバー起動
cd src/server
npm run dev

# ターミナル2: クライアント起動
cd src/client
npm run dev
```

**ブラウザでテスト**:
1. http://localhost:3000 にアクセス
2. 開発者ツールのコンソールを確認
3. WebSocket接続が確認できること
4. http://localhost:4000/health でメモリ使用量を確認

**確認項目**:
- [ ] サーバーが起動する
- [ ] クライアントが起動する
- [ ] WebSocket接続が確立される
- [ ] メモリ使用量が384MB以内

---

## フェーズ5: ゲーム機能の実装 ⏳

### 5.1 行動宣言システム

- [ ] 行動選択UI（攻撃/ファーム/移動/リコール）✅ UI完成
- [ ] 行動の妥当性チェック
- [ ] 全プレイヤーの行動収集
- [ ] 60秒タイムリミット機能

### 5.2 戦闘システムの完成

- [ ] マッチアップ判定の実装 ✅ ロジック完成
- [ ] ダメージ計算 ✅ ロジック完成
- [ ] デスペナルティ
- [ ] リスポーンシステム

### 5.3 リソース管理

- [ ] ファームによるゴールド獲得
- [ ] 経験値・レベルアップ
- [ ] ジャングルバフ

### 5.4 タワー・オブジェクトシステム

- [ ] タワー攻撃
- [ ] タワー破壊
- [ ] ドラゴン/バロン/ヘラルド

### 5.5 アイテムシステム

- [ ] アイテムショップUI
- [ ] アイテム購入
- [ ] アイテム効果の適用

### 5.6 スキルシステム

- [ ] スキル使用UI
- [ ] クールダウン管理
- [ ] スキル効果の適用

---

## フェーズ6: 高度な機能 ⏳

### 6.1 複数プレイヤー対応

- [ ] ルーム管理
- [ ] プレイヤー招待
- [ ] チーム編成UI

### 6.2 CPU AI（オプション）

- [ ] Easy AI
- [ ] Medium AI
- [ ] Hard AI

### 6.3 リプレイ機能

- [ ] ゲーム履歴の保存
- [ ] リプレイ再生

### 6.4 ゲーム前画面

- [ ] MainMenuコンポーネント
- [ ] Lobbyコンポーネント（ルーム作成・参加）
- [ ] CharacterSelectionコンポーネント

---

## フェーズ7: デプロイ（GCP最適化版） ⏳

### 7.1 Vercelへのフロントエンドデプロイ

#### src/client/.env.production

```env
VITE_API_URL=https://your-backend.uc.r.appspot.com
VITE_WS_URL=wss://your-backend.uc.r.appspot.com
```

#### Vercelへのデプロイ

```bash
cd src/client
npm install -g vercel
vercel --prod
```

**確認項目**:
- [ ] Vercelプロジェクトが作成された
- [ ] フロントエンドがVercelにデプロイされた
- [ ] 環境変数が設定された

**Vercel無料プラン確認**:
- 帯域幅: 100GB/月
- ビルド時間: 6,000分/月
- 十分な容量でフロントエンド配信可能 ✅

---

### 7.2 GCP e2-microへのバックエンドデプロイ

#### GCPインスタンス作成

```bash
# GCP CLIのインストール（未インストールの場合）
curl https://sdk.cloud.google.com | bash
gcloud init

# e2-microインスタンス作成（無料枠）
gcloud compute instances create trpg-backend \
  --zone=us-west1-b \
  --machine-type=e2-micro \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --tags=http-server,https-server

# ファイアウォールルール作成
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80 \
  --target-tags=http-server

gcloud compute firewall-rules create allow-https \
  --allow=tcp:443 \
  --target-tags=https-server
```

#### サーバーセットアップスクリプト

```bash
#!/bin/bash
# deploy_gcp.sh

# システム更新
sudo apt-get update
sudo apt-get upgrade -y

# Node.js 20 LTS インストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nginx インストール
sudo apt-get install -y nginx

# PM2 インストール
sudo npm install -g pm2

# プロジェクトクローン
git clone https://github.com/[your-repo]/GMlessTRPGapp.git
cd GMlessTRPGapp/src/server

# 依存関係インストール
npm install

# ビルド
npm run build

# 環境変数設定
cat > .env.production << EOF
NODE_ENV=production
PORT=4000
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
NODE_OPTIONS=--max-old-space-size=384
MAX_CONNECTIONS=70
CLIENT_URL=https://your-frontend.vercel.app
EOF

# PM2でサーバー起動（メモリ制限付き）
pm2 start dist/index.js \
  --name trpg-backend \
  --max-memory-restart 400M \
  --node-args="--max-old-space-size=384"

# PM2自動起動設定
pm2 startup
pm2 save

# Nginx設定
sudo cat > /etc/nginx/sites-available/trpg-backend << 'EOF'
server {
    listen 80;
    server_name _;

    # gzip圧縮（ネットワーク転送量削減）
    gzip on;
    gzip_types text/plain application/json application/javascript;
    gzip_min_length 1000;
    gzip_comp_level 6;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/trpg-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "Deployment completed!"
```

**確認項目**:
- [ ] GCP e2-microインスタンスが作成された
- [ ] Node.js 20がインストールされた
- [ ] Nginxがインストールされた
- [ ] PM2でサーバーが起動した
- [ ] メモリ使用量が400MB以内

---

### 7.3 モニタリング設定

#### メモリ使用量監視

```bash
# PM2でメモリ使用量を確認
pm2 monit

# システムメモリを確認
free -h

# プロセス毎のメモリ使用量
ps aux --sort=-%mem | head -n 10
```

#### ネットワーク転送量監視

```bash
# vnStatインストール
sudo apt-get install vnstat
vnstat -m  # 月間使用量
vnstat -d  # 日別使用量

# 警告スクリプト
cat > /home/ubuntu/check_bandwidth.sh << 'EOF'
#!/bin/bash
USAGE=$(vnstat --json | jq -r '.interfaces[0].traffic.month[0].tx')
LIMIT=$((1 * 1024 * 1024 * 1024)) # 1GB

if [ $USAGE -gt $((LIMIT * 80 / 100)) ]; then
  echo "警告: ネットワーク使用量が80%を超えました" | mail -s "Alert" admin@example.com
fi
EOF

chmod +x /home/ubuntu/check_bandwidth.sh

# 毎日実行
crontab -e
# 0 0 * * * /home/ubuntu/check_bandwidth.sh
```

**確認項目**:
- [ ] メモリ使用量が監視できる
- [ ] ネットワーク転送量が監視できる
- [ ] アラートが設定された

---

### 7.4 SSL/TLS設定（Let's Encrypt）

```bash
# Certbot インストール
sudo apt-get install certbot python3-certbot-nginx

# SSL証明書取得
sudo certbot --nginx -d your-domain.com

# 自動更新設定
sudo certbot renew --dry-run
```

**確認項目**:
- [ ] SSL証明書が取得された
- [ ] HTTPSでアクセスできる
- [ ] 自動更新が設定された

---

## 進捗チェックリスト

### フェーズ0: プロジェクト初期化 ✅
- [x] プロジェクト構造作成
- [x] package.json設定
- [x] TypeScript設定
- [x] Git設定

### フェーズ1: バックエンド基盤 ⏳
- [ ] Supabase PostgreSQLセットアップ 🆕
- [ ] Upstash Redisセットアップ 🆕
- [ ] サーバープロジェクト初期化
- [ ] 環境変数設定（GCP最適化版）
- [ ] Prisma初期化
- [ ] 基本サーバー実装（GCP最適化版）
- [x] ConfigLoader実装

### フェーズ2: ゲームロジック ✅
- [x] GameEngine実装
- [x] Character システム
- [x] Combat システム
- [x] RoundManager実装

### フェーズ3: フロントエンド基盤 ✅
- [x] クライアントプロジェクト初期化
- [x] Tailwind CSS設定
- [x] WebSocketサービス実装
- [x] Zustand状態管理
- [x] 基本UIコンポーネント
- [x] UI設計ドキュメント作成
- [x] MapView実装
- [x] ActionPanel実装
- [x] CombatLog実装

### フェーズ4: 統合とテスト ⏳
- [ ] サーバー・クライアント接続（GCP最適化版）
- [ ] 動作テスト

### フェーズ5: ゲーム機能 ⏳
- [ ] 行動宣言システム（UI完成、統合が必要）
- [ ] 戦闘システム（ロジック完成、統合が必要）
- [ ] リソース管理
- [ ] タワー・オブジェクト
- [ ] アイテムシステム（ルール完成、UI実装が必要）
- [ ] スキルシステム

### フェーズ6: 高度な機能 ⏳
- [ ] 複数プレイヤー対応
- [ ] CPU AI
- [ ] リプレイ機能
- [ ] ゲーム前画面

### フェーズ7: デプロイ（GCP最適化版） ⏳
- [ ] Vercelフロントエンドデプロイ 🆕
- [ ] GCP e2-microバックエンドデプロイ 🆕
- [ ] モニタリング設定 🆕
- [ ] SSL/TLS設定 🆕

---

## GCP最適化チェックリスト ⭐

### メモリ最適化
- [x] PostgreSQLを外部化（Supabase）
- [x] Redisを外部化（Upstash）
- [x] Node.jsヒープサイズを384MBに制限
- [x] PM2をシングルプロセスモードで起動
- [ ] メモリキャッシュを50MB以内に制限
- [ ] 同時接続数を70以内に制限

### ネットワーク最適化
- [x] フロントエンドをVercelで配信
- [ ] WebSocketメッセージを最小化（差分のみ）
- [x] gzip圧縮を有効化
- [x] レート制限を実装
- [x] 同時接続数を70以内に制限

### CPU最適化
- [x] 軽量なゲームロジック
- [x] キャッシュの活用（設定ファイル）
- [x] 非同期処理の活用
- [ ] インデックスの最適化

### ストレージ最適化
- [ ] ログローテーション
- [ ] 定期的なクリーンアップ
- [x] データベースを外部化

---

## 現在の実装状況サマリー

### ✅ 完了済み
1. **プロジェクト初期化** - ディレクトリ構造、package.json、TypeScript設定
2. **ゲームロジック** - ConfigLoader、GameEngine、Character、Combat、RoundManager
3. **フロントエンド基盤** - React + Vite + Tailwind、WebSocket、Zustand
4. **UI設計** - 設計ドキュメント、MapView、ActionPanel、CombatLog

### 🔄 次のステップ
1. **外部サービスセットアップ** - Supabase、Upstash
2. **バックエンドサーバー実装（GCP最適化版）** - Express + Socket.io + Prisma
3. **クライアント・サーバー統合** - WebSocket接続、リアルタイム通信
4. **アイテムショップUI** - ItemShopコンポーネント
5. **ゲーム前画面** - MainMenu、Lobby、CharacterSelection
6. **GCPデプロイ** - Vercel（フロントエンド）+ GCP e2-micro（バックエンド）

---

## 参考資料

- [GCP e2-micro無料枠](https://cloud.google.com/free/docs/free-cloud-features#compute)
- [Supabase無料プラン](https://supabase.com/pricing)
- [Upstash無料プラン](https://upstash.com/pricing)
- [Vercel無料プラン](https://vercel.com/pricing)
- [GCP最適化設計ドキュメント](./gcp_optimized_design.md)

---

## 変更履歴

- 2025-11-14: GCP最適化要件を組み込んだ実装ロードマップ作成
  - フェーズ1に外部サービス（Supabase、Upstash）セットアップを追加
  - フェーズ1.5にGCP最適化版サーバー実装を追加
  - フェーズ4にRedis統合を追加
  - フェーズ7にVercel + GCP e2-microデプロイメントを追加
  - GCP最適化チェックリストを追加
- 2025-11-13: 初版作成（system_todo.md）
  - フェーズ0: プロジェクト初期化 完了
  - フェーズ2: ゲームロジック 完了
  - フェーズ3: フロントエンド基盤 完了
  - フェーズ3.5: UI拡張 完了
