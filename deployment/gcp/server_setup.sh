#!/bin/bash
#
# GCP e2-micro サーバーセットアップスクリプト
#
# 使用方法:
#   chmod +x server_setup.sh
#   ./server_setup.sh
#
# このスクリプトは以下を実行します:
# 1. システムパッケージの更新
# 2. Node.js 20 LTS のインストール
# 3. PM2 のインストール
# 4. Nginx のインストールと設定
# 5. アプリケーションのデプロイ
# 6. ファイアウォールの設定

set -e  # エラーが発生したら終了

echo "======================================"
echo "GCP e2-micro セットアップ開始"
echo "======================================"

# 色付きメッセージ用
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 成功メッセージ
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 警告メッセージ
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# エラーメッセージ
error() {
    echo -e "${RED}✗ $1${NC}"
}

# ステップ1: システムアップデート
echo ""
echo "ステップ1: システムパッケージを更新中..."
sudo apt-get update
sudo apt-get upgrade -y
success "システムパッケージの更新完了"

# ステップ2: 必要なツールのインストール
echo ""
echo "ステップ2: 必要なツールをインストール中..."
sudo apt-get install -y \
    curl \
    git \
    build-essential \
    software-properties-common \
    certbot \
    python3-certbot-nginx \
    vnstat \
    htop
success "必要なツールのインストール完了"

# ステップ3: Node.js 20 LTS のインストール
echo ""
echo "ステップ3: Node.js 20 LTS をインストール中..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    success "Node.js $(node -v) のインストール完了"
else
    warning "Node.js は既にインストールされています: $(node -v)"
fi

# ステップ4: PM2 のインストール
echo ""
echo "ステップ4: PM2 をインストール中..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    pm2 completion install
    success "PM2 のインストール完了"
else
    warning "PM2 は既にインストールされています: $(pm2 -v)"
fi

# ステップ5: Nginx のインストール
echo ""
echo "ステップ5: Nginx をインストール中..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
    success "Nginx のインストール完了"
else
    warning "Nginx は既にインストールされています: $(nginx -v 2>&1)"
fi

# ステップ6: ファイアウォール設定
echo ""
echo "ステップ6: ファイアウォールを設定中..."
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw --force enable
success "ファイアウォールの設定完了"

# ステップ7: vnstat (ネットワーク監視) の設定
echo ""
echo "ステップ7: vnstat (ネットワーク監視) を設定中..."
sudo systemctl enable vnstat
sudo systemctl start vnstat
success "vnstat の設定完了"

# ステップ8: ログローテーション設定
echo ""
echo "ステップ8: ログローテーションを設定中..."
sudo tee /etc/logrotate.d/trpg-app > /dev/null <<EOF
/var/log/trpg-app/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
success "ログローテーションの設定完了"

# ステップ9: スワップファイルの作成（メモリ不足対策）
echo ""
echo "ステップ9: スワップファイルを作成中..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    # スワップの使用を控えめに（メモリが足りない時のみ）
    sudo sysctl vm.swappiness=10
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    success "スワップファイル (1GB) の作成完了"
else
    warning "スワップファイルは既に存在します"
fi

# ステップ10: アプリケーションディレクトリの作成
echo ""
echo "ステップ10: アプリケーションディレクトリを作成中..."
APP_DIR="/home/ubuntu/GMlessTRPGapp"
LOG_DIR="/var/log/trpg-app"

sudo mkdir -p $LOG_DIR
sudo chown ubuntu:ubuntu $LOG_DIR
success "アプリケーションディレクトリの作成完了"

# ステップ11: Git リポジトリのクローン（まだない場合）
echo ""
echo "ステップ11: アプリケーションをデプロイ中..."
if [ ! -d "$APP_DIR" ]; then
    read -p "GitリポジトリのURLを入力してください: " REPO_URL
    git clone $REPO_URL $APP_DIR
    success "リポジトリのクローン完了"
else
    warning "アプリケーションディレクトリは既に存在します"
    cd $APP_DIR
    git pull
    success "最新のコードに更新しました"
fi

# ステップ12: 環境変数の設定
echo ""
echo "ステップ12: 環境変数を設定中..."
cd $APP_DIR
if [ ! -f .env ]; then
    warning ".env ファイルが見つかりません"
    echo "以下の情報を入力してください:"

    read -p "Supabase DATABASE_URL: " DATABASE_URL
    read -p "Upstash REDIS_URL: " REDIS_URL
    read -p "アプリケーションポート (デフォルト: 4000): " APP_PORT
    APP_PORT=${APP_PORT:-4000}

    cat > .env <<EOF
# 環境設定
NODE_ENV=production
PORT=$APP_PORT

# データベース (Supabase)
DATABASE_URL=$DATABASE_URL

# Redis (Upstash)
REDIS_URL=$REDIS_URL

# メモリ制限
NODE_OPTIONS=--max-old-space-size=384

# 同時接続数制限
MAX_CONNECTIONS=70

# ログ設定
LOG_LEVEL=info
LOG_DIR=/var/log/trpg-app
EOF
    success ".env ファイルを作成しました"
else
    warning ".env ファイルは既に存在します"
