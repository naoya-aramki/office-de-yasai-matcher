import { getDb } from './server/db';
import { cases } from './drizzle/schema';

async function testMatching() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  // データ件数を確認
  const allCases = await db.select().from(cases);
  console.log(`\n✓ データベースに${allCases.length}件の事例が登録されています\n`);

  // サンプルデータを表示
  console.log('サンプル事例:');
  allCases.slice(0, 3).forEach((c, i) => {
    console.log(`${i + 1}. ${c.companyName}`);
    console.log(`   業界: ${c.industry}`);
    console.log(`   従業員数: ${c.employeeCount || '不明'}`);
    console.log(`   課題数: ${c.challenges ? JSON.parse(c.challenges).length : 0}`);
    console.log('');
  });

  console.log('✓ テスト完了');
  process.exit(0);
}

testMatching();
