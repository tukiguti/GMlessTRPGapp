# セットアップガイド

このドキュメントでは、GMless TRPGアプリケーションのローカル開発環境のセットアップ手順を説明します。

## 前提条件

- Node.js 18.x以上
- npm または yarn
- Supabaseアカウント
- Upstash Redisアカウント

## 1. リポジトリのクローン

```bash
git clone <repository-url>
cd GMlessTRPGapp
```

## 2. 依存関係のインストール

```bash
npm install
```

これにより、ルート、クライアント、サーバーのすべての依存関係がインストールされます。

## 3. Supabaseのセットアップ

### 3.1 Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト名とパスワードを設定

### 3.2 接続情報の取得

**API設定 (フロントエンド用)**

1. Supabase Dashboard → Settings → API
2. 以下の情報をコピー：
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` キー → `VITE_SUPABASE_ANON_KEY`

**データベース接続文字列 (バックエンド用)**

1. Supabase Dashboard → Settings → Database
2. Connection String → URI をコピー
3. パスワードを実際のプロジェクトパスワードに置き換える
4. → `DATABASE_URL`

## 4. Upstash Redisのセットアップ

### 4.1 Redisデータベースの作成

1. [Upstash](https://upstash.com/)にアクセス
2. 新しいRedisデータベースを作成
3. リージョンを選択（推奨: アプリケーションに近い場所）

### 4.2 接続情報の取得

**REST API (推奨)**

1. Upstash Console → Redis → Details
2. REST API セクションから以下をコピー：
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**標準Redis接続 (オプション)**

1. Connection String をコピー
2. → `REDIS_URL`

## 5. 環境変数の設定

### 5.1 バックエンド環境変数

```bash
# ルートディレクトリで .env ファイルを作成
cp .env.example .env

# エディタで開いて実際の値に置き換える
nano .env
```

必要な環境変数：

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxx...

# アプリケーション
NODE_ENV=development
PORT=4000
MAX_CONNECTIONS=70
```

### 5.2 フロントエンド環境変数

```bash
# クライアントディレクトリで .env.local ファイルを作成
cd src/client
cp .env.example .env.local

# エディタで開いて実際の値に置き換える
nano .env.local
```

必要な環境変数：

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_SERVER_URL=http://localhost:4000
```

## 6. 接続テスト

環境変数を設定したら、データベースとRedisの接続をテストします：

```bash
# ルートディレクトリで実行
npm run test:connections
```

成功すると以下のような出力が表示されます：

```
========================================
接続テスト開始
========================================

✓ Database connected successfully at: 2024-01-01T00:00:00.000Z
✓ Upstash Redis connected successfully, test result: ok

========================================
テスト結果サマリー
========================================

✓ 成功: PostgreSQL (Supabase)
✓ 成功: Redis

合計: 2/2 テスト成功

🎉 すべての接続テストに成功しました！
```

## 7. アプリケーションの起動

### 7.1 開発サーバーの起動

```bash
# ルートディレクトリで実行（サーバーとクライアントを同時起動）
npm run dev
```

または、個別に起動：

```bash
# サーバーのみ
npm run dev:server

# クライアントのみ
npm run dev:client
```

### 7.2 アクセス

- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:4000

## トラブルシューティング

### 接続テストが失敗する場合

1. **環境変数の確認**
   - `.env` ファイルが正しい場所にあるか確認
   - 値が正しくコピーされているか確認
   - 余分なスペースや改行がないか確認

2. **Supabase接続エラー**
   ```
   ✗ Database connection failed
   ```
   - DATABASE_URLのパスワード部分が正しいか確認
   - Supabaseプロジェクトが起動しているか確認
   - ファイアウォールやVPNの設定を確認

3. **Redis接続エラー**
   ```
   ✗ Redis connection failed
   ```
   - Upstashのダッシュボードでデータベースが作成されているか確認
   - REST URLとトークンが正しいか確認
   - リージョンが正しいか確認

4. **依存関係のエラー**
   ```bash
   # node_modulesを削除して再インストール
   rm -rf node_modules package-lock.json
   npm install
   ```

### パーミッションエラー

```bash
# .envファイルのパーミッションを設定
chmod 600 .env
chmod 600 src/client/.env.local
```

## 次のステップ

- データベーススキーマの作成: `docs/DATABASE.md`
- API仕様: `docs/API.md`
- デプロイ手順: `docs/DEPLOYMENT.md`

## サポート

問題が解決しない場合は、以下を確認してください：

- [Supabaseドキュメント](https://supabase.com/docs)
- [Upstashドキュメント](https://docs.upstash.com/)
- プロジェクトのIssueページ
