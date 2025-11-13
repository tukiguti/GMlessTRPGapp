# システム実装手順 (system_todo.md)

## 概要

GMレスLoL風TRPGをWebアプリケーションとして実装するための詳細な手順書。
フェーズごとに段階的に実装を進める。

---

## 前提条件

### 必要な環境
- Node.js 20 LTS以上
- npm または yarn
- PostgreSQL 15以上（Docker推奨）
- Git

### 参照ドキュメント
- [アーキテクチャ設計](./docs/system/architecture.md)
- [技術スタック](./docs/system/technology_stack.md)
- [設定管理設計](./docs/system/configuration_management.md)
- [ゲームルール総合索引](./docs/game_rules.md)

---

## フェーズ0: プロジェクト初期化

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
- [ ] ディレクトリ構造が作成された
- [ ] config/ ディレクトリが存在する
- [ ] docs/ ディレクトリが存在する

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
- [ ] package.json が作成された
- [ ] workspaces が設定された

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
- [ ] tsconfig.json が作成された
- [ ] パスエイリアスが設定された

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
- [ ] .gitignore が適切に設定された
- [ ] config/game_balance.yaml はコミット対象（除外しない）

---

## フェーズ1: バックエンド基盤構築

### 1.1 サーバープロジェクトの初期化

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
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.7.0",
    "@prisma/client": "^5.0.0",
    "js-yaml": "^4.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/js-yaml": "^4.0.0",
    "@types/cors": "^2.8.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "nodemon": "^3.0.0",
    "prisma": "^5.0.0"
  }
}
```

```bash
npm install
```

**確認項目**:
- [ ] package.json が作成された
- [ ] 依存関係がインストールされた

---

### 1.2 環境変数の設定

#### src/server/.env

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://trpg_user:trpg_password@localhost:5432/trpg_db
REDIS_URL=redis://localhost:6379
```

**確認項目**:
- [ ] .env ファイルが作成された
- [ ] .gitignore に .env が含まれている

---

### 1.3 Prismaの初期化

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
  state     Json     // ゲーム状態全体
  status    String   @default("waiting") // "waiting", "in_progress", "finished"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  players   Player[]
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

```bash
# マイグレーション実行
npx prisma migrate dev --name init
npx prisma generate
```

**確認項目**:
- [ ] Prismaスキーマが作成された
- [ ] マイグレーションが実行された
- [ ] Prisma Clientが生成された

---

### 1.4 基本サーバーの実装

#### src/server/src/index.ts

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// ミドルウェア
app.use(cors());
app.use(express.json());

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// WebSocket接続
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

```bash
npm run dev
```

**確認項目**:
- [ ] サーバーが起動する
- [ ] http://localhost:4000/health にアクセスできる

---

### 1.5 ConfigLoaderの実装

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

// ... 残りの型定義
```

#### src/game/config/ConfigLoader.ts

```typescript
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { GameConfig } from './types';

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
- [ ] ConfigLoader が実装された
- [ ] game_balance.yaml が正常に読み込める
- [ ] テストが通る

---

## フェーズ2: ゲームロジック実装

### 2.1 ゲームエンジンの基本構造

#### src/game/engine/GameEngine.ts

```typescript
import { ConfigLoader } from '../config/ConfigLoader';

export interface GameState {
  gameId: string;
  round: number;
  phase: 'declaration' | 'resolution';
  teams: {
    blue: Character[];
    red: Character[];
  };
  towers: Tower[];
  minions: Minion[];
  buffs: Buff[];
}

export class GameEngine {
  private games: Map<string, GameState> = new Map();

  createGame(gameId: string): GameState {
    const initialState: GameState = {
      gameId,
      round: 0,
      phase: 'declaration',
      teams: {
        blue: [],
        red: []
      },
      towers: this.initializeTowers(),
      minions: [],
      buffs: []
    };

    this.games.set(gameId, initialState);
    return initialState;
  }

  getGameState(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  private initializeTowers(): Tower[] {
    const config = ConfigLoader.get();
    const towerHp = config.tower_system.hp;

    return [
      // ブルーチーム
      { id: 'blue_nexus', team: 'blue', type: 'nexus', hp: towerHp.nexus, maxHp: towerHp.nexus },
      { id: 'blue_nexus_tower', team: 'blue', type: 'nexus_tower', hp: towerHp.nexus_tower, maxHp: towerHp.nexus_tower },
      { id: 'blue_top_inner', team: 'blue', type: 'inner', lane: 'TOP', hp: towerHp.inner_tower, maxHp: towerHp.inner_tower },
      // ... 他のタワー

      // レッドチーム
      { id: 'red_nexus', team: 'red', type: 'nexus', hp: towerHp.nexus, maxHp: towerHp.nexus },
      // ... 他のタワー
    ];
  }
}
```

