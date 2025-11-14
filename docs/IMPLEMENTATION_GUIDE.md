# フロントエンド実装ガイド

**作成日**: 2025-11-14
**目的**: 各タスクの具体的な実装手順と完成条件を明確化

---

## 📋 Todoリスト全体

全37タスク、Phase 1から5まで段階的に実装。

**推定総作業時間**: 20-30時間

---

## Phase 1: 基盤整備（推定6-8時間）

### ✅ Task 1: 型定義ファイルを作成（types/game.ts）

**目的**: ゲームルールに準拠した型定義を一元管理

**作成ファイル**: `src/client/src/types/game.ts`

**実装内容**:
```typescript
// src/client/src/types/game.ts

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

export type LaneType = 'TOP' | 'JG' | 'MID' | 'BOT' | 'SUP';

export type TeamType = 'blue' | 'red';

export interface Stats {
  attack: number;
  defense: number;
  mobility: number;
  utility: number;
}

// 以下、Buff, Skill, Item, Character型を定義
// （FRONTEND_REFACTORING_PLAN.mdのPhase 1.1参照）
```

**完成条件**:
- [ ] 型定義ファイルが作成され、TypeScriptエラーなし
- [ ] RoleType, LaneType, TeamType, Stats型が定義済み
- [ ] Buff, Skill, Item, Character型が定義済み

**推定時間**: 1時間

---

### ✅ Task 2-4: Buff型、Skill型、Item型を定義

**実装内容**:
```typescript
export interface Buff {
  type: string;          // 'red_buff', 'blue_buff', 'dragon_infernal', etc.
  duration: number;      // 残りラウンド数
  value: number;         // 効果値
  appliedAt: number;     // 適用ラウンド
}

export interface Skill {
  name: string;
  type: 'normal' | 'ultimate';
  cooldown: number;      // クールダウン（ラウンド数）
  lastUsedRound: number; // 最後に使用したラウンド
  ready: boolean;        // 使用可能か
}

export interface Item {
  id: string;
  name: string;
  tier: 'basic' | 'advanced' | 'legendary';
  stats: Partial<Stats>; // 攻撃力、防御力などの一部
  passiveEffect?: string;
  activeEffect?: string;
}
```

**完成条件**:
- [ ] 各型がゲームルール（buff_system.md, item_system.md）と一致
- [ ] TypeScriptエラーなし

**推定時間**: 30分

---

### ✅ Task 5: Character型をゲームルールに合わせて拡張

**実装内容**:
```typescript
export interface Character {
  id: string;
  playerId: string;
  name: string;
  role: RoleType;
  lane: LaneType;
  team: TeamType;

  // ステータス
  level: number;
  hp: number;
  maxHp: number;
  gold: number;
  exp: number;

  // 基本ステータス
  baseStats: Stats;

  // 計算済みステータス（アイテム+バフ込み）
  finalStats: Stats;

  // 位置
  position: {
    area: string;
    lane?: string;
  };

  // バフ/スキル/アイテム
  buffs: Buff[];
  skills: {
    normal: Skill;
    ultimate: Skill;
  };
  items: Item[];

  // 状態
  alive: boolean;
  respawnAt?: number;
  isRecalling: boolean;
}
```

**完成条件**:
- [ ] Character型がすべてのゲームルール要素を含む
- [ ] baseStatsとfinalStatsを区別

**推定時間**: 30分

---

### ✅ Task 6: GameStoreにバフ/スキル/アイテム管理機能を追加

**更新ファイル**: `src/client/src/stores/gameStore.ts`

