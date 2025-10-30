import { getDb } from './server/db';
import { cases } from './drizzle/schema';
import * as fs from 'fs';

async function importCases() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  // 既存データをクリア
  await db.delete(cases);
  console.log('Cleared existing cases');

  // JSONファイルを読み込み
  const casesData = JSON.parse(fs.readFileSync('./cases_data.json', 'utf-8'));

  // データをインポート
  for (const caseData of casesData) {
    await db.insert(cases).values({
      companyName: caseData.company_name,
      url: caseData.url,
      industry: caseData.industry,
      employeeCount: caseData.employee_count,
      challenges: JSON.stringify(caseData.challenges),
      reasons: JSON.stringify(caseData.reasons),
      effects: JSON.stringify(caseData.effects),
      fullText: caseData.full_text,
    });
  }

  console.log(`Imported ${casesData.length} cases successfully`);
  process.exit(0);
}

importCases();