**確認項目**:
- [ ] GameEngine クラスが実装された
- [ ] ゲーム状態の初期化ができる

---

### 2.2 キャラクターシステム

#### src/game/systems/Character.ts

```typescript
import { ConfigLoader } from '../config/ConfigLoader';

export interface Character {
  id: string;
  name: string;
  role: string;
  lane: string;
  level: number;
  hp: number;
  maxHp: number;
  gold: number;
  stats: {
    attack: number;
    defense: number;
    mobility: number;
    utility: number;
  };
  position: {
    area: string;
    lane: string;
  };
  buffs: Buff[];
  skills: {
    normal: Skill;
    ult: Skill;
  };
  items: Item[];
}

export function createCharacter(
  name: string,
  role: string,
  lane: string
): Character {
  const initialStats = ConfigLoader.getCharacterStats(role);

  return {
    id: crypto.randomUUID(),
    name,
    role,
    lane,
    level: 1,
    hp: initialStats.hp,
    maxHp: initialStats.hp,
    gold: 0,
    stats: {
      attack: initialStats.attack,
      defense: initialStats.defense,
      mobility: initialStats.mobility,
      utility: initialStats.utility
    },
    position: {
      area: lane,
      lane
    },
    buffs: [],
    skills: {
      normal: { type: 'damage', cooldown: 0 },
      ult: { type: 'damage', cooldown: 0 }
    },
    items: []
  };
}

export function levelUp(character: Character): void {
  const growth = ConfigLoader.getGrowthStats(character.role);

  character.maxHp += growth.hp;
  character.hp += growth.hp;
  character.stats.attack += growth.attack;
  character.stats.defense += growth.defense;
  character.stats.mobility += growth.mobility;
  character.stats.utility += growth.utility;
  character.level += 1;
}
```

**確認項目**:
- [ ] Character型が定義された
- [ ] createCharacter関数が実装された
- [ ] levelUp関数が実装された

---

### 2.3 戦闘システム（マッチアップ判定）

#### src/game/systems/Combat.ts

```typescript
import { ConfigLoader } from '../config/ConfigLoader';

export function rollDice(sides: number = 20): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function calculateMatchupScore(
  character: Character,
  modifiers: number = 0
): number {
  const dice = rollDice(20);
  const attackStat = character.stats.attack;

  return dice + attackStat + modifiers;
}

export function resolveMatchup(
  attacker: Character,
  defender: Character,
  attackerModifiers: number = 0,
  defenderModifiers: number = 0
): { winner: Character; loser: Character; damage: number } {
  const attackerScore = calculateMatchupScore(attacker, attackerModifiers);
  const defenderScore = calculateMatchupScore(defender, defenderModifiers);

  const winner = attackerScore >= defenderScore ? attacker : defender;
  const loser = attackerScore >= defenderScore ? defender : attacker;

  const damage = calculateDamage(
    attackerScore,
    defenderScore,
    loser.stats.defense
  );

  return { winner, loser, damage };
}

export function calculateDamage(
  attackerScore: number,
  defenderScore: number,
  defenderDefense: number
): number {
  const config = ConfigLoader.get();
  const multiplier = config.combat_system.damage_multiplier;

  const difference = Math.abs(attackerScore - defenderScore);
  const rawDamage = difference * multiplier;
  const finalDamage = rawDamage - defenderDefense;

  return Math.max(0, finalDamage);
}
```