fi

# ステップ13: 依存関係のインストール
echo ""
echo "ステップ13: 依存関係をインストール中..."
cd $APP_DIR
npm install --production
success "依存関係のインストール完了"

# ステップ14: アプリケーションのビルド
echo ""
echo "ステップ14: アプリケーションをビルド中..."
npm run build
success "アプリケーションのビルド完了"

# ステップ15: Nginx 設定
echo ""
echo "ステップ15: Nginx を設定中..."
read -p "ドメイン名を入力してください (例: example.com): " DOMAIN_NAME

sudo tee /etc/nginx/sites-available/trpg-app > /dev/null <<EOF
# アップストリーム設定
upstream trpg_backend {
    server localhost:4000;
    keepalive 64;
}

# HTTP サーバー (SSL用リダイレクト)
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME;

    # Let's Encrypt 認証用
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # HTTPSへリダイレクト（SSL設定後にコメント解除）
    # return 301 https://\$server_name\$request_uri;
}

# HTTPS サーバー（SSL証明書取得後にコメント解除）
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name $DOMAIN_NAME;
#
#     # SSL証明書（Let's Encrypt）
#     ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#
#     # gzip圧縮（ネットワーク転送量削減）
#     gzip on;
#     gzip_vary on;
#     gzip_min_length 1000;
#     gzip_comp_level 6;
#     gzip_types text/plain text/css text/xml text/javascript
#                application/json application/javascript application/xml+rss;
#
#     # API エンドポイント
#     location /api/ {
#         proxy_pass http://trpg_backend;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade \$http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host \$host;
#         proxy_set_header X-Real-IP \$remote_addr;
#         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto \$scheme;
#         proxy_cache_bypass \$http_upgrade;
#
#         # タイムアウト設定
#         proxy_connect_timeout 60s;
#         proxy_send_timeout 60s;
#         proxy_read_timeout 60s;
#     }
#
#     # WebSocket エンドポイント
#     location /socket.io/ {
#         proxy_pass http://trpg_backend;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade \$http_upgrade;
#         proxy_set_header Connection "upgrade";
#         proxy_set_header Host \$host;
#         proxy_set_header X-Real-IP \$remote_addr;
#         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto \$scheme;
#
#         # WebSocket タイムアウト設定
#         proxy_connect_timeout 7d;
#         proxy_send_timeout 7d;
#         proxy_read_timeout 7d;
#     }
#
#     # ヘルスチェック
#     location /health {
#         proxy_pass http://trpg_backend;
#         access_log off;
#     }
# }
EOF

# Nginx設定を有効化
sudo ln -sf /etc/nginx/sites-available/trpg-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
success "Nginx の設定完了"

# ステップ16: PM2でアプリケーション起動
echo ""
echo "ステップ16: アプリケーションを起動中..."
cd $APP_DIR

# PM2 ecosystem 設定をコピー
if [ -f deployment/gcp/ecosystem.config.js ]; then
    cp deployment/gcp/ecosystem.config.js .
fi

# アプリケーション起動
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

success "アプリケーションの起動完了"

# ステップ17: SSL証明書の取得
echo ""
echo "ステップ17: SSL証明書を取得しますか？"
read -p "SSL証明書を今すぐ取得しますか？ (y/n): " SETUP_SSL

if [ "$SETUP_SSL" = "y" ]; then
    sudo certbot --nginx -d $DOMAIN_NAME

    # Nginx設定のHTTPSセクションをコメント解除
    warning "Nginx設定ファイルのHTTPSセクションを手動でコメント解除してください"
    warning "ファイル: /etc/nginx/sites-available/trpg-app"

    success "SSL証明書の取得完了"
else
    warning "SSL証明書のセットアップをスキップしました"
    echo "後で以下のコマンドで取得できます:"
    echo "  sudo certbot --nginx -d $DOMAIN_NAME"
fi

# ステップ18: セットアップ完了
echo ""
echo "======================================"
echo "✓ セットアップ完了！"
echo "======================================"
echo ""
echo "次のステップ:"
echo "1. アプリケーションの状態確認: pm2 status"
echo "2. ログ確認: pm2 logs"
echo "3. Nginx状態確認: sudo systemctl status nginx"
echo "4. メモリ使用量確認: free -h"
echo "5. ネットワーク使用量確認: vnstat -m"
echo ""
echo "便利なコマンド:"
echo "- アプリ再起動: pm2 restart trpg-backend"
echo "- アプリ停止: pm2 stop trpg-backend"
echo "- ログ監視: pm2 logs --lines 100"
echo "- システム監視: pm2 monit"
echo ""

# メモリ・CPU・ネットワークの状態を表示
echo "現在のシステム状態:"
echo "-------------------"
echo "メモリ使用量:"
free -h
echo ""
echo "CPU情報:"
lscpu | grep "Model name"
echo ""
echo "ディスク使用量:"
df -h /
echo ""

warning "重要: .envファイルに機密情報が含まれています。ファイルのパーミッションを確認してください"
echo "  chmod 600 $APP_DIR/.env"

echo ""
echo "セットアップスクリプトの実行が完了しました！"
