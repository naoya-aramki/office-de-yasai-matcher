# SupabaseにCSVデータをアップロードする手順

このガイドでは、`cases_20251031_071929.csv`のデータをSupabaseにアップロードする方法を説明します。

## 📋 必要なもの

- Supabaseアカウント（無料で作成できます）
- このプロジェクトのコード

---

## 🚀 ステップ1: Supabaseでプロジェクトを作成

1. [Supabase](https://supabase.com/)にアクセス
2. 「Start your project」または「Sign In」をクリック
3. GitHubアカウントでログイン（推奨）またはメールアドレスで登録
4. 「New Project」をクリック
5. 以下の情報を入力：
   - **Name**: `office-de-yasai-matcher`（好きな名前でOK）
   - **Database Password**: 強いパスワードを設定（**必ずメモしておく！**）ody831match
   - **Region**: 日本なら `Tokyo` を選択
6. 「Create new project」をクリック
7. 2-3分待つ（データベースが作成されます）

---

## 🔑 ステップ2: データベース接続情報を取得

1. Supabaseのダッシュボードで、作成したプロジェクトを開く
2. 左側のメニューから **「Settings」**（⚙️アイコン）をクリック
3. **「Database」** をクリック
4. 下にスクロールして **「Connection string」** セクションを見つける
5. **「URI」** タブを選択
6. 表示されている文字列をコピー（例：`postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`）

**⚠️ 重要**: この文字列の `[YOUR-PASSWORD]` の部分を、ステップ1で設定したパスワードに置き換えてください！

**例（実際の接続文字列）：**
```
postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres
```

**注意**: 角括弧 `[]` は**外してください**！パスワード部分だけを置き換えます。

**例：**
```
postgresql://postgres.xxxxx:myPassword123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

---

## 📝 ステップ3: ターミナルで環境変数を設定

ターミナルを開いて、以下のコマンドを実行します：

```bash
# プロジェクトのディレクトリに移動（まだの場合）
cd /Users/a2025-057/Downloads/office-de-yasai-matcher

# データベース接続文字列を設定（YOUR_CONNECTION_STRINGを実際の文字列に置き換える）
export DATABASE_URL="postgresql://postgres.xxxxx:myPassword123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
```

**確認方法：**
```bash
echo $DATABASE_URL
```
上記コマンドで、設定した接続文字列が表示されればOKです。

---

## 🗄️ ステップ4: データベースにテーブルを作成

SupabaseのSQLエディタでテーブルを作成します：

1. Supabaseダッシュボードの左側メニューから **「SQL Editor」** をクリック
2. **「New query」** をクリック
3. 以下のSQLをコピー＆ペースト：

```sql
-- casesテーブルを作成
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

4. **「Run」** ボタン（または Ctrl+Enter / Cmd+Enter）をクリック
5. 「Success. No rows returned」と表示されれば成功です！

**確認方法：**
- 左側メニューの **「Table Editor」** をクリック
- `cases` というテーブルが表示されていればOKです

---

## 📤 ステップ5: CSVデータをインポート

### 方法1: npm/npxを使用（pnpmがない場合）

ターミナルで以下のコマンドを実行します：

```bash
# 1. プロジェクトディレクトリに移動
cd /Users/a2025-057/Downloads/office-de-yasai-matcher

# 2. 接続文字列を設定（角括弧なし！）
export DATABASE_URL="postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres"

# 3. CSVをインポート（npxを使用）
npx tsx import-csv-to-supabase.ts
```

**または**、npmがインストールされている場合：

```bash
npm run import:csv
```

### 方法2: 簡単なスクリプトを使用

```bash
cd /Users/a2025-057/Downloads/office-de-yasai-matcher
bash run-import.sh
```

このスクリプトが自動的に環境変数を設定して、npm/npxを使用してインポートを実行します。

### 方法3: pnpmを使用（インストール済みの場合）

```bash
# 1. プロジェクトディレクトリに移動
cd /Users/a2025-057/Downloads/office-de-yasai-matcher

# 2. 接続文字列を設定
export DATABASE_URL="postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres"

# 3. CSVをインポート
pnpm import:csv
```

**実行すると：**
- CSVファイルを読み込みます
- 既存のデータをクリアします（初回は空なので問題ありません）
- データを1件ずつインポートします
- 進捗が50件ごとに表示されます

**完了すると：**
```
==================================================
✅ インポート完了！
   成功: 1228件
   所要時間: 15.3秒
==================================================
```
のようなメッセージが表示されます。

**⚠️ エラーが出た場合**: `TROUBLESHOOTING.md` を参照してください。

---

## ✅ ステップ6: データが正しくインポートされたか確認

1. Supabaseダッシュボードの **「Table Editor」** を開く
2. `cases` テーブルをクリック
3. データが表示されていれば成功です！

---

## 🐛 エラーが出た場合

詳細なトラブルシューティングは **`TROUBLESHOOTING.md`** を参照してください。

### よくあるエラー

**「DATABASE_URLが設定されていません」**
→ 環境変数を設定してください（ステップ3を参照）

**「データベースに接続できませんでした」**
→ 接続文字列のパスワードが正しいか確認してください

**「relation "cases" does not exist」**
→ ステップ4のテーブル作成が完了しているか確認してください

**その他のエラー**
→ `TROUBLESHOOTING.md` を参照してください

---

## 💡 ヒント

- 接続文字列は、`.env`ファイルに保存しておくと便利です（後で使用する場合）
- インポートは時間がかかる場合があります（1000件以上の場合）
- エラーが出ても、何件かはインポートされている可能性があります。Table Editorで確認してみてください

---

## 🎉 完了！

これで、CSVデータがSupabaseにアップロードされました！
次回からは、ステップ5の `pnpm import:csv` を実行するだけで、データを再インポートできます。

