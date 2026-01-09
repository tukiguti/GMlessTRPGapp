import { Server, Socket } from 'socket.io';
import { GameEngine, PlayerAction, RoundManager, GameState } from '@gmless-trpg/game';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

export function setupActionHandlers(io: Server, socket: Socket, redis: Redis, prisma: PrismaClient) {
    // アクション送信
    socket.on('submit_action', async (data: { gameId: string; action: PlayerAction }) => {
        try {
            const { gameId, action } = data;
            console.log(`[Action] Received from ${socket.id}:`, action);

            // Redisから現在のゲーム状態を取得
            const cachedState = await redis.get(`game:${gameId}`);
            if (!cachedState) {
                socket.emit('error', { message: 'Game not found' });
                return;
            }

            const gameState: GameState = JSON.parse(cachedState);

            // フェーズチェック
            if (gameState.phase !== 'declaration') {
                socket.emit('error', { message: 'Not in declaration phase' });
                return;
            }

            // アクションをRedisに保存
            // プレイヤーごとのアクションをハッシュで保存して重複を防ぐ
            await redis.hset(`game:${gameId}:actions`, socket.id, JSON.stringify(action));

            // クライアントに受付確認を送信
            socket.emit('action_accepted', { actionId: Date.now() });

            // 参加プレイヤー数を取得
            const playerCount = await prisma.player.count({ where: { gameId } });
            const submittedCount = await redis.hlen(`game:${gameId}:actions`);

            console.log(`[Action] Progress: ${submittedCount}/${playerCount}`);

            // 全員のアクションが揃ったらラウンド解決
            if (submittedCount >= playerCount && playerCount > 0) {
                console.log(`[Game] All actions submitted for game ${gameId}. Resolving round...`);
                await resolveRound(io, gameId, redis);
            } else {
                // 進捗を通知
                io.to(gameId).emit('action_progress', { current: submittedCount, total: playerCount });
            }

        } catch (error) {
            console.error('[Action] Error:', error);
            socket.emit('error', { message: 'Failed to submit action' });
        }
    });
}

/**
 * ラウンド解決処理
 */
async function resolveRound(io: Server, gameId: string, redis: Redis) {
    try {
        // 1. データ取得
        const cachedState = await redis.get(`game:${gameId}`);
        if (!cachedState) return;
        const gameState: GameState = JSON.parse(cachedState);

        const actionMap = await redis.hgetall(`game:${gameId}:actions`);
        const actions: PlayerAction[] = Object.values(actionMap).map(json => JSON.parse(json));

        // 2. ラウンド解決 (RoundManager)
        await RoundManager.resolveRound(gameState, actions);

        // 3. 次のラウンドへ (行動宣言フェーズ開始)
        await RoundManager.startDeclarationPhase(gameState);

        // 4. 保存
        await redis.set(`game:${gameId}`, JSON.stringify(gameState), 'EX', 3600);

        // アクション履歴をクリア
        await redis.del(`game:${gameId}:actions`);

        // 5. 通知
        io.to(gameId).emit('round_resolved', {
            round: gameState.round,
            phase: gameState.phase,
            state: gameState // 差分更新が理想だが、まずは全体送信
        });

        console.log(`[Game] Round ${gameState.round} started for game ${gameId}`);

    } catch (error) {
        console.error('[Game] Resolution error:', error);
    }
}
