#!/bin/bash

# GCP e2-micro バックエンドセットアップスクリプト
# Usage: bash setup-gcp-backend.sh

set -e

echo "🚀 GMレスTRPG バックエンドセットアップを開始します..."

# カラー出力用
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. システムアップデート
echo -e "${BLUE}📦 システムをアップデートしています...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# 2. Node.js 20 LTSインストール
echo -e "${BLUE}📦 Node.js 20 LTSをインストールしています...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Node.jsバージョン確認
node --version
npm --version

# 3. PM2インストール
echo -e "${BLUE}📦 PM2をインストールしています...${NC}"
sudo npm install -g pm2

# 4. Gitインストール
echo -e "${BLUE}📦 Gitをインストールしています...${NC}"
sudo apt-get install -y git

# 5. Nginxインストール
echo -e "${BLUE}📦 Nginxをインストールしています...${NC}"
sudo apt-get install -y nginx

# 6. リポジトリクローン
echo -e "${BLUE}📦 リポジトリをクローンしています...${NC}"
cd ~
if [ -d "GMlessTRPGapp" ]; then
    echo "リポジトリが既に存在します。スキップします。"
else
    read -p "GitHubリポジトリURL（例: https://github.com/username/GMlessTRPGapp.git）: " REPO_URL
    git clone "$REPO_URL"
fi

# 7. サーバーディレクトリに移動
cd ~/GMlessTRPGapp/server

# 8. 依存パッケージインストール
echo -e "${BLUE}📦 依存パッケージをインストールしています...${NC}"
npm install

# 9. 環境変数設定
echo -e "${BLUE}🔧 環境変数を設定します...${NC}"
if [ ! -f .env ]; then
    echo "環境変数ファイルを作成します。"
    read -p "DATABASE_URL（Supabase接続URL）: " DB_URL
    read -p "REDIS_URL（Upstash接続URL）: " REDIS_URL

    cat > .env <<EOF
DATABASE_URL=$DB_URL
REDIS_URL=$REDIS_URL
NODE_ENV=production
PORT=4000
EOF
    echo -e "${GREEN}✅ .envファイルを作成しました${NC}"
else
    echo ".envファイルが既に存在します。スキップします。"
fi

# 10. ビルド
echo -e "${BLUE}🔨 アプリケーションをビルドしています...${NC}"
npm run build

# 11. PM2で起動
echo -e "${BLUE}🚀 PM2でアプリケーションを起動しています...${NC}"
pm2 delete trpg-backend 2>/dev/null || true
pm2 start dist/index.js --name trpg-backend -i 1
pm2 save
pm2 startup | tail -n 1 | bash

# 12. Nginx設定
echo -e "${BLUE}🔧 Nginxを設定しています...${NC}"
read -p "ドメイン名（例: trpg.example.com、または IPアドレス）: " DOMAIN

sudo tee /etc/nginx/sites-available/trpg > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/trpg /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo -e "${GREEN}✅ Nginx設定完了${NC}"

# 13. ファイアウォール設定（UFW）
echo -e "${BLUE}🔒 ファイアウォールを設定しています...${NC}"
sudo apt-get install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 14. SSL証明書設定（オプション）
echo -e "${BLUE}🔐 SSL証明書を設定しますか？ (y/n)${NC}"
read -p "SSL設定: " SSL_SETUP

if [ "$SSL_SETUP" = "y" ] || [ "$SSL_SETUP" = "Y" ]; then
    echo -e "${BLUE}🔐 Let's Encrypt SSL証明書をインストールしています...${NC}"
    sudo apt-get install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN"
    echo -e "${GREEN}✅ SSL証明書設定完了${NC}"
fi

# 15. セットアップ完了
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🎉 セットアップが完了しました！          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 アプリケーション情報:${NC}"
echo "   - URL: http://$DOMAIN"
if [ "$SSL_SETUP" = "y" ] || [ "$SSL_SETUP" = "Y" ]; then
    echo "   - SSL URL: https://$DOMAIN"
fi
echo "   - PM2ステータス: pm2 status"
echo "   - PM2ログ: pm2 logs trpg-backend"
echo "   - Nginxステータス: sudo systemctl status nginx"
echo ""
echo -e "${BLUE}📝 次のステップ:${NC}"
echo "   1. フロントエンドのVITE_API_URLを設定: http://$DOMAIN"
echo "   2. Prismaマイグレーション実行: npx prisma migrate deploy"
echo "   3. ブラウザでアクセスしてテスト"
echo ""
echo -e "${GREEN}✅ 完了！${NC}"
