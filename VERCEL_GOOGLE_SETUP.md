# 🚀 Vercel環境変数設定 & Google Cloud Console設定ガイド

## 📋 手順1: Vercelで環境変数を設定

### 1-1. Vercelダッシュボードにアクセス

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクトを選択（または新規作成）

### 1-2. 環境変数を追加

1. プロジェクトの **Settings** をクリック
2. 左メニューから **Environment Variables** を選択
3. 以下の環境変数を追加：

#### 必須環境変数（3つ）

**① DATABASE_URL**
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://postgres:パスワード@db.xxxxx.supabase.co:5432/postgres`
- **Environment**: `Production`, `Preview`, `Development` すべてにチェック
- **Save** をクリック

**② JWT_SECRET**
- **Name**: `JWT_SECRET`
- **Value**: 32文字以上のランダムな文字列
  - 生成方法: `openssl rand -base64 32` をターミナルで実行
- **Environment**: `Production`, `Preview`, `Development` すべてにチェック
- **Save** をクリック

**③ VITE_APP_ID**
- **Name**: `VITE_APP_ID`
- **Value**: Google OAuth Client ID（後で取得します）
  - 形式: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Environment**: `Production`, `Preview`, `Development` すべてにチェック
- **Save** をクリック

#### 削除する環境変数（もしあれば）

- `VITE_OAUTH_PORTAL_URL` - 不要になったので削除

### 1-3. 環境変数の確認

設定後、以下のように表示されます：

```
DATABASE_URL          [Production] [Preview] [Development]
JWT_SECRET            [Production] [Preview] [Development]
VITE_APP_ID           [Production] [Preview] [Development]
```

---

## 📋 手順2: Google Cloud ConsoleでOAuth設定

### 2-1. Google Cloud Consoleにアクセス

1. [Google Cloud Console](https://console.cloud.google.com/)にログイン
2. プロジェクトを選択（または新規作成）

### 2-2. OAuth同意画面を設定（初回のみ）

1. 左メニュー → **APIとサービス** → **OAuth同意画面**
2. ユーザータイプを選択：
   - **外部** を選択 → **作成**
3. アプリ情報を入力：
   - **アプリ名**: `Office de Yasai Matcher`
   - **ユーザーサポートメール**: `your-email@officedeyasai.jp`
   - **デベロッパーの連絡先情報**: `your-email@officedeyasai.jp`
4. **保存して次へ** をクリック
5. スコープ設定（デフォルトのまま）→ **保存して次へ**
6. テストユーザー（後で追加可能）→ **保存して次へ**
7. 概要を確認 → **ダッシュボードに戻る**

### 2-3. OAuth 2.0 クライアントIDを作成

1. 左メニュー → **APIとサービス** → **認証情報**
2. 上部の **+ 認証情報を作成** をクリック
3. **OAuth 2.0 クライアント ID** を選択

### 2-4. OAuth 2.0 クライアントIDの設定

1. **アプリケーションの種類**: **ウェブアプリケーション** を選択
2. **名前**: `Office de Yasai Matcher Web Client`（任意）
3. **承認済みのリダイレクト URI** を追加：

#### ローカル開発用
```
http://localhost:3000/api/oauth/callback
```

#### 本番環境用（Vercelのドメイン）
```
https://your-project-name.vercel.app/api/oauth/callback
```

**重要**: 
- `your-project-name` は実際のVercelのプロジェクト名に置き換える
- または、Vercelでカスタムドメインを設定している場合は、そのドメインを使用
- 例: `https://office-de-yasai-matcher.vercel.app/api/oauth/callback`

4. **作成** をクリック

### 2-5. クライアントIDをコピー

1. ポップアップに表示された **クライアントID** をコピー
   - 形式: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`
2. この値を **Vercelの環境変数 `VITE_APP_ID` に設定**
   - Vercelダッシュボード → Settings → Environment Variables
   - `VITE_APP_ID` を編集して、コピーした値を貼り付け

### 2-6. クライアントシークレット（オプション）

- 通常は不要（フロントエンドのみで使用する場合）
- サーバーサイドでトークン交換を行う場合は必要
- この場合は、**クライアントシークレット**もコピーしてVercelに設定

---

## 📋 手順3: Vercelで再デプロイ

環境変数を設定したら、再デプロイが必要です：

1. Vercelダッシュボードで **Deployments** を開く
2. 最新のデプロイメントの **...** メニューをクリック
3. **Redeploy** を選択
4. または、GitHubにプッシュすると自動デプロイされます

---

## ✅ 設定確認チェックリスト

### Vercel環境変数
- [ ] `DATABASE_URL` が設定されている
- [ ] `JWT_SECRET` が32文字以上で設定されている
- [ ] `VITE_APP_ID` がGoogle OAuth Client IDの形式になっている
- [ ] `VITE_OAUTH_PORTAL_URL` が削除されている（もしあれば）

### Google Cloud Console
- [ ] OAuth同意画面が設定されている
- [ ] OAuth 2.0 クライアントIDが作成されている
- [ ] リダイレクトURIが正しく設定されている：
  - [ ] `http://localhost:3000/api/oauth/callback`（ローカル用）
  - [ ] `https://your-domain.vercel.app/api/oauth/callback`（本番用）

### デプロイ
- [ ] Vercelで再デプロイが完了している

---

## 🔍 Vercelのドメインを確認する方法

1. Vercelダッシュボードでプロジェクトを開く
2. **Settings** → **Domains** を確認
3. 表示されているドメインを使用
   - 例: `office-de-yasai-matcher.vercel.app`
   - またはカスタムドメイン: `your-domain.com`

---

## 🚨 よくある問題

### 問題1: リダイレクトURIが一致しない

**エラー**: `redirect_uri_mismatch`

**解決方法**:
- Google Cloud Consoleで設定したリダイレクトURIと、実際のURLが完全に一致しているか確認
- プロトコル（`http://` vs `https://`）が正しいか確認
- 末尾のスラッシュ（`/`）がないか確認

### 問題2: 環境変数が反映されない

**解決方法**:
- 環境変数を設定後、**再デプロイ**が必要
- Vercelで環境変数が正しい環境（Production/Preview/Development）に設定されているか確認

### 問題3: OAuth同意画面が表示されない

**解決方法**:
- OAuth同意画面が公開されているか確認
- テストユーザーを追加しているか確認（開発中の場合）

---

## 📝 まとめ

1. **Vercel環境変数を設定**（3つ）
2. **Google Cloud ConsoleでOAuth設定**
3. **リダイレクトURIを設定**（ローカル + 本番）
4. **クライアントIDをVercelに設定**
5. **再デプロイ**

これで準備完了です！🎉