**テスト**:

```typescript
// src/game/systems/Combat.test.ts
import { describe, it, expect } from 'vitest';
import { calculateDamage } from './Combat';

describe('Combat System', () => {
  it('should calculate damage correctly', () => {
    const damage = calculateDamage(25, 15, 5);
    expect(damage).toBe(95); // (25 - 15) * 10 - 5 = 95
  });

  it('should return 0 for negative damage', () => {
    const damage = calculateDamage(10, 20, 50);
    expect(damage).toBe(0);
  });
});
```

**確認項目**:
- [ ] マッチアップ判定が実装された
- [ ] ダメージ計算が実装された
- [ ] テストが通る

---

### 2.4 ラウンド進行システム

#### src/game/engine/RoundManager.ts

```typescript
import { GameState } from './GameEngine';
import { resolveMatchup } from '../systems/Combat';

export class RoundManager {
  static async startDeclarationPhase(gameState: GameState): Promise<void> {
    gameState.phase = 'declaration';
    gameState.round += 1;

    console.log(`[Round ${gameState.round}] Declaration phase started`);

    // タイムリミット: 60秒
    // プレイヤーの行動宣言を待つ
  }

  static async resolveRound(gameState: GameState): Promise<void> {
    gameState.phase = 'resolution';

    console.log(`[Round ${gameState.round}] Resolution phase started`);

    // 2-1. クリーンアップ処理
    this.cleanupBuffs(gameState);

    // 2-2. 移動解決
    this.resolveMovement(gameState);

    // 2-3. ガンク判定
    this.resolveGanks(gameState);

    // 2-4. マッチアップ発生判定
    const matchups = this.findMatchups(gameState);

    // 2-7. マッチアップ判定
    for (const matchup of matchups) {
      const result = resolveMatchup(matchup.attacker, matchup.defender);
      console.log(`${result.winner.name} wins! ${result.damage} damage dealt`);

      // HP減少
      result.loser.hp -= result.damage;

      // デス判定
      if (result.loser.hp <= 0) {
        this.handleDeath(result.loser, gameState);
      }
    }

    // 2-9. ファーム・リソース獲得
    this.resolveFarming(gameState);

    // 2-12. ミニオン処理
    this.spawnMinions(gameState);
    this.processMinions(gameState);

    // 2-13. 結果更新
    this.updateExperience(gameState);
  }

  private static cleanupBuffs(gameState: GameState): void {
    // バフの持続時間を減少
    for (const team of [gameState.teams.blue, gameState.teams.red]) {
      for (const character of team) {
        character.buffs = character.buffs
          .map(buff => ({ ...buff, duration: buff.duration - 1 }))
          .filter(buff => buff.duration > 0);
      }
    }
  }

  private static resolveMovement(gameState: GameState): void {
    // 移動処理の実装
  }

  private static resolveGanks(gameState: GameState): void {
    // ガンク判定の実装
  }

  private static findMatchups(gameState: GameState): Matchup[] {
    // 同じエリアにいるキャラクター同士のマッチアップを見つける
    const matchups: Matchup[] = [];
    // ... 実装
    return matchups;
  }

  private static handleDeath(character: Character, gameState: GameState): void {
    console.log(`${character.name} has died!`);
    // デスペナルティの処理
    // リスポーンタイマーの設定
  }

  private static resolveFarming(gameState: GameState): void {
    // ファームによるゴールド獲得
  }

  private static spawnMinions(gameState: GameState): void {
    const config = ConfigLoader.get();
    if (gameState.round % config.minion_system.spawn_frequency === 0) {
      // ミニオンをスポーン
    }
  }

  private static processMinions(gameState: GameState): void {
    // ミニオンのタワー攻撃
    // タワーのミニオン攻撃
  }

  private static updateExperience(gameState: GameState): void {
    // 経験値獲得とレベルアップ判定
  }
}
```

