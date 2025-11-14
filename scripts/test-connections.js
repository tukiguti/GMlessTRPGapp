/**
 * データベース・Redis 接続テストスクリプト
 *
 * 使用方法:
 *   npx tsx scripts/test-connections.ts
 *
 * 必要な環境変数:
 *   - DATABASE_URL: PostgreSQL接続文字列
 *   - REDIS_URL: Redis接続文字列 (オプション)
 *   - UPSTASH_REDIS_REST_URL: Upstash Redis URL (オプション)
 *   - UPSTASH_REDIS_REST_TOKEN: Upstash Redisトークン (オプション)
 */
import 'dotenv/config';
import { testDatabaseConnection, closeDatabaseConnection } from '../src/database/config/supabase';
import { testRedisConnection, closeRedisConnection } from '../src/database/config/redis';
async function runTests() {
    console.log('========================================');
    console.log('接続テスト開始');
    console.log('========================================\n');
    const results = [];
    // 環境変数チェック
    console.log('📋 環境変数チェック:');
    const envVars = [
        'DATABASE_URL',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'REDIS_URL',
        'UPSTASH_REDIS_REST_URL',
        'UPSTASH_REDIS_REST_TOKEN',
    ];
    envVars.forEach((varName) => {
        const value = process.env[varName];
        if (value) {
            // 機密情報をマスク
            const maskedValue = value.slice(0, 20) + '...';
            console.log(`  ✓ ${varName}: ${maskedValue}`);
        }
        else {
            console.log(`  ✗ ${varName}: 未設定`);
        }
    });
    console.log('\n========================================');
    console.log('1. データベース接続テスト');
    console.log('========================================\n');
    try {
        const dbSuccess = await testDatabaseConnection();
        results.push({
            name: 'PostgreSQL (Supabase)',
            success: dbSuccess,
        });
    }
    catch (error) {
        results.push({
            name: 'PostgreSQL (Supabase)',
            success: false,
            error: error instanceof Error ? error.message : String(error),
        });
    }
    console.log('\n========================================');
    console.log('2. Redis接続テスト');
    console.log('========================================\n');
    try {
        const redisSuccess = await testRedisConnection();
        results.push({
            name: 'Redis',
            success: redisSuccess,
        });
    }
    catch (error) {
        results.push({
            name: 'Redis',
            success: false,
            error: error instanceof Error ? error.message : String(error),
        });
    }
    // クリーンアップ
    console.log('\n========================================');
    console.log('クリーンアップ中...');
    console.log('========================================\n');
    await closeDatabaseConnection();
    await closeRedisConnection();
    // 結果サマリー
    console.log('\n========================================');
    console.log('テスト結果サマリー');
    console.log('========================================\n');
    results.forEach((result) => {
        const status = result.success ? '✓ 成功' : '✗ 失敗';
        console.log(`${status}: ${result.name}`);
        if (result.error) {
            console.log(`  エラー: ${result.error}`);
        }
    });
    const allSuccess = results.every((r) => r.success);
    const successCount = results.filter((r) => r.success).length;
    console.log(`\n合計: ${successCount}/${results.length} テスト成功\n`);
    if (allSuccess) {
        console.log('🎉 すべての接続テストに成功しました！');
        process.exit(0);
    }
    else {
        console.log('⚠️  一部の接続テストに失敗しました。');
        console.log('\n次のステップ:');
        console.log('  1. .env ファイルに必要な環境変数が設定されているか確認');
        console.log('  2. Supabase/Upstashのダッシュボードで接続情報を確認');
        console.log('  3. ファイアウォールやネットワーク設定を確認');
        process.exit(1);
    }
}
// エラーハンドリング
process.on('unhandledRejection', (error) => {
    console.error('未処理のエラー:', error);
    process.exit(1);
});
// テスト実行
runTests().catch((error) => {
    console.error('テスト実行エラー:', error);
    process.exit(1);
});
