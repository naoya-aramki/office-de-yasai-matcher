import { drizzle } from 'drizzle-orm/mysql2';
import { cases } from './drizzle/schema';
import * as fs from 'fs';

const db = drizzle(process.env.DATABASE_URL!);

async function reimportCases() {
  const casesData = JSON.parse(fs.readFileSync('./cases_data.json', 'utf-8'));
  
  console.log(`データベースの既存データをクリア中...`);
  await db.delete(cases);
  
  console.log(`${casesData.length}件の事例をインポート中...`);
  
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
      usageScale: caseData.usage_scale || null,
    });
  }
  
  console.log('✓ インポート完了');
}

reimportCases().catch(console.error);
