# セットアップスクリプト

GCP/AWSでのバックエンド環境を自動構築するスクリプトです。

## 📋 前提条件

### GCP e2-micro の場合
- GCPアカウント作成済み
- gcloud CLIインストール済み
- e2-microインスタンス作成済み（Ubuntu 22.04 LTS）

### AWS EC2 t3.micro の場合
- AWSアカウント作成済み（無料枠適用中）
- EC2 t3.microインスタンス作成済み（Ubuntu 22.04 LTS）
- Security Groupで以下のポート開放:
  - SSH (22)
  - HTTP (80)
  - HTTPS (443)

## 🚀 使い方

### 1. GCP e2-micro セットアップ

```bash
# SSH接続
gcloud compute ssh trpg-backend --zone=us-west1-b

# スクリプトダウンロード & 実行
curl -o setup.sh https://raw.githubusercontent.com/YOUR_USERNAME/GMlessTRPGapp/main/scripts/setup-gcp-backend.sh
chmod +x setup.sh
bash setup.sh
```

**実行時に聞かれる情報:**
- GitHubリポジトリURL
- DATABASE_URL（Supabase接続文字列）
- REDIS_URL（Upstash接続文字列）
- ドメイン名（またはIPアドレス）
- SSL証明書設定の有無

### 2. AWS EC2 t3.micro セットアップ

```bash
# SSH接続
ssh -i your-key.pem ubuntu@ec2-xx-xx-xx-xx.compute.amazonaws.com

# スクリプトダウンロード & 実行
curl -o setup.sh https://raw.githubusercontent.com/YOUR_USERNAME/GMlessTRPGapp/main/scripts/setup-aws-backend.sh
chmod +x setup.sh
bash setup.sh
```

**実行時に聞かれる情報:**
- GitHubリポジトリURL
- データベース選択（RDS or Supabase）
- DATABASE_URL
- REDIS_URL
- ドメイン名（またはIPアドレス）
- SSL証明書設定の有無

## 📦 スクリプトが実行する内容

1. ✅ システムアップデート
2. ✅ Node.js 20 LTSインストール
3. ✅ PM2インストール（プロセス管理）
4. ✅ Gitインストール
5. ✅ Nginxインストール（リバースプロキシ）
6. ✅ リポジトリクローン
7. ✅ 依存パッケージインストール
8. ✅ 環境変数設定（.env作成）
9. ✅ アプリケーションビルド
10. ✅ PM2で自動起動設定
11. ✅ Nginx設定
12. ✅ SSL証明書設定（オプション）

## 🔧 セットアップ後の確認

```bash
# PM2ステータス確認
pm2 status

# アプリケーションログ確認
pm2 logs trpg-backend

# Nginxステータス確認
sudo systemctl status nginx

# Nginxログ確認
sudo tail -f /var/log/nginx/trpg_access.log
sudo tail -f /var/log/nginx/trpg_error.log
```

## 🔄 デプロイ（更新）

AWS版では自動的にデプロイスクリプトが作成されます：

```bash
~/deploy-trpg.sh
```

GCPでも同様のスクリプトを手動作成できます：

```bash
cat > ~/deploy-trpg.sh <<'EOF'
#!/bin/bash
set -e
echo "🚀 デプロイを開始します..."
cd ~/GMlessTRPGapp
git pull origin main
cd server
npm install
npm run build
pm2 restart trpg-backend
echo "✅ デプロイ完了！"
EOF
chmod +x ~/deploy-trpg.sh
```

## 🔐 SSL証明書の設定

### 前提条件
- ドメイン名を取得済み
- DNSレコードがインスタンスのIPを向いている

### Let's Encryptで自動設定

```bash
sudo certbot --nginx -d your-domain.com
```

### 証明書の自動更新

```bash
# Certbotが自動更新を設定済み
sudo certbot renew --dry-run
```

## 📊 モニタリング

### メモリ使用量確認

```bash
free -h
```

### CPU使用率確認

```bash
top
```

### ディスク使用量確認

```bash
df -h
```

### PM2モニタリング

```bash
pm2 monit
```

## 🐛 トラブルシューティング

### アプリケーションが起動しない

```bash
# ログ確認
pm2 logs trpg-backend

# 環境変数確認
cat ~/GMlessTRPGapp/server/.env

# 手動起動テスト
cd ~/GMlessTRPGapp/server
npm start
```

### Nginxエラー

```bash
# Nginx設定テスト
sudo nginx -t

# エラーログ確認
sudo tail -f /var/log/nginx/error.log

# Nginx再起動
sudo systemctl restart nginx
```

### データベース接続エラー

```bash
# Prismaマイグレーション確認
cd ~/GMlessTRPGapp/server
npx prisma migrate status

# マイグレーション実行
npx prisma migrate deploy
```

### ポートが開放されていない（AWS）

```bash
# Security Groupで以下を確認:
# - HTTP (80): 0.0.0.0/0
# - HTTPS (443): 0.0.0.0/0
# - SSH (22): Your IP
```

## 🔄 12ヶ月後の移行（AWS → GCP）

AWS無料枠が終了したら、GCPへ移行します：

```bash
# 1. GCP e2-microインスタンス作成
gcloud compute instances create trpg-backend \
  --zone=us-west1-b \
  --machine-type=e2-micro \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud

# 2. セットアップスクリプト実行
gcloud compute ssh trpg-backend --zone=us-west1-b
curl -o setup.sh https://raw.githubusercontent.com/YOUR_USERNAME/GMlessTRPGapp/main/scripts/setup-gcp-backend.sh
chmod +x setup.sh
bash setup.sh

# 3. DNSレコード更新（新しいIPへ）
# 4. AWS EC2インスタンス削除
```

## 📞 サポート

問題が発生した場合：
1. ログファイルを確認
2. GitHubのIssuesで報告
3. ドキュメント `docs/system/hosting_options.md` を参照

## 📝 関連ドキュメント

- [ホスティングオプション詳細](../docs/system/hosting_options.md)
- [技術スタック](../docs/system/technology_stack.md)
- [システムアーキテクチャ](../docs/system/architecture.md)
