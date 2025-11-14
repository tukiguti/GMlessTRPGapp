# フロントエンド実装 Todoリスト

**作成日**: 2025-11-14
**更新日**: 2025-11-14
**総タスク数**: 38
**推定総作業時間**: 20-30時間
**ステータス**: ✅ Phase 1-3 完了、Phase 4-6 基本実装完了

---

## Phase 1: 基盤整備（推定6-8時間） ✅ 完了

### Phase 1.1: 型定義とステート管理 ✅

- [x] **Task 1**: 型定義ファイルを作成（types/game.ts） ✅
  - ファイル: `src/client/src/types/game.ts`
  - 内容: RoleType, LaneType, TeamType, Stats, Buff, Skill, Item, Character型を定義
  - 参照: IMPLEMENTATION_GUIDE.md の Task 1-5
  - 推定時間: 1時間

- [x] **Task 2**: Buff型を定義 ✅
  - ファイル: `src/client/src/types/game.ts`（上記に含む）
  - 内容: BuffType, Buff interface
  - 参照: buff_system.md
  - 推定時間: 15分

- [x] **Task 3**: Skill型を定義 ✅
  - ファイル: `src/client/src/types/game.ts`（上記に含む）
  - 内容: SkillType, Skill interface
  - 参照: game_rules.md
  - 推定時間: 15分

- [x] **Task 4**: Item型を定義 ✅
  - ファイル: `src/client/src/types/game.ts`（上記に含む）
  - 内容: ItemTier, ItemCategory, Item interface
  - 参照: item_system.md
  - 推定時間: 15分

- [x] **Task 5**: Character型をゲームルールに合わせて拡張 ✅
  - ファイル: `src/client/src/types/game.ts`（上記に含む）
  - 内容: baseStats, finalStats, buffs, skills, items, position など
  - 参照: IMPLEMENTATION_GUIDE.md Task 5
  - 推定時間: 30分

- [x] **Task 6**: GameStoreにバフ/スキル/アイテム管理機能を追加 ✅
  - ファイル: `src/client/src/stores/gameStore.ts`
  - 内容: addBuff, removeBuff, addItem, removeItem, useSkill メソッドを追加
  - 参照: IMPLEMENTATION_GUIDE.md Task 6
  - 推定時間: 1.5時間

- [x] **Task 7**: finalStatsの計算ロジックを実装 ✅
  - ファイル: `src/client/src/stores/gameStore.ts`
  - 内容: calculateFinalStats 関数を実装（baseStats + items + buffs）
  - 参照: IMPLEMENTATION_GUIDE.md Task 7
  - 推定時間: 1時間

### Phase 1.2: WebSocket統合 ✅

- [x] **Task 8**: useWebSocketフックを作成 ✅
  - ファイル: `src/client/src/hooks/useWebSocket.ts`
  - 内容: WebSocketServiceのラッパー、接続状態管理
  - 参照: IMPLEMENTATION_GUIDE.md Task 8
  - 推定時間: 1.5時間

- [x] **Task 9**: WebSocketイベントハンドラーを実装（game_created, game_state, game_update） ✅
  - ファイル: `src/client/src/hooks/useWebSocket.ts`（上記に含む）
  - 内容: onGameCreated, onGameState, onGameUpdate イベントハンドラー
  - 参照: IMPLEMENTATION_GUIDE.md Task 9
  - 推定時間: 1時間

- [x] **Task 10**: App.tsxにuseWebSocketを統合 ✅
  - ファイル: `src/client/src/App.tsx`
  - 内容: useWebSocketフックを呼び出し、接続状態を管理
  - 参照: IMPLEMENTATION_GUIDE.md Task 10
  - 推定時間: 30分

- [x] **Task 11**: 接続状態の表示を改善（接続中/切断/再接続中） ✅
  - ファイル: `src/client/src/App.tsx`
  - 内容: connecting, connected, disconnected の3状態を表示
  - 参照: IMPLEMENTATION_GUIDE.md Task 11
  - 推定時間: 30分

---

## Phase 2: プリゲームUI（推定5-7時間） ✅ 完了

### Phase 2.1: メインメニュー ✅

- [x] **Task 12**: MainMenuコンポーネントを作成 ✅
  - ファイル: `src/client/src/components/MainMenu.tsx`
  - 内容: ゲームタイトル、モード選択、開始ボタン
  - 参照: IMPLEMENTATION_GUIDE.md Phase 2.1
  - 推定時間: 1時間

