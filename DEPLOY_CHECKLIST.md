# 🚀 デプロイ前チェックリスト

## ✅ コード修正完了
- [x] Manus OAuthへの依存を削除
- [x] Google OAuthを直接使用するように変更
- [x] 環境変数の要件を更新
- [x] 環境変数チェックスクリプトを更新

## 📋 デプロイ前に確認すること

### 1. ローカルでテスト（推奨）

```bash
# 環境変数を設定
# .envファイルに以下を記入：
# DATABASE_URL=postgresql://...
# JWT_SECRET=...
# VITE_APP_ID=...

# 環境変数を確認
node check-env.js

# サーバーを起動
npm run dev

# ブラウザで http://localhost:3000 にアクセス
# Googleログインをテスト
```

### 2. Google Cloud Consoleの設定

- [ ] OAuth 2.0 クライアントIDを作成済み
- [ ] リダイレクトURIを設定：
  - `http://localhost:3000/api/oauth/callback`（ローカル用）
  - `https://your-domain.vercel.app/api/oauth/callback`（本番用）
- [ ] OAuth同意画面を設定済み

### 3. Vercel環境変数の設定

Vercelダッシュボードで以下を設定：

**必須:**
- [ ] `DATABASE_URL` - Supabase PostgreSQL接続URL
- [ ] `JWT_SECRET` - 32文字以上のランダム文字列
- [ ] `VITE_APP_ID` - Google OAuth Client ID

**オプション:**
- [ ] `GOOGLE_CLIENT_SECRET` - サーバーサイドアプリの場合のみ
- [ ] `NODE_ENV` - `production`（通常は自動設定）

**削除:**
- [ ] `VITE_OAUTH_PORTAL_URL` - 不要になったので削除

### 4. PR作成前の確認

- [ ] コードにエラーがない（`npm run check`）
- [ ] 未使用のimportがない
- [ ] ドキュメントを更新（オプション）

### 5. デプロイ後の確認

- [ ] Vercelでデプロイが成功
- [ ] ブラウザで本番URLにアクセス
- [ ] Googleログインが動作する
- [ ] `@officedeyasai.jp`のメールアドレスでログインできる
- [ ] 他のメールアドレスでアクセス拒否される

## 🎯 デプロイ手順

1. **ローカルでテスト**（推奨）
   ```bash
   # .envファイルに環境変数を設定
   node check-env.js  # 確認
   npm run dev        # 起動してテスト
   ```

2. **PR作成**
   ```bash
   git add .
   git commit -m "feat: Manus OAuthを削除し、Google OAuthを直接使用するように変更"
   git push origin your-branch-name
   # GitHubでPRを作成
   ```

3. **Vercel環境変数を設定**
   - Vercelダッシュボード → Settings → Environment Variables
   - 必須環境変数を追加
   - `VITE_OAUTH_PORTAL_URL`を削除（もしあれば）

4. **デプロイ**
   - PRをマージすると自動デプロイ
   - または手動でデプロイ

5. **動作確認**
   - 本番URLでログインテスト

## ⚠️ 注意事項

- Google OAuth Client Secretは通常不要（フロントエンドのみの場合）
- サーバーサイドでトークン交換を行う場合は`GOOGLE_CLIENT_SECRET`が必要
- リダイレクトURIは正確に設定する必要がある

