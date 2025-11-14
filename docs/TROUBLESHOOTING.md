# トラブルシューティングガイド

## データベース接続の問題

### 症状: `getaddrinfo ENOTFOUND` エラー

```
Error: getaddrinfo ENOTFOUND db.ujffbhskgiuzwkefeksy.supabase.co
```

このエラーはDNSがSupabaseのホスト名を解決できないことを示しています。

### 診断ステップ

#### 1. ネットワーク診断を実行

```bash
npm run diagnose:network
```

このコマンドで、DNSの解決状況や一般的なネットワーク問題を診断できます。

#### 2. DATABASE_URLの形式を確認

```bash
npm run diagnose:db
```

#### 3. ターミナルで直接DNSテスト

```bash
# nslookupを使用
nslookup db.ujffbhskgiuzwkefeksy.supabase.co

# またはdigを使用
dig db.ujffbhskgiuzwkefeksy.supabase.co

# 一般的なホストでテスト
ping google.com
```

### 解決方法

#### A. Supabaseプロジェクトの状態を確認

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. プロジェクトが「Active」状態であることを確認
3. **Settings → Database → Connection String** で正しい接続情報を確認
4. 必要に応じて新しい接続文字列をコピーして `.env` を更新

**重要**: プロジェクトが一時停止（Paused）や削除された場合、DNSエラーが発生します。

#### B. ネットワーク設定を確認

1. **インターネット接続**
   ```bash
   ping google.com
   ping supabase.com
   ```
   これらが失敗する場合、インターネット接続に問題があります。

2. **VPN/プロキシ**
   - VPNを使用している場合、オフにして試してみる
   - 企業ネットワークの場合、プロキシ設定を確認

3. **DNSサーバー**
   - システムのDNS設定を確認
   - Google DNS (8.8.8.8) や Cloudflare DNS (1.1.1.1) に変更してみる

   **Macの場合**:
   ```
   システム環境設定 → ネットワーク → 詳細 → DNS
   ```

4. **ファイアウォール**
   - PostgreSQLのポート 5432 が開いているか確認
   - セキュリティソフトウェアの設定を確認

#### C. 代替接続方法を試す

Supabaseプロジェクトの場合、Supabase Clientライブラリを使用した接続も可能です（現在実装済み）:

```typescript
import { supabase } from './src/database/config/supabase';

// Supabase Clientを使用（内部でRESTful APIを使用）
const { data, error } = await supabase
  .from('your_table')
  .select('*');
```

#### D. パスワードに特殊文字が含まれる場合

パスワードに `@`, `#`, `%` などの特殊文字が含まれる場合、URLエンコードが必要です:

```bash
# 元のパスワード: myP@ssw0rd#123
# URLエンコード後: myP%40ssw0rd%23123

DATABASE_URL=postgresql://postgres:myP%40ssw0rd%23123@db.xxxxx.supabase.co:5432/postgres
```

主な特殊文字のエンコーディング:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `:` → `%3A`
- `/` → `%2F`

### よくある原因と解決策

| エラー | 原因 | 解決策 |
|--------|------|--------|
| `ENOTFOUND` | DNSが解決できない | Supabaseプロジェクトの状態確認、DNS設定確認 |
| `ETIMEDOUT` | 接続タイムアウト | ファイアウォール設定、ネットワーク接続確認 |
| `ECONNREFUSED` | 接続が拒否された | ポート番号、ホスト名の確認 |
| `password authentication failed` | パスワードが間違っている | Supabase Dashboardでパスワードを確認 |

### それでも解決しない場合

1. **Supabaseのステータスページを確認**
   - https://status.supabase.com

2. **ローカル開発環境の確認**
   ```bash
   # Node.jsバージョン
   node --version

   # npm バージョン
   npm --version

   # 環境変数の確認
   npm run diagnose:db
   ```

3. **詳細ログを有効化**

   `scripts/test-connections.ts` で詳細なデバッグ情報が既に表示されます:
   ```bash
   npm run test:connections
   ```

4. **Issueを作成**

   上記の診断結果を添えてプロジェクトリポジトリにIssueを作成してください。

## Redis接続の問題

### Upstash Redis REST APIが未設定

```
Warning: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set
```

これは警告であり、標準Redis接続（`REDIS_URL`）を使用している場合は問題ありません。

Upstash REST APIを使用したい場合:

1. [Upstash Console](https://console.upstash.com) にログイン
2. Redis → Details → REST API セクションで情報を取得
3. `.env` に追加:
   ```bash
   UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AYourActualToken...
   ```

## その他の問題

### 依存関係のインストールエラー

```bash
# キャッシュをクリア
npm cache clean --force

# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### TypeScriptのコンパイルエラー

```bash
# TypeScript型チェック
npm run build
```

### ポート競合

```bash
# ポート4000が使用中の場合、.envで変更
PORT=4001
```

---

**最終更新**: 2025-11-14