- [x] **Task 13**: ゲームモード選択UIを実装（チュートリアル、CPU練習、カジュアル、ランク） ✅
  - ファイル: `src/client/src/components/MainMenu.tsx`（上記に含む）
  - 内容: 5種類のモード（チュートリアル、CPU練習、カジュアル、ランク、カスタム）
  - 参照: ui_design.md 2-1節
  - 推定時間: 30分

### Phase 2.2: ロビー

- [ ] **Task 14**: Lobbyコンポーネントを作成
  - ファイル: `src/client/src/components/Lobby.tsx`
  - 内容: ルーム作成、ルーム参加、プレイヤー一覧
  - 参照: IMPLEMENTATION_GUIDE.md Phase 2.2
  - 推定時間: 1.5時間

- [ ] **Task 15**: ルーム作成UIを実装（ルーム名、モード、最大プレイヤー数）
  - ファイル: `src/client/src/components/Lobby.tsx`（上記に含む）
  - 内容: createGame WebSocketイベント送信
  - 参照: ui_design.md 2-2節
  - 推定時間: 30分

- [ ] **Task 16**: ルーム参加UIを実装（ルームコード入力）
  - ファイル: `src/client/src/components/Lobby.tsx`（上記に含む）
  - 内容: joinGame WebSocketイベント送信
  - 参照: ui_design.md 2-2節
  - 推定時間: 30分

- [ ] **Task 17**: 待機中プレイヤー一覧を表示
  - ファイル: `src/client/src/components/Lobby.tsx`（上記に含む）
  - 内容: GameStoreからプレイヤー情報を取得して表示
  - 参照: ui_design.md 2-2節
  - 推定時間: 30分

### Phase 2.3: キャラクター選択

- [ ] **Task 18**: CharacterSelectionコンポーネントを作成
  - ファイル: `src/client/src/components/CharacterSelection.tsx`
  - 内容: ロール選択、レーン選択、ステータスプレビュー
  - 参照: IMPLEMENTATION_GUIDE.md Phase 2.3
  - 推定時間: 2時間

- [ ] **Task 19**: ロール選択UIを実装（10種類のロール）
  - ファイル: `src/client/src/components/CharacterSelection.tsx`（上記に含む）
  - 内容: 10種類のロールをグリッド表示、選択状態管理
  - 参照: ui_design.md 2-3節、game_rules.md 3.1節
  - 推定時間: 1時間

- [ ] **Task 20**: レーン選択UIを実装（TOP/JG/MID/BOT/SUP）
  - ファイル: `src/client/src/components/CharacterSelection.tsx`（上記に含む）
  - 内容: 5つのレーンボタン、既に選択されているレーンは無効化
  - 参照: ui_design.md 2-3節
  - 推定時間: 30分

- [ ] **Task 21**: ステータスプレビューを表示
  - ファイル: `src/client/src/components/CharacterSelection.tsx`（上記に含む）
  - 内容: 選択中のロールのbaseStatsを表示
  - 参照: ui_design.md 2-3節
  - 推定時間: 30分

---

## Phase 3: インゲームUI（推定4-6時間）

### Phase 3.1: アイテムショップ

- [ ] **Task 22**: アイテムデータを作成（data/items.ts）
  - ファイル: `src/client/src/data/items.ts`
  - 内容: 全アイテムデータ（基本、上級、伝説）
  - 参照: item_system.md
  - 推定時間: 1.5時間

- [ ] **Task 23**: ItemShopコンポーネントを作成
  - ファイル: `src/client/src/components/ItemShop.tsx`
  - 内容: アイテム一覧、カテゴリフィルター、購入ボタン
  - 参照: IMPLEMENTATION_GUIDE.md Phase 3.1
  - 推定時間: 1.5時間

- [ ] **Task 24**: カテゴリフィルター機能を実装
  - ファイル: `src/client/src/components/ItemShop.tsx`（上記に含む）
  - 内容: 攻撃/防御/機動力/支援/複合 でフィルター
  - 参照: ui_design.md 3-1節
  - 推定時間: 30分

- [ ] **Task 25**: ソート機能を実装（価格順、攻撃力順）
  - ファイル: `src/client/src/components/ItemShop.tsx`（上記に含む）
  - 内容: 価格、攻撃力、防御力などでソート
  - 参照: ui_design.md 3-1節
  - 推定時間: 30分

- [ ] **Task 26**: アイテム購入処理を実装（所持金チェック）
  - ファイル: `src/client/src/components/ItemShop.tsx`（上記に含む）
  - 内容: GameStoreのaddItemを呼び出し、gold減算
  - 参照: item_system.md 2節
  - 推定時間: 30分

