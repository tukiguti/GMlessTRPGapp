/**
 * Redis クライアント設定
 *
 * セッション管理、キャッシング、リアルタイム同期用のRedis接続を提供します。
 * Upstash Redisを使用し、環境変数から接続情報を読み込みます。
 */

import { Redis } from '@upstash/redis';
import { createClient, RedisClientType } from 'redis';

// Upstash Redis クライアント (推奨 - サーバーレス環境に最適)
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let upstashRedis: Redis | null = null;

if (upstashUrl && upstashToken) {
  upstashRedis = new Redis({
    url: upstashUrl,
    token: upstashToken,
  });
  console.log('✓ Upstash Redis client initialized');
} else {
  console.warn('Warning: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set');
}

// 標準 Redis クライアント (ローカル開発/従来型接続用)
const redisUrl = process.env.REDIS_URL;
let standardRedis: RedisClientType | null = null;

if (redisUrl) {
  standardRedis = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis reconnection failed after 10 retries');
          return new Error('Redis reconnection limit exceeded');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  // エラーハンドリング
  standardRedis.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  standardRedis.on('connect', () => {
    console.log('✓ Redis connected');
  });

  standardRedis.on('reconnecting', () => {
    console.log('Redis reconnecting...');
  });

  standardRedis.on('ready', () => {
    console.log('✓ Redis ready');
  });
} else {
  console.warn('Warning: REDIS_URL is not set');
}

/**
 * Redis 接続を確立 (標準クライアント用)
 */
export async function connectRedis(): Promise<void> {
  if (standardRedis && !standardRedis.isOpen) {
    await standardRedis.connect();
  }
}

/**
 * Redis 接続をテスト
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    // Upstash Redis を優先的にテスト
    if (upstashRedis) {
      await upstashRedis.set('test:connection', 'ok', { ex: 10 });
      const result = await upstashRedis.get('test:connection');
      console.log('✓ Upstash Redis connected successfully, test result:', result);
      return true;
    }

    // 標準 Redis クライアントでテスト
    if (standardRedis) {
      if (!standardRedis.isOpen) {
        await connectRedis();
      }
      await standardRedis.set('test:connection', 'ok', { EX: 10 });
      const result = await standardRedis.get('test:connection');
      console.log('✓ Standard Redis connected successfully, test result:', result);
      return true;
    }

    console.error('✗ No Redis client available');
    return false;
  } catch (error) {
    console.error('✗ Redis connection failed:', error);
    return false;
  }
}

/**
 * Redis 接続を安全にクローズ (標準クライアント用)
 */
export async function closeRedisConnection(): Promise<void> {
  if (standardRedis && standardRedis.isOpen) {
    await standardRedis.quit();
    console.log('Redis connection closed');
  }
}

// Upstash Redis をエクスポート (推奨)
export const redis = upstashRedis;

// 標準 Redis クライアントをエクスポート (オプション)
export const redisClient = standardRedis;

// プロセス終了時のクリーンアップ
process.on('SIGINT', async () => {
  await closeRedisConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeRedisConnection();
  process.exit(0);
});

/**
 * ゲームセッションのキャッシュキーを生成
 */
export function getGameSessionKey(gameId: string): string {
  return `game:session:${gameId}`;
}

/**
 * プレイヤーセッションのキャッシュキーを生成
 */
export function getPlayerSessionKey(playerId: string): string {
  return `player:session:${playerId}`;
}

/**
 * リーダーボードのキーを生成
 */
export function getLeaderboardKey(gameMode: string): string {
  return `leaderboard:${gameMode}`;
}
