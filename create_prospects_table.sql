-- 見込み顧客テーブルを作成
CREATE TABLE IF NOT EXISTS prospects (
  id SERIAL PRIMARY KEY,
  industry VARCHAR(100) NOT NULL,
  "employeeCount" INTEGER,
  challenges TEXT NOT NULL,
  "matchedCaseId" INTEGER,
  "matchScore" INTEGER,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- インデックスを追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON prospects("createdAt");
CREATE INDEX IF NOT EXISTS idx_prospects_industry ON prospects(industry);
CREATE INDEX IF NOT EXISTS idx_prospects_matched_case_id ON prospects("matchedCaseId");