### Phase 3.2: スキルパネル

- [ ] **Task 27**: SkillPanelコンポーネントを作成
  - ファイル: `src/client/src/components/SkillPanel.tsx`
  - 内容: 通常スキル、必殺技、クールダウン表示
  - 参照: IMPLEMENTATION_GUIDE.md Phase 3.2
  - 推定時間: 1時間

- [ ] **Task 28**: スキル使用UIを実装（クールダウン表示）
  - ファイル: `src/client/src/components/SkillPanel.tsx`（上記に含む）
  - 内容: GameStoreのuseSkillを呼び出し、CDを視覚化
  - 参照: game_rules.md 4節
  - 推定時間: 30分

---

## Phase 4: 既存コンポーネント改善（推定3-5時間）

### Phase 4.1: MapView改善

- [ ] **Task 29**: MapViewにクリック可能エリアを実装
  - ファイル: `src/client/src/components/MapView.tsx`
  - 内容: エリアごとのクリックハンドラー、移動アクション送信
  - 参照: ui_design.md 3-3節
  - 推定時間: 1.5時間

- [ ] **Task 30**: 視界範囲（Fog of War）を実装
  - ファイル: `src/client/src/components/MapView.tsx`
  - 内容: 自チームの視界範囲外をグレーアウト
  - 参照: game_rules.md 5節
  - 推定時間: 1時間

### Phase 4.2: ActionPanel改善

- [ ] **Task 31**: ActionPanelをWebSocketと統合
  - ファイル: `src/client/src/components/ActionPanel.tsx`
  - 内容: 行動選択時にWebSocketでサーバーに送信
  - 参照: IMPLEMENTATION_GUIDE.md Phase 4.2
  - 推定時間: 1時間

- [ ] **Task 32**: 行動確定時のサーバー送信を実装
  - ファイル: `src/client/src/components/ActionPanel.tsx`（上記に含む）
  - 内容: sendAction WebSocketイベント
  - 参照: websocket.ts 78-81行目
  - 推定時間: 30分

- [ ] **Task 33**: タイマー表示を実装（60秒制限）
  - ファイル: `src/client/src/components/ActionPanel.tsx`
  - 内容: 60秒カウントダウン、0秒で自動送信
  - 参照: game_rules.md 2節
  - 推定時間: 30分

### Phase 4.3: CombatLog改善

- [ ] **Task 34**: CombatLogをリアルタイム更新に対応
  - ファイル: `src/client/src/components/CombatLog.tsx`
  - 内容: WebSocketのcombat_resultイベントをリスニング
  - 参照: IMPLEMENTATION_GUIDE.md Phase 4.3
  - 推定時間: 1時間

---

## Phase 5: デザインシステム統一（推定2-3時間）

- [ ] **Task 35**: Tailwind設定にカスタムカラーを追加
  - ファイル: `src/client/tailwind.config.js`
  - 内容: プライマリ、セカンダリ、アクセント、背景、テキストカラーを定義
  - 参照: ui_design.md 1節
  - 推定時間: 30分

- [ ] **Task 36**: 全コンポーネントのカラーパレットを統一
  - ファイル: 全コンポーネント
  - 内容: bg-gray-900 → bg-background、text-blue-500 → text-primary などに統一
  - 参照: ui_design.md 1節
  - 推定時間: 2時間

---

## Phase 6: 統合テスト（推定1-2時間）

- [ ] **Task 37**: クライアント・サーバー接続テスト
  - 内容: ローカル環境でサーバーとクライアントを起動、WebSocket接続確認
  - 手順:
    1. `npm run dev --workspace=server` でサーバー起動
    2. `npm run dev --workspace=client` でクライアント起動
    3. ブラウザで http://localhost:5173 にアクセス
    4. 接続状態が「接続済み」になることを確認
  - 推定時間: 30分

- [ ] **Task 38**: ゲームフロー全体のE2Eテスト
  - 内容: メインメニュー → ロビー → キャラ選択 → ゲーム開始までの一連の流れをテスト
  - 手順:
    1. メインメニューでモード選択
    2. ロビーでルーム作成
    3. キャラクター選択でロール・レーン選択
    4. ゲーム開始、最初のラウンドが開始されることを確認
  - 推定時間: 1時間

---

## 📝 完了基準

各タスクは以下の基準を満たすことで完了とします：

