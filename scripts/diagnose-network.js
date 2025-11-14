/**
 * ネットワーク・DNS 診断スクリプト
 *
 * Supabaseへの接続問題を診断します
 */
import 'dotenv/config';
import { URL } from 'url';
import { promises as dns } from 'dns';
async function diagnoseNetwork() {
    console.log('========================================');
    console.log('ネットワーク・DNS 診断');
    console.log('========================================\n');
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL が設定されていません');
        process.exit(1);
    }
    let hostname;
    try {
        const url = new URL(databaseUrl);
        hostname = url.hostname;
        console.log(`📡 テスト対象ホスト: ${hostname}\n`);
    }
    catch (error) {
        console.error('❌ DATABASE_URLのパースに失敗しました');
        process.exit(1);
    }
    // 1. DNS解決テスト
    console.log('========================================');
    console.log('1. DNS解決テスト');
    console.log('========================================\n');
    try {
        console.log(`🔍 ${hostname} を解決中...`);
        const addresses = await dns.lookup(hostname, { all: true });
        if (addresses.length > 0) {
            console.log('✅ DNS解決成功！\n');
            console.log('📋 解決されたIPアドレス:');
            addresses.forEach((addr, index) => {
                console.log(`  ${index + 1}. ${addr.address} (${addr.family === 4 ? 'IPv4' : 'IPv6'})`);
            });
        }
        else {
            console.log('⚠️  IPアドレスが見つかりませんでした');
        }
    }
    catch (error) {
        console.error('\n❌ DNS解決失敗！');
        if (error instanceof Error) {
            console.error(`エラー: ${error.message}`);
            if ('code' in error) {
                console.error(`エラーコード: ${error.code}`);
            }
        }
        console.log('\n🔧 トラブルシューティング:');
        console.log('\n1. ターミナルで以下のコマンドを実行してDNSを確認:');
        console.log(`   nslookup ${hostname}`);
        console.log(`   または`);
        console.log(`   dig ${hostname}`);
        console.log('\n2. 一般的なホスト名で接続テスト:');
        console.log('   ping google.com');
        console.log('\n3. 可能性のある原因:');
        console.log('   - インターネット接続の問題');
        console.log('   - VPNやプロキシの設定');
        console.log('   - ファイアウォール設定');
        console.log('   - DNS設定の問題');
        console.log('   - Supabaseプロジェクトが削除または停止された可能性');
        console.log('\n4. 以下を確認してください:');
        console.log('   - Supabase Dashboard (https://app.supabase.com)');
        console.log('   - プロジェクトが「Active」状態か');
        console.log('   - Settings → Database で正しい接続文字列を再確認');
        process.exit(1);
    }
    // 2. 別のSupabaseホストでテスト
    console.log('\n========================================');
    console.log('2. 一般的なホスト名でDNSテスト');
    console.log('========================================\n');
    const testHosts = [
        { name: 'Google DNS', host: 'google.com' },
        { name: 'Supabase公式サイト', host: 'supabase.com' },
    ];
    for (const testHost of testHosts) {
        try {
            console.log(`🔍 ${testHost.name} (${testHost.host}) を解決中...`);
            const addresses = await dns.lookup(testHost.host);
            console.log(`✅ 成功: ${addresses.address}\n`);
        }
        catch (error) {
            console.error(`❌ 失敗: ${testHost.host}`);
            if (error instanceof Error) {
                console.error(`   エラー: ${error.message}\n`);
            }
        }
    }
    // 3. 推奨事項
    console.log('========================================');
    console.log('3. 次のステップ');
    console.log('========================================\n');
    console.log('✅ もし一般的なホスト名が解決できている場合:');
    console.log('   → Supabaseダッシュボードで以下を確認してください:');
    console.log('   1. プロジェクトが「Active」状態か');
    console.log('   2. Settings → Database → Connection String');
    console.log('   3. 正しいホスト名とパスワードか\n');
    console.log('❌ もし一般的なホスト名も解決できない場合:');
    console.log('   → ネットワーク接続に問題があります:');
    console.log('   1. インターネット接続を確認');
    console.log('   2. VPN接続を確認（必要に応じてオン/オフ）');
    console.log('   3. DNSサーバー設定を確認（8.8.8.8 や 1.1.1.1 を試す）');
    console.log('   4. ファイアウォール設定を確認\n');
}
// エラーハンドリング
process.on('unhandledRejection', (error) => {
    console.error('未処理のエラー:', error);
    process.exit(1);
});
// 診断実行
diagnoseNetwork().catch((error) => {
    console.error('診断実行エラー:', error);
    process.exit(1);
});
