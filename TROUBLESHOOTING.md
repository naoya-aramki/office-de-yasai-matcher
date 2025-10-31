# 🔧 トラブルシューティングガイド

CSVインポートで問題が発生した場合の解決方法です。

## ❌ 「DATABASE_URLが設定されていません」と表示される

**原因**: 環境変数が設定されていない

**解決方法**:
```bash
export DATABASE_URL="postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres"
```

ターミナルを閉じると環境変数が消えるので、毎回設定する必要があります。

---

## ❌ 「データベースに接続できませんでした」と表示される

**原因1**: 接続文字列が間違っている

**解決方法**:
- パスワード部分（`ody831match`）が正しいか確認
- 角括弧 `[]` が含まれていないか確認
- Supabaseの接続文字列を再確認

**原因2**: Supabaseのプロジェクトが停止している

**解決方法**:
1. Supabaseダッシュボードにログイン
2. プロジェクトが「Active」になっているか確認
3. 停止している場合は再起動

---

## ❌ 「relation "cases" does not exist」と表示される

**原因**: テーブルが作成されていない

**解決方法**:
1. Supabaseダッシュボード → **SQL Editor**
2. 以下のSQLを実行：

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

3. **Run** ボタンをクリック
4. 「Success」と表示されればOK

---

## ❌ 「pnpm: command not found」と表示される

**解決方法1**: npmを使用する
```bash
npm run import:csv
```

**解決方法2**: npxを使用する
```bash
export DATABASE_URL="postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres"
npx tsx import-csv-to-supabase.ts
```

**解決方法3**: pnpmをインストールする
```bash
npm install -g pnpm
```

---

## ❌ 「CSVファイルが見つかりません」と表示される

**原因**: CSVファイルのパスが間違っている

**解決方法**:
1. プロジェクトディレクトリにいるか確認：
   ```bash
   cd /Users/a2025-057/Downloads/office-de-yasai-matcher
   ```

2. CSVファイルが存在するか確認：
   ```bash
   ls -la cases_20251031_071929.csv
   ```

---

## ❌ その他のエラー

### 接続テストを実行する

```bash
export DATABASE_URL="postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres"
npx tsx test-connection.ts
```

このコマンドで、接続やテーブルの状態を確認できます。

### 簡単な実行方法

`run-import.sh` スクリプトを使用：

```bash
./run-import.sh
```

このスクリプトは自動的に環境変数を設定してインポートを実行します。

---

## 💡 よくある質問

**Q: 環境変数は毎回設定する必要がありますか？**
A: はい。ターミナルを閉じると消えます。`.env`ファイルを使う方法もあります。

**Q: データを再インポートしたい場合は？**
A: 再度 `pnpm import:csv` を実行するだけです。既存データは自動でクリアされます。

**Q: 一部のデータだけインポートしたい場合は？**
A: CSVファイルを編集してからインポートしてください。