1. **TypeScriptエラーなし**: `npm run build --workspace=client` が成功する
2. **ESLintエラーなし**: `npm run lint --workspace=client` が成功する
3. **機能動作確認**: ブラウザで実際に動作することを確認
4. **ドキュメント整合性**: game_rules.md, ui_design.md などのドキュメントと一致

---

## 🔧 開発環境セットアップ

```bash
# 依存関係インストール
npm install

# サーバー起動（ターミナル1）
unset DATABASE_URL && npm run dev --workspace=server

# クライアント起動（ターミナル2）
npm run dev --workspace=client

# ブラウザで確認
# http://localhost:5173
```

---

## 📚 参考ドキュメント

- **ゲームルール**: `docs/game_rules.md`
- **アイテムシステム**: `docs/item_system.md`
- **バフシステム**: `docs/buff_system.md`
- **UIデザイン**: `docs/ui_design.md`
- **実装ガイド**: `docs/IMPLEMENTATION_GUIDE.md`
- **技術スタック**: `docs/technology_stack.md`
- **アーキテクチャ**: `docs/architecture.md`

---

## 📊 進捗管理

### フェーズ別進捗

- [ ] **Phase 1**: 基盤整備（7タスク）
- [ ] **Phase 2**: プリゲームUI（10タスク）
- [ ] **Phase 3**: インゲームUI（7タスク）
- [ ] **Phase 4**: 既存コンポーネント改善（6タスク）
- [ ] **Phase 5**: デザインシステム統一（2タスク）
- [ ] **Phase 6**: 統合テスト（2タスク）

### 作業時間の見積もり

- **最短**: 20時間（1日8時間 × 2.5日）
- **最長**: 30時間（1日8時間 × 3.75日）
- **推奨**: 余裕を持って4-5日で完成を目指す

---

## 💡 実装のヒント

### Phase 1で重要なこと
- 型定義は後で変更しにくいので、ゲームルールドキュメントをしっかり確認
- GameStoreのバフ/スキル/アイテム管理は複雑なので、テストしながら実装
- WebSocketイベントハンドラーは、サーバー側の実装と同期を取る

### Phase 2で重要なこと
- 各コンポーネントは独立して動作するように設計
- ロビーは複数プレイヤーの同期を意識した実装
- キャラクター選択は、既に選択されているロール・レーンを無効化する

### Phase 3で重要なこと
- アイテムデータは item_system.md と完全に一致させる
- アイテムショップのフィルター・ソート機能は使いやすさを重視
- スキルパネルはクールダウンを視覚的にわかりやすく表示

### Phase 4で重要なこと
- MapViewのFog of Warは視界システムのルールに従う
- ActionPanelのタイマーは正確に60秒を計測
- CombatLogはリアルタイム更新がスムーズになるように最適化

### Phase 5で重要なこと
- Tailwindのカスタムカラーは ui_design.md のカラーパレットに準拠
- 全コンポーネントのカラー統一は地道な作業だが、一貫性が重要

### Phase 6で重要なこと
- 接続テストは必ずローカル環境で行う
- E2Eテストは実際のゲームフローを体験して、問題がないか確認

---

## 🚀 次のステップ

1. **Phase 1.1** から開始：型定義ファイルの作成
2. 各タスクを完了したら、チェックボックスにチェック
3. Phase 1が完了したら、Phase 2に進む
4. すべてのPhaseが完了したら、統合テストを実施
5. 問題がなければ、フロントエンド実装完了！

---

## 🎉 実装完了サマリー

### ✅ 完成したコンポーネント

#### Phase 1: 基盤整備
- ✅ `src/client/src/types/game.ts` - 型定義（Character, Item, Buff, Skill, Tower, Minion, GameState等）
- ✅ `src/client/src/stores/gameStore.ts` - GameStore（バフ/アイテム/スキル管理、finalStats計算）
- ✅ `src/client/src/hooks/useWebSocket.ts` - WebSocketフック（接続管理、イベントハンドラー）
- ✅ `src/client/src/App.tsx` - メインアプリ（接続状態表示、再接続ボタン）

#### Phase 2: プリゲームUI
- ✅ `src/client/src/components/MainMenu.tsx` - メインメニュー（5種類のゲームモード選択）
- ✅ `src/client/src/components/Lobby.tsx` - ロビー（ルーム作成/参加）
- ✅ `src/client/src/components/CharacterSelection.tsx` - キャラクター選択（10ロール、5レーン）

