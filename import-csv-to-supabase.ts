import { getDb } from './server/db';
import { cases } from './drizzle/schema';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

interface CSVRow {
  id: string;
  companyName: string;
  url: string;
  industry: string;
  employeeCount: string;
  challenges: string;
  reasons: string;
  effects: string;
  fullText: string;
  createdAt: string;
  usageScale: string;
}

function parseCSV(csvContent: string): CSVRow[] {
  // csv-parseライブラリを使用してより正確にパース
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      quote: '"',
      escape: '"',
    }) as any[];
    
    return records.map((record: any) => ({
      id: record.id || '',
      companyName: record.companyName || '',
      url: record.url || '',
      industry: record.industry || '',
      employeeCount: record.employeeCount || '',
      challenges: record.challenges || '',
      reasons: record.reasons || '',
      effects: record.effects || '',
      fullText: record.fullText || '',
      createdAt: record.createdAt || '',
      usageScale: record.usageScale || '',
    })) as CSVRow[];
  } catch (error) {
    console.error('CSVパースエラー:', error);
    return [];
  }
}

async function importCasesFromCSV() {
  console.log('🚀 CSVインポートを開始します...\n');

  // データベース接続確認
  if (!process.env.DATABASE_URL) {
    console.error('❌ エラー: DATABASE_URLが設定されていません');
    console.error('\n以下のコマンドで接続文字列を設定してください:');
    console.error('export DATABASE_URL="postgresql://..."');
    console.error('\n詳細は SUPABASE_SETUP.md を参照してください。');
    process.exit(1);
  }

  const db = await getDb();
  if (!db) {
    console.error('❌ エラー: データベースに接続できませんでした');
    console.error('DATABASE_URLを確認してください:');
    console.error(`現在の値: ${process.env.DATABASE_URL.substring(0, 30)}...`);
    process.exit(1);
  }

  console.log('✅ データベース接続成功\n');

  const csvPath = path.resolve(import.meta.dirname, './cases_20251031_071929.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ エラー: CSVファイルが見つかりません: ${csvPath}`);
    process.exit(1);
  }

  console.log('📄 CSVファイルを読み込んでいます...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);
  
  console.log(`✅ ${rows.length}件のデータを読み込みました\n`);
  
  // デバッグ: 最初の1件のデータ構造を確認
  if (rows.length > 0) {
    const firstRow = rows[0];
    console.log('🔍 デバッグ: 最初の1件のデータ構造:');
    console.log(`  companyName: ${firstRow.companyName?.substring(0, 50)}...`);
    console.log(`  fullText length: ${firstRow.fullText?.length || 0}`);
    console.log(`  usageScale: ${firstRow.usageScale}`);
    console.log(`  全フィールド数: ${Object.keys(firstRow).length}\n`);
  }

  // 既存データをクリア
  console.log('🗑️  既存のデータをクリアしています...');
  try {
    await db.delete(cases);
    console.log('✅ クリア完了\n');
  } catch (error) {
    console.error('⚠️  警告: 既存データのクリアに失敗しました（初回実行時は無視してOK）');
    console.error(`エラー: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }

  // データをインポート
  console.log('📤 データをインポートしています...\n');
  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  // バッチサイズを設定（一度に10件ずつ処理）
  const BATCH_SIZE = 10;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (row, batchIndex) => {
      try {
        // challenges, reasons, effects は既にJSON文字列なのでそのまま使用
        // ただし、空の場合はnullにする
        const challenges = row.challenges && row.challenges.trim() && row.challenges.trim() !== '[]'
          ? row.challenges.trim() 
          : null;
        const reasons = row.reasons && row.reasons.trim() && row.reasons.trim() !== '[]'
          ? row.reasons.trim() 
          : null;
        const effects = row.effects && row.effects.trim() && row.effects.trim() !== '[]'
          ? row.effects.trim() 
          : null;

        // employeeCount を数値に変換（空の場合はnull）
        const employeeCount = row.employeeCount && row.employeeCount.trim()
          ? parseInt(row.employeeCount.trim(), 10)
          : null;

        // fullTextの処理（nullや空文字列の処理、長すぎる場合は切り詰め）
        let fullText = row.fullText && row.fullText.trim() ? row.fullText.trim() : null;
        if (fullText) {
          // PostgreSQLのtext型は理論上無制限だが、実用的な制限を設ける
          // Supabaseの制限を考慮して100万文字まで
          const MAX_TEXT_LENGTH = 1000000;
          if (fullText.length > MAX_TEXT_LENGTH) {
            console.warn(`  ⚠️  警告: ${row.companyName} のfullTextが長すぎるため切り詰めます (${fullText.length}文字 -> ${MAX_TEXT_LENGTH}文字)`);
            fullText = fullText.substring(0, MAX_TEXT_LENGTH);
          }
        }

        // データの準備（空文字列はnullに変換）
        const insertData = {
          companyName: (row.companyName || '').trim() || '',
          url: row.url && row.url.trim() ? row.url.trim() : null,
          industry: row.industry && row.industry.trim() ? row.industry.trim() : null,
          employeeCount: employeeCount,
          challenges: challenges,
          reasons: reasons,
          effects: effects,
          fullText: fullText,
          usageScale: row.usageScale && row.usageScale.trim() ? row.usageScale.trim() : null,
        };

        await db.insert(cases).values(insertData);

        return { success: true, row };
      } catch (error: any) {
        // PostgreSQLのエラーメッセージを取得
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
          // postgresライブラリのエラーの場合
          if (error.code) {
            errorMessage += ` (code: ${error.code})`;
          }
          if (error.detail) {
            errorMessage += ` (detail: ${error.detail})`;
          }
          if (error.hint) {
            errorMessage += ` (hint: ${error.hint})`;
          }
        } else if (typeof error === 'object' && error !== null) {
          errorMessage = JSON.stringify(error);
        } else {
          errorMessage = String(error);
        }
        return { success: false, row, error: new Error(errorMessage) };
      }
    });

    const results = await Promise.all(batchPromises);
    
    for (const result of results) {
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        const rowIndex = i + batch.indexOf(result.row);
        console.error(`  ❌ エラー: ${result.row.companyName || result.row.id || 'unknown'} のインポートに失敗`);
        // 最初の10件のエラーのみ詳細を表示
        if (rowIndex < 10) {
          const errorMsg = result.error instanceof Error ? result.error.message : String(result.error);
          console.error(`     詳細: ${errorMsg}`);
          // エラーオブジェクト全体を表示（最初の3件のみ）
          if (rowIndex < 3) {
            console.error(`     エラーオブジェクト:`, JSON.stringify(result.error, Object.getOwnPropertyNames(result.error), 2).substring(0, 500));
          }
        }
      }
    }

    if ((i + BATCH_SIZE) % 50 === 0 || i + BATCH_SIZE >= rows.length) {
      const progress = (((i + BATCH_SIZE) / rows.length) * 100).toFixed(1);
      console.log(`  📊 進捗: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}件 (${progress}%)`);
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(50));
  console.log('✅ インポート完了！');
  console.log(`   成功: ${successCount}件`);
  if (errorCount > 0) {
    console.log(`   ⚠️  エラー: ${errorCount}件`);
  }
  console.log(`   所要時間: ${duration}秒`);
  console.log('='.repeat(50));
  console.log('\nSupabaseのTable Editorでデータを確認してください！\n');
  
  process.exit(0);
}

importCasesFromCSV().catch((error) => {
  console.error('\n❌ 致命的なエラーが発生しました:');
  console.error(error instanceof Error ? error.message : error);
  console.error('\n解決方法:');
  console.error('1. DATABASE_URLが正しく設定されているか確認');
  console.error('2. Supabaseのテーブルが作成されているか確認');
  console.error('3. SUPABASE_SETUP.md の手順を確認');
  process.exit(1);
});

