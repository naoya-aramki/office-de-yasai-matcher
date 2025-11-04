# 🚀 Vercel環境変数設定ガイド

## 📋 必須環境変数リスト

Vercelダッシュボードで以下の環境変数を設定してください：

### データベース接続

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `DATABASE_URL` | SupabaseのPostgreSQL接続URL | Supabaseダッシュボード → Settings → Database → Connection string (URI) |

**例**: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

### 認証・セキュリティ

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `JWT_SECRET` | Cookie署名用シークレットキー | ランダムな文字列を生成（32文字以上推奨） |
| `VITE_APP_ID` | Google OAuth App ID | Google Cloud Console → APIとサービス → 認証情報 → OAuth 2.0 クライアント ID |
| `VITE_OAUTH_PORTAL_URL` | OAuthサーバーURL | 既存のOAuthサーバー（Manus OAuth）のURL |

### 実行環境

| 変数名 | 説明 | 値 |
|--------|------|-----|
| `NODE_ENV` | 実行環境 | `production` |

---

## 🔧 各環境変数の詳細設定方法

### 1. DATABASE_URL（Supabase）

1. [Supabaseダッシュボード](https://app.supabase.com/)にログイン
2. プロジェクトを選択
3. **Settings** → **Database** に移動
4. **Connection string** セクションで **URI** を選択
5. パスワードを実際のパスワードに置き換える
6. コピーしてVercelに設定

**注意**: 
- パスワードは`[YOUR-PASSWORD]`の部分を実際のパスワードに置き換える
- 接続文字列には自動的に`?sslmode=require`が含まれる

### 2. JWT_SECRET

ランダムな文字列を生成します。以下のいずれかの方法で生成できます：

**方法1: ターミナルで生成**
```bash
# macOS/Linux
openssl rand -base64 32

# または
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**方法2: オンラインツール**
- [Random.org](https://www.random.org/strings/) でランダムな文字列を生成

**推奨**: 64文字のランダムな文字列（Base64エンコードされた32バイト）

### 3. VITE_APP_ID（Google OAuth）

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを作成または選択
3. **APIとサービス** → **認証情報** に移動
4. **認証情報を作成** → **OAuth 2.0 クライアント ID** を選択
5. アプリケーションの種類を **ウェブアプリケーション** に設定
6. 以下の情報を設定：
   - **名前**: Office de Yasai Matcher（任意）
   - **承認済みのリダイレクト URI**: 
     - `https://your-domain.vercel.app/api/oauth/callback`
     - `http://localhost:3000/api/oauth/callback`（ローカル開発用）
7. **作成** をクリック
8. **クライアントID** をコピー（これが`VITE_APP_ID`になります）

**例**: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`

### 4. VITE_OAUTH_PORTAL_URL

既存のOAuthサーバー（Manus OAuth）を使用する場合：

- OAuthサーバーのベースURLを設定
- **例**: `https://oauth.example.com`

**注意**: 
- 末尾にスラッシュ（`/`）は不要
- プロトコル（`https://`）を含める

### 5. NODE_ENV

- **値**: `production`
- Vercelでは自動的に設定される場合がありますが、明示的に設定することを推奨

---

## 📝 Vercelでの設定手順

### 方法1: Vercelダッシュボードから設定

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクトを選択
3. **Settings** → **Environment Variables** に移動
4. 各環境変数を追加：
   - **Name**: 変数名（例: `DATABASE_URL`）
   - **Value**: 値
   - **Environment**: `Production`, `Preview`, `Development` を選択
5. **Save** をクリック
6. **Redeploy** を実行（既にデプロイ済みの場合）

### 方法2: Vercel CLIから設定

```bash
# 環境変数を設定
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add VITE_APP_ID production
vercel env add VITE_OAUTH_PORTAL_URL production
vercel env add NODE_ENV production

# 確認
vercel env ls
```

---

## ✅ 設定確認チェックリスト

デプロイ前に以下を確認してください：

- [ ] `DATABASE_URL`が正しく設定されている（`postgresql://`で始まる）
- [ ] `JWT_SECRET`が32文字以上で設定されている
- [ ] `VITE_APP_ID`がGoogle OAuth Client IDの形式になっている
- [ ] `VITE_OAUTH_PORTAL_URL`が正しいURL形式になっている
- [ ] `NODE_ENV`が`production`に設定されている
- [ ] すべての環境変数が **Production** 環境に設定されている
- [ ] デプロイ後に環境変数が反映されているか確認（再デプロイが必要な場合あり）

---

## 🔍 環境変数の確認方法

### Vercelダッシュボードで確認

1. **Settings** → **Environment Variables** で一覧を確認
2. 各変数の値が正しく設定されているか確認

### デプロイ後のログで確認

1. **Deployments** → 最新のデプロイを選択
2. **Runtime Logs** を確認
3. 環境変数に関するエラーがないか確認

**注意**: 環境変数の値自体はログに表示されません（セキュリティのため）

---

## 🚨 よくある問題と解決方法

### 環境変数が反映されない

**原因**: 環境変数を追加した後に再デプロイしていない

**解決方法**:
1. 環境変数を設定後、**Redeploy** を実行
2. または、新しいコミットをプッシュ

### DATABASE_URLエラー

**原因**: 接続文字列が正しくない、またはパスワードが間違っている

**解決方法**:
1. Supabaseダッシュボードで接続文字列を再確認
2. パスワードが正しいか確認
3. `?sslmode=require`が含まれているか確認

### OAuth認証エラー

**原因**: `VITE_APP_ID`または`VITE_OAUTH_PORTAL_URL`が正しく設定されていない

**解決方法**:
1. Google Cloud ConsoleでOAuth Client IDを確認
2. リダイレクトURIが正しく設定されているか確認
3. `VITE_OAUTH_PORTAL_URL`が正しいURLか確認

---

## 📊 環境変数の優先順位

Vercelでは以下の順序で環境変数が読み込まれます：

1. **Environment Variables**（Vercelダッシュボードで設定）
2. `.env`ファイル（ローカル開発用、Vercelでは使用されない）

**注意**: Vercelでは`.env`ファイルは使用されません。必ずVercelダッシュボードで環境変数を設定してください。

---

## 🔐 セキュリティのベストプラクティス

1. **機密情報の保護**
   - `JWT_SECRET`や`DATABASE_URL`などの機密情報はGitにコミットしない
   - `.gitignore`に`.env`が含まれていることを確認

2. **環境変数の管理**
   - 本番環境と開発環境で異なる値を設定
   - 定期的に環境変数を確認・更新

3. **アクセス制御**
   - Vercelプロジェクトへのアクセス権限を適切に管理
   - 環境変数の変更履歴を確認できるようにする

---

**最終更新**: 2025-10-31