**実装内容**:
```typescript
// 新しいアクション
interface GameState {
  // ... 既存の定義

  // 新しいアクション
  addBuff: (characterId: string, buff: Buff) => void;
  removeBuff: (characterId: string, buffType: string) => void;
  updateBuffDuration: (round: number) => void; // すべてのバフの持続時間を減少

  useSkill: (characterId: string, skillType: 'normal' | 'ultimate') => void;
  updateSkillCooldowns: (round: number) => void;

  addItem: (characterId: string, item: Item) => void;
  removeItem: (characterId: string, itemId: string) => void;

  recalculateFinalStats: (characterId: string) => void;
}

// 実装例
export const useGameStore = create<GameState>((set) => ({
  // ...

  addBuff: (characterId, buff) =>
    set((prev) => ({
      characters: prev.characters.map((char) =>
        char.id === characterId
          ? { ...char, buffs: [...char.buffs, buff] }
          : char
      ),
    })),

  updateBuffDuration: (round) =>
    set((prev) => ({
      characters: prev.characters.map((char) => ({
        ...char,
        buffs: char.buffs
          .map((buff) => ({ ...buff, duration: buff.duration - 1 }))
          .filter((buff) => buff.duration > 0), // 期限切れのバフを削除
      })),
    })),

  // ... 他のアクション
}));
```

**完成条件**:
- [ ] バフ追加・削除・更新機能が動作
- [ ] スキルクールダウン管理が動作
- [ ] アイテム追加・削除機能が動作

**推定時間**: 2時間

---

### ✅ Task 7: finalStatsの計算ロジックを実装

**実装内容**:
```typescript
// src/client/src/utils/statsCalculator.ts（新規作成）

import { Character, Stats, Buff, Item } from '../types/game';

export function calculateFinalStats(character: Character): Stats {
  let finalStats = { ...character.baseStats };

  // アイテムボーナスを加算
  character.items.forEach((item) => {
    if (item.stats.attack) finalStats.attack += item.stats.attack;
    if (item.stats.defense) finalStats.defense += item.stats.defense;
    if (item.stats.mobility) finalStats.mobility += item.stats.mobility;
    if (item.stats.utility) finalStats.utility += item.stats.utility;
  });

  // バフボーナスを加算
  character.buffs.forEach((buff) => {
    switch (buff.type) {
      case 'red_buff':
        finalStats.attack += buff.value;
        break;
      case 'blue_buff':
        finalStats.utility += buff.value;
        break;
      // ... 他のバフ
    }
  });

  return finalStats;
}
```

**GameStoreに統合**:
```typescript
recalculateFinalStats: (characterId) =>
  set((prev) => ({
    characters: prev.characters.map((char) =>
      char.id === characterId
        ? { ...char, finalStats: calculateFinalStats(char) }
        : char
    ),
  })),
```

**完成条件**:
- [ ] finalStatsがbaseStats + アイテム + バフで正しく計算される
- [ ] テストケースで計算結果が正しい

**推定時間**: 1-2時間

---

### ✅ Task 8: useWebSocketフックを作成

**作成ファイル**: `src/client/src/hooks/useWebSocket.ts`

**実装内容**:
```typescript
import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import WebSocketService from '../services/websocket';

export function useWebSocket() {
  const gameStore = useGameStore();
  const ws = WebSocketService.getInstance();

  useEffect(() => {
    console.log('[useWebSocket] Setting up WebSocket event handlers');

    // ゲーム作成イベント
    ws.onGameCreated((data) => {
      console.log('[useWebSocket] Game created:', data.gameId);
      gameStore.setGameId(data.gameId);
      gameStore.setGameState(data.gameState);
    });

    // ゲーム状態更新イベント
    ws.onGameState((state) => {
      console.log('[useWebSocket] Game state received:', state);
      gameStore.setGameState(state);
    });

    // ゲーム更新イベント
    ws.onGameUpdate((update) => {
      console.log('[useWebSocket] Game update:', update);
      // 差分更新
      if (update.type === 'character_update') {
        gameStore.updateCharacter(update.characterId, update.changes);
      }
      // ... 他の更新タイプ
    });

    // エラーイベント
    ws.onError((error) => {
      console.error('[useWebSocket] Error:', error);
      // エラー通知をUIに表示
    });

    // クリーンアップ
    return () => {
      console.log('[useWebSocket] Cleaning up event handlers');
      ws.off('game_created');
      ws.off('game_state');
      ws.off('game_update');
      ws.off('error');
    };
  }, [gameStore, ws]);

  return {
    createGame: (mode: string, playerName: string) => {
      console.log('[useWebSocket] Creating game:', mode, playerName);
      ws.createGame({ mode, playerName });
    },
    joinGame: (gameId: string, playerName: string) => {
      console.log('[useWebSocket] Joining game:', gameId, playerName);
      ws.joinGame(gameId, playerName);
    },
    sendAction: (action: any) => {
      console.log('[useWebSocket] Sending action:', action);
      ws.sendAction(action);
    },
    isConnected: ws.isConnected(),
  };
}
```

