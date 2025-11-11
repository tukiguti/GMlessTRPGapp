# 技術スタック選定

## 概要

GMレスLoL風TRPGの実装に使用する技術スタック、フレームワーク、ライブラリの選定理由と使用方法。

---

## 技術スタック全体像

```
┌─────────────────────────────────────────────────────────┐
│                     フロントエンド                        │
│  React 18 + TypeScript + Vite                          │
│  Tailwind CSS + shadcn/ui                              │
│  Zustand (状態管理)                                      │
│  Socket.IO Client (WebSocket)                          │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                     バックエンド                          │
│  Node.js 20 LTS + TypeScript                           │
│  Express.js (REST API)                                 │
│  Socket.IO (WebSocket)                                 │
│  Prisma (ORM)                                          │
│  js-yaml (設定ファイル読み込み)                          │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                      データベース                         │
│  PostgreSQL 15+                                        │
│  Redis 7+ (オプション)                                  │
└─────────────────────────────────────────────────────────┘
```

---

## フロントエンド

### 1. **React 18 + TypeScript**

#### 選定理由
- **React**: 豊富なエコシステム、コンポーネント再利用性、広いコミュニティ
- **TypeScript**: 型安全性、開発効率向上、バグ削減

#### パッケージ
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0"
}
```

#### 使用例
```typescript
// src/client/components/CharacterCard.tsx
interface CharacterCardProps {
  character: Character;
  onAction: (action: Action) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onAction
}) => {
  return (
    <div className="character-card">
      <h3>{character.name}</h3>
      <p>HP: {character.hp}</p>
      <p>攻撃力: {character.attack}</p>
      {/* ... */}
    </div>
  );
};
```

---

### 2. **Vite**

#### 選定理由
- 高速なHMR（Hot Module Replacement）
- 開発体験の向上
- 高速なビルド

#### 設定
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4000',
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true
      }
    }
  }
});
```

---

### 3. **Tailwind CSS + shadcn/ui**

#### 選定理由
- **Tailwind CSS**: ユーティリティファーストCSS、高速なスタイリング
- **shadcn/ui**: 美しいコンポーネントライブラリ、カスタマイズ性

#### パッケージ
```json
{
  "tailwindcss": "^3.4.0",
  "shadcn-ui": "^0.8.0",
  "@radix-ui/react-*": "^1.0.0"
}
```

#### 使用例
```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const ActionPanel = () => {
  return (
    <Card className="p-4">
      <Button variant="primary" onClick={handleAttack}>
        攻撃
      </Button>
      <Button variant="secondary" onClick={handleFarm}>
        ファーム
      </Button>
    </Card>
  );
};
```

---

### 4. **Zustand (状態管理)**

#### 選定理由
- Redux より軽量でシンプル
- TypeScript サポート
- React Hooksとの統合

#### パッケージ
```json
{
  "zustand": "^4.5.0"
}
```

#### 使用例
```typescript
// src/client/stores/gameStore.ts
import { create } from 'zustand';

interface GameState {
  gameId: string | null;
  round: number;
  phase: 'declaration' | 'resolution';
  characters: Character[];

  setGameState: (state: Partial<GameState>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameId: null,
  round: 0,
  phase: 'declaration',
  characters: [],

  setGameState: (state) => set((prev) => ({ ...prev, ...state }))
}));
```

---

### 5. **Socket.IO Client**

#### 選定理由
- リアルタイム通信に最適
- 自動再接続機能
- イベントベースの通信

#### パッケージ
```json
{
  "socket.io-client": "^4.7.0"
}
```

#### 使用例
```typescript
// src/client/services/websocket.ts
import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:4000');
  }

  joinGame(gameId: string) {
    this.socket.emit('join_game', { gameId });
  }

  onGameUpdate(callback: (state: GameState) => void) {
    this.socket.on('game_update', callback);
  }

  sendAction(action: Action) {
    this.socket.emit('player_action', action);
  }
}
```

---

## バックエンド

### 1. **Node.js 20 LTS + TypeScript**

#### 選定理由
- **Node.js**: JavaScriptエコシステム、高速なI/O処理
- **TypeScript**: 型安全性、コード品質向上

