/**
 * WebSocket接続ハンドラー（Redis統合版）
 * GCP最適化: ゲーム状態をRedisにキャッシュしてメモリ使用量を削減
 */

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import crypto from 'crypto';

const prisma = new PrismaClient();

// GCP最適化: Redisクライアントの初期化
const redis = new Redis(process.env.REDIS_URL || '', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('[Redis] Max retries reached');
      return null;
    }
    return Math.min(times * 100, 3000);
  }
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

/**
 * WebSocket接続のセットアップ
 */
export function setupWebSocket(io: Server, onDisconnect: () => void) {
  io.on('connection', (socket: Socket) => {
    console.log('[WebSocket] Player connected:', socket.id);

    // ゲーム作成
    socket.on('create_game', async (data: { mode: string; playerName: string }) => {
      try {
        console.log('[WebSocket] create_game event received:', JSON.stringify(data, null, 2));
        const gameId = crypto.randomUUID();

        // Prismaでゲームを作成
        const game = await prisma.game.create({
          data: {
            id: gameId,
            mode: data.mode || 'casual',
            status: 'waiting',
            state: {} // 初期状態は空
          }
        });

        // プレイヤーを作成
        await prisma.player.create({
          data: {
            gameId,
            socketId: socket.id,
            playerName: data.playerName,
            team: 'blue' // 最初のプレイヤーはblueチーム
          }
        });

        // GCP最適化: ゲーム状態をRedisにキャッシュ（1時間）
        await redis.set(
          `game:${gameId}`,
          JSON.stringify({ id: gameId, round: 0, phase: 'declaration', status: 'waiting' }),
          'EX',
          3600
        );

        socket.join(gameId);

        // GCP最適化: 必要最小限の情報のみ送信
        socket.emit('game_created', {
          gameId,
          round: 0,
          phase: 'declaration',
          status: 'waiting'
        });

        console.log('[Game] Created:', gameId);
      } catch (error) {
        console.error('[Game] Create error:', error);
        socket.emit('error', { message: 'Failed to create game' });
      }
    });

    // ゲーム参加
    socket.on('join_game', async (data: { gameId: string; playerName: string }) => {
      try {
        const { gameId, playerName } = data;

        // ゲームの存在確認
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: { players: true }
        });

        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        if (game.status !== 'waiting') {
          socket.emit('error', { message: 'Game already started' });
          return;
        }

        // プレイヤーを追加
        const team = game.players.length % 2 === 0 ? 'blue' : 'red';
        await prisma.player.create({
          data: {
            gameId,
            socketId: socket.id,
            playerName,
            team
          }
        });

        socket.join(gameId);

        // GCP最適化: Redisからゲーム状態を取得
        const cachedState = await redis.get(`game:${gameId}`);
        const gameState = cachedState ? JSON.parse(cachedState) : {
          id: gameId,
          round: game.round,
          phase: game.phase,
          status: game.status
        };

        socket.emit('game_joined', gameState);

        // 他のプレイヤーに通知
        socket.to(gameId).emit('player_joined', { playerName, team });

        console.log('[Game] Player joined:', gameId, playerName);
      } catch (error) {
        console.error('[Game] Join error:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // プレイヤーアクション
    socket.on('player_action', async (data: { gameId: string; action: any }) => {
      try {
        const { gameId, action } = data;

        console.log('[Action] Received:', gameId, action);

        // TODO: GameEngineと統合してアクションを処理
        // const result = gameEngine.processAction(gameId, action);

        // GCP最適化: 差分のみ送信
        io.to(gameId).emit('game_update', {
          type: 'action',
          playerId: socket.id,
          action
        });
      } catch (error) {
        console.error('[Action] Process error:', error);
        socket.emit('error', { message: 'Failed to process action' });
      }
    });

    // 切断処理
    socket.on('disconnect', () => {
      console.log('[WebSocket] Player disconnected:', socket.id);
      onDisconnect();

      // プレイヤー情報をクリーンアップ
      prisma.player.updateMany({
        where: { socketId: socket.id },
        data: { socketId: null }
      }).catch(err => console.error('[Cleanup] Error:', err));
    });
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  await redis.quit();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await redis.quit();
});
