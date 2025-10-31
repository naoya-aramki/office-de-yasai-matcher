// 簡単な接続テストスクリプト
import { getDb } from './server/db';

async function testConnection() {
  console.log('🔍 接続テストを開始します...\n');

  // 環境変数の確認
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URLが設定されていません');
    console.error('\n以下のコマンドで設定してください:');
    console.error('export DATABASE_URL="postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres"');
    process.exit(1);
  }

  console.log('✅ DATABASE_URLが設定されています');
  console.log(`   接続先: ${process.env.DATABASE_URL.substring(0, 50)}...\n`);

  // データベース接続テスト
  try {
    const db = await getDb();
    if (!db) {
      console.error('❌ データベース接続に失敗しました');
      process.exit(1);
    }

    console.log('✅ データベース接続成功！\n');

    // テーブルの存在確認
    try {
      const result = await db.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'cases'
        );
      `);
      console.log('✅ casesテーブルの存在確認:', result);
    } catch (error) {
      console.error('⚠️  casesテーブルが見つかりません');
      console.error('   SQLエディタでテーブルを作成してください（SUPABASE_SETUP.md参照）');
      console.error(`   エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('\n✅ 接続テスト完了！');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ エラーが発生しました:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testConnection();

