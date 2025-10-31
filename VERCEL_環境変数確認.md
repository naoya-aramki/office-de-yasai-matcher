# 🔍 Vercel環境変数の確認方法

## ❌ 現在のエラー

```
Unexpected token 'A', "A server e"... is not valid JSON
/api/trpc/cases.match?batch=1:1 Failed to load resource: the server responded with a status of 500
```

このエラーは、**Vercelの環境変数に`DATABASE_URL`が設定されていない**可能性が高いです。

---

## ✅ 解決方法

### 1. Vercelダッシュボードで環境変数を確認

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com/dashboard

2. **プロジェクトを選択**
   - `office-de-yasai-matcher` を開く

3. **Settings → Environment Variables** を開く

4. **以下の環境変数が設定されているか確認：**

   | 変数名 | 値 |
   |--------|-----|
   | `DATABASE_URL` | `postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres` |

5. **設定されていない場合：**
   - **Add New** をクリック
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres`
   - **Environment**: Production, Preview, Development すべてにチェック
   - **Save** をクリック

6. **再デプロイ**
   - **Deployments** タブを開く
   - 最新のデプロイメントの **...** メニューから **Redeploy** を選択

---

## 🔍 ログで確認する方法

### Vercelのログを確認

1. **Deployments** タブを開く
2. 最新のデプロイメントをクリック
3. **Functions** タブを開く
4. `/api/server` をクリック
5. **Logs** タブで以下のメッセージを確認：

**✅ 成功している場合：**
```
[Database] Connecting to database...
[Database] Connected successfully
[Cases.getAll] Successfully retrieved 68 cases
```

**❌ エラーの場合：**
```
[Database] DATABASE_URL is not set
```
または
```
[Database] Failed to connect: ...
```

---

## ⚠️ よくある問題

### 1. 環境変数が設定されていない

**症状**: `[Database] DATABASE_URL is not set` がログに表示される

**解決**: 上記の手順で環境変数を設定してください

### 2. 接続文字列が間違っている

**症状**: `[Database] Failed to connect` がログに表示される

**解決**: 
- Supabaseダッシュボード → Settings → Database → Connection string → URI
- 接続文字列を再確認してください

### 3. 再デプロイしていない

**症状**: 環境変数を設定したのにエラーが続く

**解決**: 環境変数を追加した後、**必ず再デプロイ**してください

---

## 🧪 ローカルでテストする場合

```bash
# .envファイルを作成
echo 'DATABASE_URL="postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres"' > .env

# 開発サーバーを起動
npm run dev
```

ローカルで動作すれば、Vercelの環境変数の問題です。

---

## 📝 チェックリスト

- [ ] Vercelの環境変数に`DATABASE_URL`を設定
- [ ] Production, Preview, Developmentすべてに設定
- [ ] 再デプロイを実行
- [ ] Vercelのログでエラーがないか確認
- [ ] アプリケーションでデータが表示されるか確認

