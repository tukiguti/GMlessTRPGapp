/**
 * PM2 Ecosystem Configuration
 *
 * GCP e2-micro 最適化設定
 * - メモリ制限: 400MB
 * - シングルインスタンス（クラスターモードなし）
 * - 自動再起動設定
 *
 * 使用方法:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      // アプリケーション名
      name: 'trpg-backend',

      // エントリーポイント
      script: './dist/index.js',

      // インスタンス数
      // GCP e2-micro (1GB RAM) では1インスタンスのみ推奨
      instances: 1,

      // クラスターモード（e2-microでは無効化）
      exec_mode: 'fork',

      // 自動再起動設定
      autorestart: true,

      // 最大再起動回数（10回連続失敗したら停止）
      max_restarts: 10,

      // 再起動遅延（5秒）
      restart_delay: 5000,

      // メモリ制限（400MBを超えたら自動再起動）
      max_memory_restart: '400M',

      // Node.js オプション
      node_args: [
        '--max-old-space-size=384', // ヒープメモリ制限
        '--optimize-for-size',       // メモリ最適化
        '--gc-interval=100',         // GC頻度
      ],

      // 環境変数
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },

      env_development: {
        NODE_ENV: 'development',
        PORT: 4000,
      },

      // ログ設定
      error_file: '/var/log/trpg-app/error.log',
      out_file: '/var/log/trpg-app/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // ログローテーション（PM2 Plus使用時）
      // 注: 無料版では利用不可
      // log_type: 'json',
      // max_size: '10M',
      // retain: 7,

      // 監視設定
      watch: false, // 本番環境では無効化

      // クラッシュ時の動作
      min_uptime: '10s',           // 最小稼働時間
      listen_timeout: 10000,       // リスナータイムアウト
      kill_timeout: 5000,          // kill タイムアウト

      // クラッシュ時の待機時間
      exp_backoff_restart_delay: 100,

      // その他
      time: true,                  // タイムスタンプ有効化
      instance_var: 'INSTANCE_ID', // インスタンスID環境変数
    },
  ],

  /**
   * デプロイ設定（オプション）
   */
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-gcp-instance-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/GMlessTRPGapp.git',
      path: '/home/ubuntu/GMlessTRPGapp',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get update && apt-get install -y git',
    },
  },
};