#### パッケージ
```json
{
  "node": "^20.0.0",
  "typescript": "^5.0.0",
  "@types/node": "^20.0.0"
}
```

---

### 2. **Express.js**

#### 選定理由
- シンプルで柔軟なWebフレームワーク
- 豊富なミドルウェア
- 広いコミュニティ

#### パッケージ
```json
{
  "express": "^4.18.0",
  "@types/express": "^4.17.0"
}
```

#### 使用例
```typescript
// src/server/api/game.ts
import express from 'express';
import { GameRepository } from '../database/repositories/GameRepository';

const router = express.Router();

router.post('/games', async (req, res) => {
  const { mode, players } = req.body;
  const game = await GameRepository.create({ mode, players });
  res.json({ gameId: game.id });
});

router.get('/games/:id', async (req, res) => {
  const game = await GameRepository.findById(req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json(game);
});

export default router;
```

---

### 3. **Socket.IO (サーバー)**

#### 選定理由
- リアルタイム双方向通信
- ルーム機能（ゲームセッション管理）
- 自動再接続

#### パッケージ
```json
{
  "socket.io": "^4.7.0"
}
```

#### 使用例
```typescript
// src/server/websocket/connection.ts
import { Server } from 'socket.io';
import { GameEngine } from '../game/engine/GameEngine';

export function setupWebSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('join_game', async ({ gameId }) => {
      socket.join(gameId);

      // ゲーム状態を送信
      const game = await GameEngine.getGameState(gameId);
      socket.emit('game_state', game);
    });

    socket.on('player_action', async (action) => {
      const gameId = Array.from(socket.rooms)[1];
      await GameEngine.handleAction(gameId, socket.id, action);

      // 全プレイヤーに状態更新を通知
      const newState = await GameEngine.getGameState(gameId);
      io.to(gameId).emit('game_update', newState);
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
    });
  });
}
```

---

### 4. **Prisma (ORM)**

#### 選定理由
- 型安全なデータベースクライアント
- 自動生成されたTypeScript型
- マイグレーション管理

#### パッケージ
```json
{
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0"
}
```

#### スキーマ例
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Game {
  id        String   @id @default(uuid())
  mode      String
  round     Int      @default(0)
  state     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  players   Player[]
}

model Player {
  id         String   @id @default(uuid())
  gameId     String
  socketId   String
  characters Character[]

  game       Game     @relation(fields: [gameId], references: [id])
}

model Character {
  id        String @id @default(uuid())
  playerId  String
  name      String
  role      String
  level     Int    @default(1)
  hp        Int
  stats     Json

  player    Player @relation(fields: [playerId], references: [id])
}
```

#### 使用例
```typescript
// src/server/database/repositories/GameRepository.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GameRepository {
  static async create(data: { mode: string; players: number }) {
    return await prisma.game.create({
      data: {
        mode: data.mode,
        state: {}
      }
    });
  }

  static async findById(id: string) {
    return await prisma.game.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            characters: true
          }
        }
      }
    });
  }

  static async update(id: string, data: any) {
    return await prisma.game.update({
      where: { id },
      data
    });
  }
}
```

---

### 5. **js-yaml (設定ファイル読み込み)**

#### 選定理由
- game_balance.yaml を読み込んでゲームロジックに適用
- 設定値の動的変更が容易

#### パッケージ
```json
{
  "js-yaml": "^4.1.0",
  "@types/js-yaml": "^4.0.0"
}
```

#### 使用例
```typescript
// src/game/config/ConfigLoader.ts
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

export interface GameConfig {
  character_initial_stats: Record<string, CharacterStats>;
  leveling_system: LevelingSystem;
  combat_system: CombatSystem;
  // ...
}

export class ConfigLoader {
  private static instance: GameConfig | null = null;