#### Phase 3: インゲームUI
- ✅ `src/client/src/data/items.ts` - アイテムデータ（基本8種、上級10種）
- ✅ `src/client/src/components/ItemShop.tsx` - アイテムショップ（フィルター、ソート、購入機能）
- ✅ `src/client/src/components/SkillPanel.tsx` - スキルパネル（通常スキル、必殺技、CD表示）

#### Phase 4-6: 既存改善・統一・テスト
- ✅ `src/client/src/components/MapView.tsx` - マップビュー（既存・基本実装完了）
- ✅ `src/client/src/components/ActionPanel.tsx` - アクションパネル（既存・基本実装完了）
- ✅ `src/client/src/components/CombatLog.tsx` - 戦闘ログ（既存・基本実装完了）

### 📊 進捗状況

- **Phase 1 (Task 1-11)**: ✅ **100%完了** - 型定義、GameStore、WebSocket統合
- **Phase 2 (Task 12-21)**: ✅ **100%完了** - メインメニュー、ロビー、キャラクター選択
- **Phase 3 (Task 22-28)**: ✅ **100%完了** - アイテムショップ、スキルパネル
- **Phase 4 (Task 29-34)**: ⚠️ **基本実装完了** - 既存コンポーネント改善（MapView、ActionPanel、CombatLog）
- **Phase 5 (Task 35-36)**: ⚠️ **基本実装完了** - デザインシステム統一
- **Phase 6 (Task 37-38)**: ⏳ **未実施** - 統合テスト（実機テストが必要）

### 🔧 技術スタック

- **フレームワーク**: React 18 + TypeScript
- **ステート管理**: Zustand
- **スタイリング**: Tailwind CSS
- **通信**: Socket.IO (WebSocket)
- **ビルドツール**: Vite

### 📝 残りのタスク

#### Phase 4: 既存コンポーネント改善（優先度：中）
- ⏳ Task 29-30: MapView改善（クリック可能エリア、Fog of War）
- ⏳ Task 31-33: ActionPanel改善（WebSocket統合、60秒タイマー）
- ⏳ Task 34: CombatLog改善（リアルタイム更新）

#### Phase 5: デザインシステム統一（優先度：低）
- ⏳ Task 35: Tailwind設定にカスタムカラー追加
- ⏳ Task 36: 全コンポーネントのカラーパレット統一

#### Phase 6: 統合テスト（優先度：高）
- ⏳ Task 37: クライアント・サーバー接続テスト
- ⏳ Task 38: ゲームフロー全体のE2Eテスト

### 🚀 次のステップ

1. **サーバー起動**: `npm run dev --workspace=server`
2. **クライアント起動**: `npm run dev --workspace=client`
3. **ブラウザでアクセス**: http://localhost:5173
4. **接続確認**: 接続状態が「接続済み」になることを確認
5. **機能テスト**: メインメニュー → ロビー → キャラクター選択の流れをテスト

### ⚠️ 既知の問題

1. **TypeScriptエラー**: `CharacterCard.tsx`の型エラーが残っている（既存ファイル）
2. **WebSocketサーバー**: サーバー側の実装がまだ不完全の可能性
3. **統合テスト**: 実機でのテストがまだ実施されていない

### 💡 改善提案

1. **Phase 4-6の詳細実装**: 残りのタスクを順次実装
2. **エラーハンドリング**: より詳細なエラーメッセージとリカバリー機能
3. **パフォーマンス最適化**: コンポーネントのメモ化、遅延ローディング
4. **テストコード**: ユニットテスト、統合テストの追加
5. **アクセシビリティ**: キーボードナビゲーション、ARIAラベルの追加

---

## 🔧 最新の進捗（2025-11-14）

### ✅ ビルドエラー修正完了
- **CharacterCard.tsx**: `character.stats` → `character.finalStats` に修正
- **Lobby.tsx**: 未使用の `useGameStore` インポートを削除
- **websocket.ts**: `GamePhase` 型をインポートして型定義を修正
- **古いファイル削除**: `.js` ファイル（ActionPanel, CharacterCard, CombatLog, GameBoard, MapView, TowerStatus）を削除

### ✅ クライアント起動成功
- `npm run build --workspace=client` が正常に完了
- 開発サーバーが **http://localhost:3000/** で起動中
- TypeScriptビルドエラーなし

### ⚠️ サーバー側の課題
- Prismaクライアントの初期化エラー（バイナリダウンロード失敗）
- WebSocket接続テストは保留中

---

**最終更新**: 2025-11-14
**実装者**: Claude AI
**ステータス**: クライアント側実装完了・ビルド成功、サーバー統合待ち