**確認項目**:
- [ ] RoundManager が実装された
- [ ] ラウンド進行フローが実装された

---

## フェーズ3: フロントエンド基盤構築

### 3.1 クライアントプロジェクトの初期化

```bash
cd src/client
npm create vite@latest . -- --template react-ts
npm install
```

#### 追加依存関係のインストール

```bash
npm install socket.io-client zustand
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**確認項目**:
- [ ] Viteプロジェクトが作成された
- [ ] 依存関係がインストールされた

---

### 3.2 Tailwind CSSの設定

#### tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**確認項目**:
- [ ] Tailwind CSSが設定された

---

### 3.3 WebSocketサービスの実装

#### src/services/websocket.ts

```typescript
import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private socket: Socket;
  private static instance: WebSocketService;

  private constructor() {
    this.socket = io('http://localhost:4000');

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  static getInstance(): WebSocketService {
    if (!this.instance) {
      this.instance = new WebSocketService();
    }
    return this.instance;
  }

  joinGame(gameId: string) {
    this.socket.emit('join_game', { gameId });
  }

  onGameState(callback: (state: any) => void) {
    this.socket.on('game_state', callback);
  }

  onGameUpdate(callback: (state: any) => void) {
    this.socket.on('game_update', callback);
  }

  sendAction(action: any) {
    this.socket.emit('player_action', action);
  }
}
```

**確認項目**:
- [ ] WebSocketサービスが実装された

---

### 3.4 状態管理（Zustand）

#### src/stores/gameStore.ts

```typescript
import { create } from 'zustand';

interface Character {
  id: string;
  name: string;
  role: string;
  hp: number;
  maxHp: number;
  // ...
}

interface GameState {
  gameId: string | null;
  round: number;
  phase: 'declaration' | 'resolution';
  characters: Character[];

  setGameState: (state: Partial<GameState>) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameId: null,
  round: 0,
  phase: 'declaration',
  characters: [],

  setGameState: (state) => set((prev) => ({ ...prev, ...state })),

  updateCharacter: (id, updates) =>
    set((prev) => ({
      characters: prev.characters.map((char) =>
        char.id === id ? { ...char, ...updates } : char
      )
    }))
}));
```

**確認項目**:
- [ ] Zustand ストアが実装された

---

### 3.5 基本UIコンポーネント

#### src/components/GameBoard.tsx

```tsx
import React from 'react';
import { useGameStore } from '../stores/gameStore';

