#!/bin/bash

# AWS EC2 t3.micro バックエンドセットアップスクリプト
# Usage: bash setup-aws-backend.sh

set -e

echo "🚀 GMレスTRPG バックエンドセットアップ（AWS EC2）を開始します..."

# カラー出力用
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

# 6. CloudWatch Logsエージェントインストール（オプション）
echo -e "${BLUE}📊 CloudWatch Logsエージェントをインストールしますか？ (y/n)${NC}"
read -p "CloudWatch: " CLOUDWATCH_SETUP

if [ "$CLOUDWATCH_SETUP" = "y" ] || [ "$CLOUDWATCH_SETUP" = "Y" ]; then
    echo -e "${BLUE}📊 CloudWatch Logsエージェントをインストールしています...${NC}"
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
    sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
    rm amazon-cloudwatch-agent.deb
    echo -e "${GREEN}✅ CloudWatch Logsエージェントインストール完了${NC}"
fi

# 7. リポジトリクローン
echo -e "${BLUE}📦 リポジトリをクローンしています...${NC}"
cd ~
if [ -d "GMlessTRPGapp" ]; then
    echo "リポジトリが既に存在します。スキップします。"
else
    read -p "GitHubリポジトリURL（例: https://github.com/username/GMlessTRPGapp.git）: " REPO_URL
    git clone "$REPO_URL"
fi

# 8. サーバーディレクトリに移動
cd ~/GMlessTRPGapp/server

# 9. 依存パッケージインストール
echo -e "${BLUE}📦 依存パッケージをインストールしています...${NC}"
npm install

# 10. 環境変数設定
echo -e "${BLUE}🔧 環境変数を設定します...${NC}"
if [ ! -f .env ]; then
    echo "環境変数ファイルを作成します。"

    # データベース選択
    echo -e "${YELLOW}データベースを選択してください:${NC}"
    echo "  1) AWS RDS（無料枠12ヶ月）"
    echo "  2) Supabase（永続的無料）"
    read -p "選択 (1 or 2): " DB_CHOICE

    if [ "$DB_CHOICE" = "1" ]; then
        read -p "RDS接続URL（例: postgresql://user:pass@xxx.rds.amazonaws.com:5432/db）: " DB_URL
    else
        read -p "Supabase接続URL: " DB_URL
    fi

    read -p "REDIS_URL（Upstash接続URL）: " REDIS_URL

    cat > .env <<EOF
DATABASE_URL=$DB_URL
REDIS_URL=$REDIS_URL
NODE_ENV=production
PORT=4000
AWS_REGION=${AWS_REGION:-us-east-1}
EOF
    echo -e "${GREEN}✅ .envファイルを作成しました${NC}"
else
    echo ".envファイルが既に存在します。スキップします。"
fi

# 11. ビルド
echo -e "${BLUE}🔨 アプリケーションをビルドしています...${NC}"
npm run build

# 12. PM2で起動
echo -e "${BLUE}🚀 PM2でアプリケーションを起動しています...${NC}"
pm2 delete trpg-backend 2>/dev/null || true
pm2 start dist/index.js --name trpg-backend -i 1
pm2 save
pm2 startup | tail -n 1 | bash

# 13. Nginx設定
echo -e "${BLUE}🔧 Nginxを設定しています...${NC}"

# EC2のパブリックIPを自動取得
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo "")

if [ -z "$PUBLIC_IP" ]; then
    read -p "パブリックIPまたはドメイン名: " DOMAIN
else
    echo -e "${GREEN}パブリックIP検出: $PUBLIC_IP${NC}"
    read -p "ドメイン名を使用しますか？ (y/n、nの場合はIPアドレスを使用): " USE_DOMAIN
    if [ "$USE_DOMAIN" = "y" ] || [ "$USE_DOMAIN" = "Y" ]; then
        read -p "ドメイン名: " DOMAIN
    else
        DOMAIN=$PUBLIC_IP
    fi
fi

sudo tee /etc/nginx/sites-available/trpg > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # ログ設定
    access_log /var/log/nginx/trpg_access.log;
    error_log /var/log/nginx/trpg_error.log;

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

        # タイムアウト設定（WebSocket用）
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;

        # タイムアウト設定（WebSocket用）
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # ヘルスチェック
    location /health {
        proxy_pass http://localhost:4000/health;
        access_log off;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/trpg /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo -e "${GREEN}✅ Nginx設定完了${NC}"

# 14. ファイアウォール設定は不要（Security Groupで管理）
echo -e "${YELLOW}⚠️  AWS Security Groupで以下のポートを開放してください:${NC}"
echo "   - HTTP: 80"
echo "   - HTTPS: 443"
echo "   - SSH: 22（管理用）"

# 15. SSL証明書設定（オプション）
if [ "$DOMAIN" != "$PUBLIC_IP" ]; then
    echo -e "${BLUE}🔐 SSL証明書を設定しますか？ (y/n)${NC}"
    read -p "SSL設定: " SSL_SETUP

    if [ "$SSL_SETUP" = "y" ] || [ "$SSL_SETUP" = "Y" ]; then
        echo -e "${BLUE}🔐 Let's Encrypt SSL証明書をインストールしています...${NC}"
        sudo apt-get install -y certbot python3-certbot-nginx
        sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" || {
            echo -e "${RED}SSL証明書の取得に失敗しました。ドメインのDNS設定を確認してください。${NC}"
        }
    fi
fi

# 16. メモリ使用量モニタリング設定
echo -e "${BLUE}📊 メモリモニタリング設定を追加しています...${NC}"
cat > ~/monitor-memory.sh <<'EOF'
#!/bin/bash
MEMORY_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
THRESHOLD=80

if (( $(echo "$MEMORY_USAGE > $THRESHOLD" | bc -l) )); then
    echo "メモリ使用量が${THRESHOLD}%を超えています: ${MEMORY_USAGE}%"
    # 必要に応じてアラート送信
fi
EOF
chmod +x ~/monitor-memory.sh

# Cronジョブ追加（5分ごとにチェック）
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/monitor-memory.sh") | crontab -

# 17. 自動デプロイスクリプト作成
echo -e "${BLUE}🔄 自動デプロイスクリプトを作成しています...${NC}"
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

# 18. セットアップ完了
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
echo "   1. AWS Security Groupでポート80,443を開放"
echo "   2. フロントエンドのVITE_API_URLを設定: http://$DOMAIN"
echo "   3. Prismaマイグレーション実行: cd ~/GMlessTRPGapp/server && npx prisma migrate deploy"
echo "   4. ブラウザでアクセスしてテスト"
echo ""
echo -e "${BLUE}🔄 デプロイコマンド:${NC}"
echo "   ~/deploy-trpg.sh"
echo ""
echo -e "${YELLOW}⚠️  無料枠について:${NC}"
echo "   - EC2 t3.micro: 12ヶ月間無料（750時間/月）"
echo "   - 12ヶ月後はGCP e2-microへの移行を推奨"
echo ""
echo -e "${GREEN}✅ 完了！${NC}"
