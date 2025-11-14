/**
 * DATABASE_URL 診断スクリプト
 *
 * DATABASE_URLの形式と内容を検証します
 */
import 'dotenv/config';
import { URL } from 'url';
function diagnoseDatabaseUrl() {
    console.log('========================================');
    console.log('DATABASE_URL 診断');
    console.log('========================================\n');
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL が設定されていません');
        console.log('\n.env ファイルに以下の形式で設定してください:');
        console.log('DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres');
        process.exit(1);
    }
    console.log('✓ DATABASE_URL が設定されています\n');
    // URLをパースして詳細を表示
    try {
        const url = new URL(databaseUrl);
        console.log('📋 接続情報:');
        console.log(`  - プロトコル: ${url.protocol}`);
        console.log(`  - ユーザー名: ${url.username}`);
        console.log(`  - パスワード: ${'*'.repeat(url.password.length)} (長さ: ${url.password.length}文字)`);
        console.log(`  - ホスト名: ${url.hostname}`);
        console.log(`  - ポート: ${url.port || '5432'}`);
        console.log(`  - データベース: ${url.pathname.slice(1)}`);
        // 検証チェック
        console.log('\n🔍 検証結果:');
        const checks = [
            {
                name: 'プロトコル',
                passed: url.protocol === 'postgresql:' || url.protocol === 'postgres:',
                message: url.protocol === 'postgresql:' || url.protocol === 'postgres:'
                    ? '✓ 正しいプロトコルです'
                    : `✗ プロトコルが正しくありません (${url.protocol})。postgresql:// または postgres:// を使用してください`,
            },
            {
                name: 'ホスト名',
                passed: url.hostname.includes('supabase.co'),
                message: url.hostname.includes('supabase.co')
                    ? '✓ Supabaseのホスト名です'
                    : `⚠️  ホスト名が Supabase のものではないようです (${url.hostname})`,
            },
            {
                name: 'ユーザー名',
                passed: url.username === 'postgres',
                message: url.username === 'postgres'
                    ? '✓ 正しいユーザー名です'
                    : `⚠️  ユーザー名が 'postgres' ではありません (${url.username})`,
            },
            {
                name: 'パスワード',
                passed: url.password.length > 0,
                message: url.password.length > 0
                    ? '✓ パスワードが設定されています'
                    : '✗ パスワードが設定されていません',
            },
            {
                name: 'ポート',
                passed: !url.port || url.port === '5432',
                message: !url.port || url.port === '5432'
                    ? '✓ デフォルトポート (5432) を使用'
                    : `⚠️  非標準ポート (${url.port}) を使用`,
            },
            {
                name: 'データベース名',
                passed: url.pathname.slice(1) === 'postgres',
                message: url.pathname.slice(1) === 'postgres'
                    ? '✓ 正しいデータベース名です'
                    : `⚠️  データベース名が 'postgres' ではありません (${url.pathname.slice(1)})`,
            },
        ];
        checks.forEach((check) => {
            console.log(`  ${check.message}`);
        });
        const allPassed = checks.every((check) => check.passed);
        console.log('\n========================================');
        if (allPassed) {
            console.log('✅ DATABASE_URL の形式は正しいです');
            console.log('\n接続に失敗する場合は、以下を確認してください:');
            console.log('  1. パスワードが正しいか');
            console.log('  2. Supabaseプロジェクトが稼働中か');
            console.log('  3. ネットワーク接続が正常か');
            console.log('  4. ファイアウォールで接続がブロックされていないか');
        }
        else {
            console.log('⚠️  DATABASE_URL に問題がある可能性があります');
            console.log('\nSupabase Dashboard で正しい接続文字列を確認してください:');
            console.log('  Settings → Database → Connection String');
        }
        console.log('========================================');
    }
    catch (error) {
        console.error('\n❌ DATABASE_URL のパースに失敗しました');
        if (error instanceof Error) {
            console.error(`エラー: ${error.message}`);
        }
        console.log('\n正しい形式:');
        console.log('DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres');
        process.exit(1);
    }
}
diagnoseDatabaseUrl();
