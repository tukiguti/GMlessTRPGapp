# フロントエンドリファクタリング計画

**作成日**: 2025-11-14
**目的**: ゲームルール、UI設計、バックエンドサーバーとの整合性を確保したフロントエンド実装

---

## 現状分析

### ✅ 完成している項目
- 基本的なプロジェクト構造（React + Vite + Tailwind）
- Zustand状態管理の基本実装
- WebSocketServiceの基本実装
- 基本UIコンポーネント（MapView, ActionPanel, CombatLog等）

### ⚠️ 問題点

#### 1. **アーキテクチャの問題**
- App.txaがシンプルすぎる（ゲーム前画面、ルーティングなし）
- WebSocketとGameStoreの統合が不完全
- サーバーとのリアルタイム通信が未実装

#### 2. **ゲームルールとの不整合**
- GameStoreのCharacterモデルがゲームルールと一致していない
- バフ/デバフシステムが未実装
- スキルシステムの詳細が不足

#### 3. **UI/UXの不足**
- ゲーム前画面（MainMenu, Lobby, CharacterSelection）が未実装
- ItemShopが未実装
- SkillPanelが未実装
- リアルタイムフィードバックが不足

---

## リファクタリング計画

### Phase 1: 基盤整備（優先度：🔴高）

#### 1.1 GameStoreのリファクタリング

**目的**: ゲームルールに完全準拠した状態管理

**変更内容**:
```typescript
// 現在のCharacterモデル
interface Character {
  id: string;
  name: string;
  role: string;
  lane: string;
  level: number;
  hp: number;
  maxHp: number;
  gold: number;
  stats: { attack, defense, mobility, utility };
  position: { area, lane };
  buffs: any[];  // ← 不明確
  items: any[];  // ← 不明確
  alive: boolean;
}

// ↓ リファクタリング後

interface Buff {
  type: string;          // 'red_buff', 'blue_buff', 'dragon_infernal', etc.
  duration: number;      // 残りラウンド数
  value: number;         // 効果値
  appliedAt: number;     // 適用ラウンド
}

interface Skill {
  name: string;
  type: 'normal' | 'ultimate';
  cooldown: number;      // クールダウン（ラウンド数）
  lastUsedRound: number; // 最後に使用したラウンド
  ready: boolean;        // 使用可能か
}

interface Item {
  id: string;
  name: string;
  tier: 'basic' | 'advanced' | 'legendary';
  stats: {
    attack?: number;
    defense?: number;
    mobility?: number;
    utility?: number;
  };
  passiveEffect?: string; // パッシブ効果の説明
  activeEffect?: string;  // アクティブ効果の説明
}

interface Character {
  id: string;
  playerId: string;
  name: string;
  role: RoleType;        // 'ad_marksman', 'ad_fighter', etc.
  lane: LaneType;        // 'TOP', 'JG', 'MID', 'BOT', 'SUP'
  team: 'blue' | 'red';

  // ステータス
  level: number;
  hp: number;
  maxHp: number;
  gold: number;
  exp: number;           // 経験値

  // 基本ステータス
  baseStats: {
    attack: number;
    defense: number;
    mobility: number;
    utility: number;
  };

  // 計算済みステータス（アイテム+バフ込み）
  finalStats: {
    attack: number;
    defense: number;
    mobility: number;
    utility: number;
  };

  // 位置
  position: {
    area: string;        // 'BLUE_NEXUS', 'TOP_LANE', etc.
    lane?: string;       // 'TOP', 'MID', 'BOT'
  };

  // バフ/デバフ
  buffs: Buff[];

  // スキル
  skills: {
    normal: Skill;
    ultimate: Skill;
  };

  // アイテム
  items: Item[];         // 最大6個

  // 状態
  alive: boolean;
  respawnAt?: number;    // リスポーンするラウンド
  isRecalling: boolean;  // リコール中か
}
```

**実装ファイル**:
- `src/client/src/stores/gameStore.ts`
- `src/client/src/types/game.ts`（新規作成）

**推定時間**: 2-3時間

---

#### 1.2 WebSocket統合の完成

