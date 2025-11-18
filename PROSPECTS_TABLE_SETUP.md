# 📊 見込み顧客テーブルの作成手順

## 概要

見込み顧客の入力内容（業界、従業員数、課題など）をデータベースに保存するためのテーブルを作成します。

## テーブル構造

- `id`: 主キー（自動採番）
- `industry`: 業界（必須）
- `employeeCount`: 従業員数（オプション）
- `challenges`: 課題のテキスト（必須）
- `matchedCaseId`: マッチした事例のID（オプション）
- `matchScore`: マッチングスコア（オプション）
- `createdAt`: 作成日時（自動設定）

## 作成手順

### 方法1: SupabaseのSQLエディタで実行（推奨）

1. [Supabaseダッシュボード](https://app.supabase.com/)にアクセス
2. プロジェクトを選択
3. 左メニューから **SQL Editor** をクリック
4. **New query** をクリック
5. 以下のSQLをコピー＆ペースト：

```sql
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
```

6. **Run** ボタン（または Ctrl+Enter / Cmd+Enter）をクリック
7. 「Success. No rows returned」と表示されれば成功です！

### 方法2: ローカルでマイグレーションを実行

```bash
# DATABASE_URLを設定
export DATABASE_URL="postgresql://postgres:パスワード@db.xxxxx.supabase.co:5432/postgres"

# マイグレーションを実行
npm run db:push
```

## 確認方法

1. Supabaseダッシュボード → **Table Editor** を開く
2. `prospects` テーブルが表示されていればOKです

## 動作確認

マッチング機能を使用すると、自動的に見込み顧客の入力内容が`prospects`テーブルに保存されます。

1. アプリでマッチングを実行
2. Supabaseダッシュボード → **Table Editor** → `prospects` を確認
3. 新しいレコードが追加されていることを確認

## データの確認方法

SupabaseのSQLエディタで以下のクエリを実行すると、保存されたデータを確認できます：

```sql
-- 最新10件の見込み顧客データを取得
SELECT 
  id,
  industry,
  "employeeCount",
  challenges,
  "matchedCaseId",
  "matchScore",
  "createdAt"
FROM prospects
ORDER BY "createdAt" DESC
LIMIT 10;
```

## 注意事項

- 保存に失敗してもマッチング結果は返されます（エラーログのみ出力）
- 個人情報が含まれる可能性があるため、適切なセキュリティ対策を実施してください