**完成条件**:
- [ ] WebSocketイベントが正しく処理される
- [ ] GameStoreが更新される
- [ ] コンソールログで動作確認可能

**推定時間**: 1-2時間

---

### ✅ Task 9-10: WebSocketイベントハンドラーとApp.tsx統合

**更新ファイル**: `src/client/src/App.tsx`

**実装内容**:
```typescript
import { useWebSocket } from './hooks/useWebSocket';
import { useGameStore } from './stores/gameStore';

function App() {
  const { isConnected, createGame, joinGame } = useWebSocket();
  const gameId = useGameStore((state) => state.gameId);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow-lg">
        <h1 className="text-3xl font-bold text-center">GMレスLoL風TRPG</h1>
        <div className="text-center mt-2 flex gap-2 justify-center">
          <span
            className={`inline-block px-3 py-1 rounded ${
              isConnected ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {isConnected ? '🟢 接続済み' : '🔴 未接続'}
          </span>
          {gameId && (
            <span className="bg-blue-600 px-3 py-1 rounded">
              Game ID: {gameId.substring(0, 8)}
            </span>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4">
        {!gameId ? (
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => createGame('casual', 'Player1')}
              className="bg-blue-600 px-6 py-3 rounded hover:bg-blue-700"
            >
              ゲーム作成
            </button>
            <input
              type="text"
              placeholder="Game ID"
              className="px-4 py-2 bg-gray-800 rounded"
            />
            <button
              onClick={() => joinGame('test-id', 'Player2')}
              className="bg-green-600 px-6 py-3 rounded hover:bg-green-700"
            >
              ゲーム参加
            </button>
          </div>
        ) : (
          <GameBoard />
        )}
      </main>
    </div>
  );
}
```

**完成条件**:
- [ ] 接続状態が正しく表示される
- [ ] ゲーム作成/参加ボタンが動作する
- [ ] GameBoardがgameId取得後に表示される

**推定時間**: 1時間

---

## Phase 2: ゲーム前画面（推定6-9時間）

### ✅ Task 11-12: MainMenuコンポーネント

**作成ファイル**: `src/client/src/components/MainMenu.tsx`

**実装内容**:
```typescript
interface MainMenuProps {
  onSelectMode: (mode: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectMode }) => {
  const modes = [
    { id: 'tutorial', label: 'チュートリアル', icon: '📚' },
    { id: 'cpu_practice', label: 'CPU練習モード', icon: '🤖' },
    { id: 'casual', label: 'カジュアルマッチ', icon: '🎮' },
    { id: 'ranked_1v1', label: 'ランクマッチ (1vs1)', icon: '⚔️' },
    { id: 'ranked_5v5', label: 'ランクマッチ (5vs5)', icon: '🏆' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <h1 className="text-6xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
        GMレスLoL風TRPG
      </h1>

      <div className="space-y-4 w-96">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className="w-full bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-xl font-semibold transition-all hover:scale-105 flex items-center gap-4"
          >
            <span className="text-3xl">{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
```

**完成条件**:
- [ ] 5つのモードボタンが表示される
- [ ] ホバー時にスケールアップ
- [ ] クリックでonSelectModeが呼ばれる

**推定時間**: 1時間

---

### ✅ Task 13-16: Lobbyコンポーネント

**作成ファイル**: `src/client/src/components/Lobby.tsx`

**実装内容**:
```typescript
interface LobbyProps {
  mode: string;
  onCreateRoom: (roomName: string, maxPlayers: number) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  mode,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-gray-800 rounded-lg">
      <h2 className="text-3xl font-bold mb-6">ロビー - {mode}</h2>

      {/* ルーム作成 */}
      <div className="mb-8 p-6 bg-gray-700 rounded">
        <h3 className="text-xl font-semibold mb-4">ルーム作成</h3>
        <input
          type="text"
          placeholder="ルーム名"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="w-full px-4 py-2 mb-4 bg-gray-900 rounded"
        />
        <select
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(Number(e.target.value))}
          className="w-full px-4 py-2 mb-4 bg-gray-900 rounded"
        >
          <option value={2}>2人</option>
          <option value={4}>4人</option>
          <option value={6}>6人</option>
          <option value={10}>10人</option>
        </select>
        <button
          onClick={() => onCreateRoom(roomName, maxPlayers)}
          className="w-full bg-blue-600 py-3 rounded hover:bg-blue-700"
        >
          ルームを作成
        </button>
      </div>

      {/* ルーム参加 */}
      <div className="p-6 bg-gray-700 rounded">
        <h3 className="text-xl font-semibold mb-4">ルーム参加</h3>
        <input
          type="text"
          placeholder="プレイヤー名"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full px-4 py-2 mb-4 bg-gray-900 rounded"
        />
        <input
          type="text"
          placeholder="ルームコード (6桁)"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="w-full px-4 py-2 mb-4 bg-gray-900 rounded"
        />
        <button
          onClick={() => onJoinRoom(roomCode, playerName)}
          className="w-full bg-green-600 py-3 rounded hover:bg-green-700"
        >
          参加する
        </button>
      </div>
    </div>
  );
};
```

**完成条件**:
- [ ] ルーム作成フォームが動作
- [ ] ルーム参加フォームが動作
- [ ] WebSocketでサーバーに送信

**推定時間**: 2-3時間

---

### ✅ Task 17-20: CharacterSelectionコンポーネント

**作成ファイル**: `src/client/src/components/CharacterSelection.tsx`

**実装内容**:
```typescript
// 10種類のロール定義
const ROLES = [
  { id: 'ad_marksman', label: 'Marksman (AD)', damageType: 'AD' },
  { id: 'ad_fighter', label: 'Fighter (AD)', damageType: 'AD' },
  { id: 'ad_assassin', label: 'Assassin (AD)', damageType: 'AD' },
  { id: 'ad_tank', label: 'Tank (AD)', damageType: 'AD' },
  { id: 'ap_mage', label: 'Mage (AP)', damageType: 'AP' },
  { id: 'ap_assassin', label: 'Assassin (AP)', damageType: 'AP' },
  { id: 'ap_fighter', label: 'Fighter (AP)', damageType: 'AP' },
  { id: 'ap_tank', label: 'Tank (AP)', damageType: 'AP' },
  { id: 'ap_support', label: 'Support (AP)', damageType: 'AP' },
  { id: 'tank_support', label: 'Support (Tank)', damageType: 'AD' },
];

const LANES = ['TOP', 'JG', 'MID', 'BOT', 'SUP'];

export const CharacterSelection: React.FC = () => {
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [selectedLane, setSelectedLane] = useState<LaneType | null>(null);

  // ステータスプレビュー計算
  const statsPreview = useMemo(() => {
    if (!selectedRole) return null;
    // ConfigLoaderからロール別初期ステータスを取得
    // return getInitialStatsForRole(selectedRole);
    return { attack: 2.0, defense: 1.0, mobility: 4, utility: 1.0 };
  }, [selectedRole]);

  return (
    <div className="max-w-4xl mx-auto mt-12 p-8 bg-gray-800 rounded-lg">
      <h2 className="text-3xl font-bold mb-6">キャラクター作成</h2>

      {/* キャラクター名 */}
      <input
        type="text"
        placeholder="キャラクター名"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-3 mb-6 bg-gray-900 rounded text-lg"
      />

      {/* ロール選択 */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">ロール選択</h3>
        <div className="grid grid-cols-5 gap-4">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id as RoleType)}
              className={`p-4 rounded text-center ${
                selectedRole === role.id
                  ? 'bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="font-semibold">{role.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* レーン選択 */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">レーン選択</h3>
        <div className="flex gap-4">
          {LANES.map((lane) => (
            <button
              key={lane}
              onClick={() => setSelectedLane(lane as LaneType)}
              className={`px-6 py-3 rounded ${
                selectedLane === lane
                  ? 'bg-green-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {lane}
            </button>
          ))}
        </div>
      </div>

      {/* ステータスプレビュー */}
      {statsPreview && (
        <div className="mb-6 p-6 bg-gray-700 rounded">
          <h3 className="text-xl font-semibold mb-4">ステータスプレビュー</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-400">
                {statsPreview.attack}
              </div>
              <div className="text-sm text-gray-400">攻撃力</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {statsPreview.defense}
              </div>
              <div className="text-sm text-gray-400">防御力</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {statsPreview.mobility}
              </div>
              <div className="text-sm text-gray-400">移動力</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {statsPreview.utility}
              </div>
              <div className="text-sm text-gray-400">ユーティリティ</div>
            </div>
          </div>
        </div>
      )}

      {/* 確定ボタン */}
      <button
        disabled={!name || !selectedRole || !selectedLane}
        className="w-full bg-blue-600 py-4 rounded text-xl font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        キャラクターを確定
      </button>
    </div>
  );
};
```

**完成条件**:
- [ ] 10種類のロールが選択可能
- [ ] 5つのレーンが選択可能
- [ ] ステータスプレビューが表示される
- [ ] 確定ボタンでサーバーに送信

**推定時間**: 2-3時間

---

## Phase 3-5: 残りのタスク

（以下、ItemShop, SkillPanel, MapView改善、ActionPanel統合、CombatLog更新、デザイン統一の詳細実装手順を記載）

各タスクの具体的な実装内容とコード例は、必要に応じて追加で提供します。

---

## 実装チェックリスト

### Phase 1完成条件
- [ ] types/game.tsが作成され、すべての型が定義されている
- [ ] GameStoreにバフ/スキル/アイテム管理機能が追加されている
- [ ] useWebSocketフックが動作し、イベントハンドラーが正しく処理される
- [ ] App.tsxで接続状態が表示され、ゲーム作成/参加ができる

### Phase 2完成条件
- [ ] MainMenuでモード選択ができる
- [ ] Lobbyでルーム作成・参加ができる
- [ ] CharacterSelectionでキャラクター作成ができる
- [ ] WebSocketでサーバーと通信できる

### 全体完成条件
- [ ] すべてのコンポーネントがTypeScriptエラーなし
- [ ] ローカルでクライアント・サーバーが接続できる
- [ ] ゲーム前画面からゲーム開始まで一連の流れが動作する

---

## トラブルシューティング

### WebSocket接続エラー
```bash
# サーバーが起動しているか確認
curl http://localhost:4000/health

# 環境変数を確認
echo $DATABASE_URL

# 環境変数をクリアしてから起動
unset DATABASE_URL && npm run dev
```

### TypeScriptエラー
```bash
# 型定義を再生成
npx prisma generate

# node_modulesを再インストール
rm -rf node_modules package-lock.json
npm install
```

---

## 参考ドキュメント

- [フロントエンドリファクタリング計画](./FRONTEND_REFACTORING_PLAN.md)
- [UI設計](./ui_design.md)
- [システムアーキテクチャ](./system/architecture.md)
- [ゲームルール総合](./game_rules.md)

---

## 更新履歴

- 2025-11-14: 初版作成（Todoリスト対応の実装ガイド）