**目的**: クライアント・サーバー間のリアルタイム通信を確立

**実装内容**:
1. **useWebSocketフックの作成**
   ```typescript
   // src/client/src/hooks/useWebSocket.ts
   export function useWebSocket() {
     const gameStore = useGameStore();
     const ws = WebSocketService.getInstance();

     useEffect(() => {
       // 接続イベント
       ws.onGameCreated((data) => {
         gameStore.setGameId(data.gameId);
         gameStore.setGameState(data.gameState);
       });

       ws.onGameState((state) => {
         gameStore.setGameState(state);
       });

       ws.onGameUpdate((update) => {
         // 差分更新
         gameStore.applyUpdate(update);
       });

       // ... 他のイベント

       return () => {
         // クリーンアップ
         ws.off('game_created');
         ws.off('game_state');
         ws.off('game_update');
       };
     }, []);

     return {
       createGame: ws.createGame.bind(ws),
       joinGame: ws.joinGame.bind(ws),
       sendAction: ws.sendAction.bind(ws),
       isConnected: ws.isConnected()
     };
   }
   ```

2. **App.tsxへの統合**
   ```typescript
   function App() {
     const { isConnected } = useWebSocket();

     return (
       // ... UI
     );
   }
   ```

**実装ファイル**:
- `src/client/src/hooks/useWebSocket.ts`（新規作成）
- `src/client/src/App.tsx`（更新）

**推定時間**: 1-2時間

---

### Phase 2: ゲーム前画面実装（優先度：🔴高）

#### 2.1 MainMenuコンポーネント

**目的**: ゲームモード選択画面

**レイアウト** (ui_design.md参照):
```
┌────────────────────────────────────┐
│      GMレスLoL風TRPG               │
│   ┌──────────────────────────┐    │
│   │  チュートリアル           │    │
│   │  CPU練習モード            │    │
│   │  カジュアルマッチ         │    │
│   │  ランクマッチ (1vs1)      │    │
│   │  ランクマッチ (5vs5)      │    │
│   └──────────────────────────┘    │
└────────────────────────────────────┘
```

**実装ファイル**:
- `src/client/src/components/MainMenu.tsx`（新規作成）

**推定時間**: 1時間

---

#### 2.2 Lobbyコンポーネント

**目的**: ルーム作成・参加

**機能**:
- ルーム作成（ルーム名、モード、最大プレイヤー数）
- ルームコード入力で参加
- 待機中プレイヤー一覧表示
- チーム振り分け（blue/red）

**実装ファイル**:
- `src/client/src/components/Lobby.tsx`（新規作成）

**推定時間**: 2-3時間

---

#### 2.3 CharacterSelectionコンポーネント

**目的**: キャラクター作成・選択

**機能**:
- キャラクター名入力
- ロール選択（10種類）
- ダメージタイプ選択（AD/AP）
- レーン選択（TOP/JG/MID/BOT/SUP）
- ステータスプレビュー

**実装ファイル**:
- `src/client/src/components/CharacterSelection.tsx`（新規作成）

**推定時間**: 2-3時間

---

### Phase 3: インゲームUI実装（優先度：🟡中）

#### 3.1 ItemShopコンポーネント

**目的**: アイテム購入UI

**機能**:
- カテゴリフィルター（すべて/AD/AP/タンク/サポート/コンポ）
- ソート（価格順/攻撃力順/防御力順）
- アイテム詳細表示
- 合成レシピ表示
- 購入処理（所持金チェック）

**実装ファイル**:
- `src/client/src/components/ItemShop.tsx`（新規作成）
- `src/client/src/data/items.ts`（新規作成 - item_system.mdから生成）

**推定時間**: 3-4時間

---

#### 3.2 SkillPanelコンポーネント

**目的**: スキル使用UI

**機能**:
- スキル一覧表示（ノーマル、ウルト）
- クールダウン表示
- 使用可能/不可の表示
- スキル使用ボタン

**実装ファイル**:
- `src/client/src/components/SkillPanel.tsx`（新規作成）

**推定時間**: 1-2時間

---

### Phase 4: 既存コンポーネントのリファクタリング（優先度：🟡中）

