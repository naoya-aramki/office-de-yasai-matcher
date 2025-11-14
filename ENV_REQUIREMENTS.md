# 📋 必要な環境変数チェックリスト

## ✅ 必須環境変数（4つ）

### 1. DATABASE_URL
**形式:**
```
DATABASE_URL=postgresql://postgres:パスワード@db.xxxxx.supabase.co:5432/postgres
```

**確認ポイント:**
- `postgresql://` で始まる
- `postgres:` の後にパスワードが入っている
- `@db.xxxxx.supabase.co:5432/postgres` のような形式

**取得方法:**
- Supabaseダッシュボード → Settings → Database → Connection string (URI)

---

### 2. JWT_SECRET
**形式:**
```
JWT_SECRET=32文字以上のランダムな文字列
```

**確認ポイント:**
- 32文字以上
- ランダムな文字列（Base64形式推奨）

**生成方法:**
```bash
openssl rand -base64 32
```

---

### 3. VITE_APP_ID
**形式:**
```
VITE_APP_ID=82889098105-e1agt84v3...完全なID.apps.googleusercontent.com
```

**確認ポイント:**
- 最後に `.apps.googleusercontent.com` で終わる
- 途中で切れていない（完全なID）

**取得方法:**
- Google Cloud Console → APIとサービス → 認証情報 → OAuth 2.0 クライアント ID

---

### 4. VITE_OAUTH_PORTAL_URL
**形式:**
```
VITE_OAUTH_PORTAL_URL=https://完全なOAuthサーバーURL
```

**確認ポイント:**
- `https://` または `http://` で始まる
- 完全なURL（途中で切れていない）
- **重要:** `VITE_` で始まる必要がある（`OAUTH_SERVER_URL` ではない）

**例:**
```
VITE_OAUTH_PORTAL_URL=https://oauth.example.com
```

---

## 📝 .envファイルの記入例

```bash
# Supabase PostgreSQL接続URL
DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres

# Cookie署名用シークレット（32文字以上推奨）
JWT_SECRET=gKjU7RzS+wq16TAK+nAEcDr完全な32文字以上の文字列

# Google OAuth App ID
VITE_APP_ID=82889098105-e1agt84v3完全なID.apps.googleusercontent.com

# OAuthサーバーURL（VITE_で始まる必要があります）
VITE_OAUTH_PORTAL_URL=https://完全なOAuthサーバーURL.com

# 実行環境
NODE_ENV=development
```

---

## 🔍 よくある間違い

### ❌ 間違い1: 変数名が違う
```
OAUTH_SERVER_URL=https://...  ← 間違い
```
```
VITE_OAUTH_PORTAL_URL=https://...  ← 正しい
```

### ❌ 間違い2: 値が途中で切れている
```
VITE_APP_ID=82889098105-e1agt84v3  ← 間違い（.apps.googleusercontent.comが欠けている）
```
```
VITE_APP_ID=82889098105-e1agt84v3完全なID.apps.googleusercontent.com  ← 正しい
```

### ❌ 間違い3: 値が空
```
DATABASE_URL=  ← 間違い（=の後に何もない）
```
```
DATABASE_URL=postgresql://...  ← 正しい
```

---

## ✅ 確認方法

記入後、以下のコマンドで確認：

```bash
node check-env.js
```

すべて✅が表示されれば準備完了です！