  static load(): GameConfig {
    if (this.instance) {
      return this.instance;
    }

    const configPath = path.join(__dirname, '../../../config/game_balance.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    this.instance = yaml.load(fileContents) as GameConfig;

    return this.instance;
  }

  static reload() {
    this.instance = null;
    return this.load();
  }
}

// 使用例
const config = ConfigLoader.load();
const marksmanStats = config.character_initial_stats.ad_marksman;
console.log(marksmanStats.hp); // 400
```

---

## データベース

### 1. **PostgreSQL 15+**

#### 選定理由
- ACID トランザクション
- JSON/JSONB サポート（複雑なゲーム状態の保存）
- 強力なクエリ機能
- Prisma との相性

#### インストール
```bash
# Docker Compose
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: trpg_user
      POSTGRES_PASSWORD: trpg_password
      POSTGRES_DB: trpg_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

### 2. **Redis 7+ (オプション)**

#### 選定理由
- セッションキャッシュ
- リアルタイムゲーム状態の高速アクセス
- Pub/Sub機能（将来的なスケーリング）

#### パッケージ
```json
{
  "redis": "^4.6.0"
}
```

#### 使用例
```typescript
// src/server/cache/RedisClient.ts
import { createClient } from 'redis';

export class RedisClient {
  private static client: ReturnType<typeof createClient>;

  static async connect() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    await this.client.connect();
  }

  static async cacheGameState(gameId: string, state: any) {
    await this.client.setEx(`game:${gameId}`, 3600, JSON.stringify(state));
  }

  static async getGameState(gameId: string) {
    const data = await this.client.get(`game:${gameId}`);
    return data ? JSON.parse(data) : null;
  }
}
```

---

## テスト

### 1. **Vitest (ユニットテスト)**

#### 選定理由
- Vite ネイティブ対応
- Jest 互換 API
- 高速な実行

#### パッケージ
```json
{
  "vitest": "^1.0.0",
  "@vitest/ui": "^1.0.0"
}
```

#### 使用例
```typescript
// src/game/systems/damage.test.ts
import { describe, it, expect } from 'vitest';
import { calculateDamage } from './damage';

describe('calculateDamage', () => {
  it('should calculate damage correctly', () => {
    const result = calculateDamage(25, 15, 5);
    expect(result).toBe(95); // (25 - 15) * 10 - 5 = 95
  });

  it('should return 0 for negative damage', () => {
    const result = calculateDamage(10, 20, 10);
    expect(result).toBe(0);
  });
});
```

---

### 2. **Playwright (E2Eテスト)**

#### 選定理由
- 実際のブラウザでテスト
- クロスブラウザ対応
- 強力なデバッグツール

#### パッケージ
```json
{
  "@playwright/test": "^1.40.0"
}
```

#### 使用例
```typescript
// tests/e2e/game-flow.spec.ts
import { test, expect } from '@playwright/test';

test('should create and join a game', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // ゲーム作成
  await page.click('button:has-text("新規ゲーム作成")');
  await page.fill('input[name="playerName"]', 'Player1');
  await page.click('button:has-text("参加")');

  // ゲーム画面が表示されることを確認
  await expect(page.locator('.game-board')).toBeVisible();
});
```

---

## 開発ツール

### 1. **ESLint + Prettier**

#### 選定理由
- コード品質の統一
- 自動フォーマット

#### パッケージ
```json
{
  "eslint": "^8.50.0",
  "prettier": "^3.0.0",
  "@typescript-eslint/parser": "^6.0.0",
  "@typescript-eslint/eslint-plugin": "^6.0.0"
}
```

---

### 2. **Husky + lint-staged**

#### 選定理由
- コミット前の自動チェック
- CI前にエラーを検出

#### パッケージ
```json
{
  "husky": "^8.0.0",
  "lint-staged": "^15.0.0"
}
```

---

## 依存関係まとめ

### package.json (フロントエンド)

```json
{
  "name": "gmless-trpg-client",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "vitest": "^1.0.0"
  }
}
```

### package.json (バックエンド)

```json
{
  "name": "gmless-trpg-server",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.7.0",
    "@prisma/client": "^5.0.0",
    "js-yaml": "^4.1.0",
    "redis": "^4.6.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/js-yaml": "^4.0.0",
    "typescript": "^5.0.0",
    "prisma": "^5.0.0",
    "vitest": "^1.0.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.9.0"
  }
}
```

---

## 変更履歴

- 2025-11-11: 初版作成