#### 4.1 MapViewの改善

**変更内容**:
- クリック可能なエリアの実装
- 視界範囲（Fog of War）の実装
- キャラクター位置のリアルタイム更新
- ホバー時のエリア情報表示

**実装ファイル**:
- `src/client/src/components/MapView.tsx`（更新）

**推定時間**: 2-3時間

---

#### 4.2 ActionPanelのサーバー統合

**変更内容**:
- 行動確定時にWebSocketでサーバーに送信
- サーバーからの応答を処理
- エラーハンドリング
- タイマー表示（60秒制限）

**実装ファイル**:
- `src/client/src/components/ActionPanel.tsx`（更新）

**推定時間**: 2時間

---

#### 4.3 CombatLogのリアルタイム更新

**変更内容**:
- WebSocketイベントから戦闘ログを受信
- イベントタイプ別の色分け
- フィルター機能
- 自動スクロール

**実装ファイル**:
- `src/client/src/components/CombatLog.tsx`（更新）

**推定時間**: 1-2時間

---

### Phase 5: デザインシステムの統一（優先度：🟢低）

#### 5.1 カラーパレットの統一

**実装内容**:
- Tailwind設定にカスタムカラーを追加
- 既存コンポーネントを更新

**実装ファイル**:
- `src/client/tailwind.config.js`（更新）
- 全コンポーネント（更新）

**推定時間**: 2時間

---

## 実装優先順位

### Week 1: 基盤整備
1. 🔴 GameStoreリファクタリング（Phase 1.1）
2. 🔴 WebSocket統合（Phase 1.2）
3. 🔴 MainMenu実装（Phase 2.1）

### Week 2: ゲーム前画面
4. 🔴 Lobby実装（Phase 2.2）
5. 🔴 CharacterSelection実装（Phase 2.3）
6. 🟡 ActionPanelサーバー統合（Phase 4.2）

### Week 3: インゲームUI
7. 🟡 ItemShop実装（Phase 3.1）
8. 🟡 SkillPanel実装（Phase 3.2）
9. 🟡 MapView改善（Phase 4.1）

### Week 4: 仕上げ
10. 🟡 CombatLogリアルタイム更新（Phase 4.3）
11. 🟢 デザインシステム統一（Phase 5.1）
12. 🟢 統合テスト

---

## 推定作業時間

| Phase | 作業内容 | 推定時間 |
|-------|---------|---------|
| 1.1 | GameStoreリファクタリング | 2-3h |
| 1.2 | WebSocket統合 | 1-2h |
| 2.1 | MainMenu | 1h |
| 2.2 | Lobby | 2-3h |
| 2.3 | CharacterSelection | 2-3h |
| 3.1 | ItemShop | 3-4h |
| 3.2 | SkillPanel | 1-2h |
| 4.1 | MapView改善 | 2-3h |
| 4.2 | ActionPanel統合 | 2h |
| 4.3 | CombatLog更新 | 1-2h |
| 5.1 | デザイン統一 | 2h |

**合計**: 約20-30時間

---

## 成果物チェックリスト

### 実装完了条件
- [ ] すべてのコンポーネントがTypeScriptエラーなしでビルド可能
- [ ] サーバーとのWebSocket通信が正常に動作
- [ ] ゲーム前画面からゲーム開始まで一連の流れが完成
- [ ] アイテム購入、スキル使用が動作
- [ ] リアルタイムでゲーム状態が更新される
- [ ] UI設計ドキュメントと一致したデザイン

### テスト項目
- [ ] ローカル環境でクライアント・サーバー接続テスト
- [ ] 複数ブラウザでの同時接続テスト
- [ ] WebSocket切断・再接続テスト
- [ ] ゲームフロー全体のE2Eテスト

---

## 参考ドキュメント

- [UI設計](./ui_design.md)
- [ゲームルール総合](./game_rules.md)
- [システムアーキテクチャ](./system/architecture.md)
- [実装ロードマップ](./system/implementation_roadmap.md)

---

## 更新履歴

- 2025-11-14: 初版作成（バックエンド実装完了後）
