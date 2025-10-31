# 🔗 VercelとSupabaseの連携設定

## ✅ 現在の状況

SupabaseにCSVデータをインポート完了しました。
次に、VercelのアプリケーションがSupabaseに接続できるように設定する必要があります。

---

## 📋 必要な設定

### 1. Vercelの環境変数を設定

Vercelダッシュボードで以下の環境変数を設定してください：

1. **Vercelダッシュボードにログイン**
   - https://vercel.com/dashboard

2. **プロジェクトを選択**
   - `office-de-yasai-matcher` プロジェクトを開く

3. **Settings → Environment Variables** を開く

4. **以下の環境変数を追加：**

   | 変数名 | 値 | 説明 |
   |--------|-----|------|
   | `DATABASE_URL` | `postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres` | Supabaseの接続文字列 |

5. **Environment** を選択：
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   （すべてにチェックを入れる）

6. **Save** をクリック

7. **再デプロイ**
   - 環境変数を追加した後、**Deployments** タブから最新のデプロイメントを選択
   - **Redeploy** をクリック

---

## 🧪 接続確認方法

### 方法1: Vercelのログを確認

1. Vercelダッシュボード → **Deployments**
2. 最新のデプロイメントをクリック
3. **Functions** タブを開く
4. `/api/server` をクリック
5. **Logs** タブでエラーがないか確認

### 方法2: アプリケーションで確認

1. デプロイされたアプリケーションにアクセス
2. ブラウザの開発者ツール（F12）を開く
3. **Console** タブでエラーがないか確認
4. **Network** タブでAPIリクエストが成功しているか確認

---

## ⚠️ よくある問題

### 「データベース接続エラー」と表示される場合

**原因1**: `DATABASE_URL`が設定されていない
- **解決**: Vercelの環境変数に`DATABASE_URL`を設定してください

**原因2**: 接続文字列が間違っている
- **解決**: Supabaseの接続文字列を再確認してください
- Supabaseダッシュボード → Settings → Database → Connection string → URI

**原因3**: 再デプロイしていない
- **解決**: 環境変数を追加した後、必ず再デプロイしてください

### 「relation "cases" does not exist」と表示される場合

**原因**: テーブルが作成されていない
- **解決**: SupabaseのSQLエディタでテーブルを作成してください（既に作成済みの場合はスキップ）

---

## 📝 確認チェックリスト

- [ ] Vercelの環境変数に`DATABASE_URL`を設定
- [ ] 環境変数をProduction、Preview、Developmentすべてに設定
- [ ] 再デプロイを実行
- [ ] アプリケーションでデータが表示されるか確認
- [ ] エラーログがないか確認

---

## 🔍 トラブルシューティング

### ログを確認する方法

```bash
# Vercel CLIを使用する場合
vercel logs [deployment-url]
```

### ローカルでテストする場合

```bash
# .envファイルを作成
echo 'DATABASE_URL="postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres"' > .env

# 開発サーバーを起動
npm run dev
```

---

## ✅ 完了後

データが正しく表示されれば、連携完了です！

次回からは、Supabaseのデータを更新すると、Vercelのアプリケーションにも反映されます。

