/**
 * Supabase クライアント設定 (フロントエンド)
 *
 * Vite環境変数を使用してSupabaseクライアントを初期化します。
 * 認証、リアルタイムサブスクリプション、データベースクエリに使用されます。
 */

import { createClient } from '@supabase/supabase-js';

// Vite環境変数から取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set in environment variables'
  );
}

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // ブラウザでセッション永続化
    autoRefreshToken: true, // トークン自動更新
    detectSessionInUrl: true, // URLからセッション検出
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // リアルタイムイベント制限
    },
  },
});

/**
 * データベース型定義
 * Supabase CLIで生成した型をインポートする場合はここで設定
 */
export type Database = {
  public: {
    Tables: {
      // ここにテーブル定義を追加
      games: {
        Row: {
          id: string;
          created_at: string;
          status: string;
          // ... 他のフィールド
        };
        Insert: {
          id?: string;
          status: string;
          // ...
        };
        Update: {
          status?: string;
          // ...
        };
      };
      // 他のテーブル...
    };
  };
};

// 型安全なクライアント
// export const typedSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
