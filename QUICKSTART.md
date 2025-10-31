# 🚀 クイックスタートガイド

このガイドでは、**最短で**CSVデータをSupabaseにアップロードする方法を説明します。

## ⚡ 3ステップで完了！

### ステップ1: Supabaseでプロジェクト作成
1. [supabase.com](https://supabase.com) にアクセス
2. 「Start your project」→ GitHubでログイン
3. 「New Project」をクリック
4. プロジェクト名とパスワードを設定（**パスワードはメモ！**）
5. 2-3分待つ

### ステップ2: 接続情報を取得して設定
1. Supabaseダッシュボード → **Settings** → **Database**
2. **Connection string** → **URI** タブを選択
3. 文字列をコピー（`postgresql://...`で始まるもの）
4. `[YOUR-PASSWORD]`の部分を、ステップ1で設定したパスワードに置き換える

ターミナルで実行：
```bash
cd /Users/a2025-057/Downloads/office-de-yasai-matcher
export DATABASE_URL="postgresql://postgres.xxxxx:あなたのパスワード@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
```

### ステップ3: テーブル作成とデータインポート

**A. テーブル作成（SupabaseのSQLエディタで実行）**

1. Supabaseダッシュボード → **SQL Editor** → **New query**
2. 以下のSQLをコピー＆ペーストして **Run**：

```sql
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  "companyName" VARCHAR(255) NOT NULL,
  url TEXT,
  industry VARCHAR(100),
  "employeeCount" INTEGER,
  challenges TEXT,
  reasons TEXT,
  effects TEXT,
  "fullText" TEXT,
  "usageScale" VARCHAR(50),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**B. データインポート（ターミナルで実行）**

```bash
pnpm import:csv
```

**完了！** 🎉

---

## 📖 もっと詳しく知りたい場合

詳細な手順やトラブルシューティングは **`SUPABASE_SETUP.md`** を参照してください。

## ❓ よくある質問

**Q: エラーが出ました**
→ `SUPABASE_SETUP.md` の「エラーが出た場合」セクションを確認

**Q: データを再インポートしたい**
→ 再度 `pnpm import:csv` を実行するだけ（既存データは自動でクリアされます）

**Q: 接続文字列がわからない**
→ Supabaseダッシュボード → Settings → Database → Connection string → URI