export const GameBoard: React.FC = () => {
  const { round, phase, characters } = useGameStore();

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">ラウンド {round}</h2>
        <p>フェーズ: {phase === 'declaration' ? '行動宣言' : '解決'}</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {characters.map((char) => (
          <div key={char.id} className="border p-4 rounded">
            <h3 className="font-bold">{char.name}</h3>
            <p>HP: {char.hp} / {char.maxHp}</p>
            <p>Role: {char.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**確認項目**:
- [ ] GameBoard コンポーネントが実装された

---

## フェーズ4: 統合とテスト

### 4.1 サーバーとクライアントの接続

#### src/server/src/websocket/connection.ts

```typescript
import { Server, Socket } from 'socket.io';
import { GameEngine } from '../../game/engine/GameEngine';

const gameEngine = new GameEngine();

export function setupWebSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Player connected:', socket.id);

    socket.on('create_game', (data) => {
      const gameId = crypto.randomUUID();
      const gameState = gameEngine.createGame(gameId);

      socket.join(gameId);
      socket.emit('game_created', { gameId, gameState });
    });

    socket.on('join_game', ({ gameId }) => {
      socket.join(gameId);
      const gameState = gameEngine.getGameState(gameId);
      socket.emit('game_state', gameState);
    });

    socket.on('player_action', async (action) => {
      const gameId = Array.from(socket.rooms)[1];
      // アクション処理
      const newState = gameEngine.getGameState(gameId);
      io.to(gameId).emit('game_update', newState);
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
    });
  });
}
```

#### src/server/src/index.ts に統合

```typescript
import { setupWebSocket } from './websocket/connection';

// ...

setupWebSocket(io);
```

**確認項目**:
- [ ] WebSocket接続が動作する
- [ ] クライアントからサーバーに接続できる

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

**確認項目**:
- [ ] サーバーが起動する
- [ ] クライアントが起動する
- [ ] WebSocket接続が確立される

---

## フェーズ5: ゲーム機能の実装

### 5.1 行動宣言システム

- [ ] 行動選択UI（攻撃/ファーム/移動/リコール）
- [ ] 行動の妥当性チェック
- [ ] 全プレイヤーの行動収集

### 5.2 戦闘システムの完成

- [ ] マッチアップ判定の実装
- [ ] ダメージ計算
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

## フェーズ6: 高度な機能

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

---

## フェーズ7: デプロイ

### 7.1 Docker化

#### Dockerfile (サーバー)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
```

#### docker-compose.yml

```yaml
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

  server:
    build: ./src/server
    ports:
      - "4000:4000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://trpg_user:trpg_password@postgres:5432/trpg_db

  client:
    build: ./src/client
    ports:
      - "3000:80"

volumes:
  postgres_data:
```

**確認項目**:
- [ ] Dockerイメージがビルドできる
- [ ] docker-composeで起動できる

---

## 進捗チェックリスト

### フェーズ0: プロジェクト初期化 ✅
- [x] プロジェクト構造作成
- [x] package.json設定
- [x] TypeScript設定
- [x] Git設定

### フェーズ1: バックエンド基盤 ⏳
- [ ] サーバープロジェクト初期化
- [ ] 環境変数設定
- [ ] Prisma初期化
- [ ] 基本サーバー実装
- [x] ConfigLoader実装（フェーズ2で完了）

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

### フェーズ3.5: UI拡張（追加実装） ✅
- [x] UI設計ドキュメント作成
- [x] MapView実装（LoL風SVGマップ）
- [x] ActionPanel実装（行動選択パネル）
- [x] CombatLog実装（戦闘ログ）

### フェーズ4: 統合とテスト ⏳
- [ ] サーバー・クライアント接続
- [ ] 動作テスト

### フェーズ5: ゲーム機能 ⏳
- [ ] 行動宣言システム（UI完成、バックエンド統合が必要）
- [ ] 戦闘システム（ロジック完成、統合が必要）
- [ ] リソース管理
- [ ] タワー・オブジェクト
- [ ] アイテムシステム（ルール完成、UI実装が必要）
- [ ] スキルシステム

### フェーズ6: 高度な機能 ⏳
- [ ] 複数プレイヤー対応
- [ ] CPU AI
- [ ] リプレイ機能
- [ ] ゲーム前画面（メインメニュー、ロビー、キャラ選択）

### フェーズ7: デプロイ ⏳
- [ ] Docker化
- [ ] 本番環境デプロイ

---

## 現在の実装状況サマリー

### ✅ 完了済み
1. **プロジェクト初期化** - ディレクトリ構造、package.json、TypeScript設定
2. **ゲームロジック** - ConfigLoader、GameEngine、Character、Combat、RoundManager
3. **フロントエンド基盤** - React + Vite + Tailwind、WebSocket、Zustand
4. **UI設計** - 設計ドキュメント、MapView、ActionPanel、CombatLog

### 🔄 次のステップ
1. **バックエンドサーバー実装** - Express + Socket.io + Prisma
2. **クライアント・サーバー統合** - WebSocket接続、リアルタイム通信
3. **アイテムショップUI** - ItemShopコンポーネント
4. **ゲーム前画面** - MainMenu、Lobby、CharacterSelection

---

## 変更履歴

- 2025-11-13: 進捗状況を更新
  - フェーズ0: プロジェクト初期化 完了
  - フェーズ2: ゲームロジック 完了
  - フェーズ3: フロントエンド基盤 完了
  - フェーズ3.5: UI拡張（MapView、ActionPanel、CombatLog）完了
  - 現在の実装状況サマリーを追加
- 2025-11-11: 初版作成
