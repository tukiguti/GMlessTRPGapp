/**
 * Supabase クライアント設定
 *
 * PostgreSQLデータベース接続を提供します。
 * 環境変数からDATABASE_URLを読み込み、接続プールを管理します。
 */
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
// Supabase クライアント (フロントエンド/APIアクセス用)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Warning: SUPABASE_URL or SUPABASE_ANON_KEY is not set');
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, // サーバーサイドではセッション永続化不要
    },
});
// PostgreSQL 直接接続プール (データベース操作用)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.warn('Warning: DATABASE_URL is not set');
}
else if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.warn('Warning: DATABASE_URL has invalid format. Expected postgresql:// or postgres:// protocol');
}
// DATABASE_URLが有効な場合のみプールを作成
let poolInstance = null;
if (databaseUrl && databaseUrl.trim() !== '' && (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'))) {
    try {
        poolInstance = new Pool({
            connectionString: databaseUrl,
            max: parseInt(process.env.MAX_CONNECTIONS || '70', 10), // 最大接続数
            idleTimeoutMillis: 30000, // アイドルタイムアウト
            connectionTimeoutMillis: 10000, // 接続タイムアウトを10秒に延長
            ssl: { rejectUnauthorized: false }, // Supabaseでは常にSSL必須
        });
        // 接続エラーハンドリング
        poolInstance.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
        console.log('✓ Database connection pool initialized');
    }
    catch (error) {
        console.error('Error initializing database pool:', error);
        poolInstance = null;
    }
}
export const pool = poolInstance;
/**
 * データベース接続をテスト
 */
export async function testDatabaseConnection() {
    try {
        console.log('🔍 デバッグ情報:');
        console.log('  - DATABASE_URL exists:', !!databaseUrl);
        console.log('  - Pool initialized:', !!pool);
        if (!pool) {
            console.error('✗ Database pool is not initialized. Check DATABASE_URL format.');
            return false;
        }
        console.log('  - Attempting to connect to database...');
        const client = await pool.connect();
        console.log('  - Client connected, executing query...');
        const result = await client.query('SELECT NOW(), version()');
        console.log('✓ Database connected successfully!');
        console.log('  - Server time:', result.rows[0].now);
        console.log('  - PostgreSQL version:', result.rows[0].version.split('\n')[0]);
        client.release();
        return true;
    }
    catch (error) {
        console.error('✗ Database connection failed:');
        if (error instanceof Error) {
            console.error('  - Error name:', error.name);
            console.error('  - Error message:', error.message);
            if ('code' in error) {
                console.error('  - Error code:', error.code);
            }
            if ('errno' in error) {
                console.error('  - Error number:', error.errno);
            }
        }
        else {
            console.error('  - Error:', error);
        }
        return false;
    }
}
/**
 * データベース接続を安全にクローズ
 */
export async function closeDatabaseConnection() {
    if (pool) {
        await pool.end();
        console.log('Database connection pool closed');
    }
}
// プロセス終了時のクリーンアップ
process.on('SIGINT', async () => {
    await closeDatabaseConnection();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await closeDatabaseConnection();
    process.exit(0);
});
