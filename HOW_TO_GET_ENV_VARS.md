# 🔍 環境変数の取得方法ガイド

このドキュメントでは、Vercelで必要な各環境変数の取得方法を詳しく説明します。

## ⚠️ 重要なセキュリティ注意事項

**絶対にパスワードや機密情報をこのファイルやGitリポジトリにコミットしないでください！**

- DATABASE_URLにはパスワードが含まれます
- JWT_SECRETは機密情報です
- これらをGitにコミットすると、誰でもアクセス可能になります
- データベースが不正アクセスされる可能性があります

**ローカル開発用の設定方法**:
- `.env`ファイルを使用（`.gitignore`に含まれています）
- `.env.example`ファイルにプレースホルダーを記載（実際の値は含めない）

---

## 1. DATABASE_URL（Supabase PostgreSQL接続URL）

### 取得手順

1. **Supabaseダッシュボードにアクセス**
   - https://app.supabase.com/ にログイン

2. **プロジェクトを選択**
   - ダッシュボードから対象プロジェクトを選択

3. **Settings → Database に移動**
   - 左メニューから「Settings」をクリック
   - 「Database」を選択

4. **Connection string をコピー**
   - 「Connection string」セクションを開く
   - 「URI」タブを選択
   - 表示された接続文字列をコピー

5. **パスワードを置き換え**
   - コピーした文字列に `[YOUR-PASSWORD]` がある場合、実際のパスワードに置き換える
   - 例: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
   - → `postgresql://postgres:actual_password@db.xxxxx.supabase.co:5432/postgres`

### 例

```
postgresql://postgres:your_actual_password@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres
```

### 注意点

- パスワードに特殊文字が含まれる場合は、URLエンコードが必要な場合があります
- `?sslmode=require` が自動的に含まれている場合があります（そのままでOK）

---

## 2. JWT_SECRET（Cookie署名用シークレット）

### 取得手順（方法1: ターミナルで生成）

**macOS/Linux:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 取得手順（方法2: オンラインツール）

1. **Random.org にアクセス**
   - https://www.random.org/strings/ を開く

2. **設定**
   - **Generate**: 1
   - **Length**: 64
   - **Characters**: Base64文字（A-Z, a-z, 0-9, +, /）
   - **Generate** をクリック

3. **結果をコピー**
   - 生成された文字列をコピー

### 例

```
aB3dEf9gHiJkLmNoPqRsTuVwXyZ1234567890+/abcdefghijklmn
```

### 注意点

- 32文字以上を推奨（Base64エンコードされた32バイト = 約44文字）
- 一度生成したら安全に保管（再生成すると既存のセッションが無効になる）

---

## 3. VITE_APP_ID（Google OAuth App ID）

### 取得手順

1. **Google Cloud Console にアクセス**
   - https://console.cloud.google.com/ にログイン
   - Googleアカウントでログイン（@officedeyasai.jpのアカウント推奨）

2. **プロジェクトを作成または選択**
   - 上部のプロジェクト選択ドロップダウンをクリック
   - 「新しいプロジェクト」をクリック（または既存プロジェクトを選択）
   - プロジェクト名: `Office de Yasai Matcher`（任意）
   - 「作成」をクリック

3. **OAuth同意画面を設定**
   - 左メニュー → **APIとサービス** → **OAuth同意画面**
   - ユーザータイプ: **外部** を選択 → **作成**
   - アプリ情報を入力:
     - アプリ名: `Office de Yasai Matcher`
     - ユーザーサポートメール: `your-email@officedeyasai.jp`
     - デベロッパーの連絡先情報: `your-email@officedeyasai.jp`
   - 「保存して次へ」をクリック
   - スコープ設定（デフォルトのまま）→ 「保存して次へ」
   - テストユーザー（後で追加可能）→ 「保存して次へ」
   - 概要を確認 → 「ダッシュボードに戻る」

4. **認証情報を作成**
   - 左メニュー → **APIとサービス** → **認証情報**
   - 上部の「+ 認証情報を作成」をクリック
   - 「OAuth 2.0 クライアント ID」を選択

5. **OAuth 2.0 クライアント IDの設定**
   - アプリケーションの種類: **ウェブアプリケーション**
   - 名前: `Office de Yasai Matcher Web Client`（任意）
   - **承認済みのリダイレクト URI** を追加:
     ```
     https://your-domain.vercel.app/api/oauth/callback
     http://localhost:3000/api/oauth/callback
     ```
     - `your-domain.vercel.app` は実際のVercelのドメインに置き換え
   - 「作成」をクリック

6. **クライアントIDをコピー**
   - ポップアップに表示された「クライアントID」をコピー
   - 形式: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`

### 例

```
123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

### 注意点

- クライアントシークレットは必要ありません（フロントエンドのみで使用）
- リダイレクトURIは正確に設定する必要があります
- 本番環境と開発環境で異なるURIを設定できます

---

## 4. VITE_OAUTH_PORTAL_URL（OAuthサーバーURL）

### 取得手順

既存のOAuthサーバー（Manus OAuth）を使用する場合：

1. **OAuthサーバーの管理者に確認**
   - OAuthサーバーのベースURLを確認
   - 例: `https://oauth.example.com`

2. **URL形式を確認**
   - プロトコル（`https://`）を含める
   - 末尾にスラッシュ（`/`）は不要
   - パス（`/app-auth`など）は含めない（コード内で追加）

### 例

```
https://oauth.example.com
```

### 注意点

- 既存のOAuthサーバーがない場合は、Google OAuthを直接使用することも可能
- その場合は、この環境変数は不要な場合があります（実装に依存）

---

## 5. NODE_ENV（実行環境）

### 設定値

```
production
```

### 設定方法

- **Vercelダッシュボード**: 環境変数として `production` を設定
- **自動設定**: Vercelが自動的に設定する場合もありますが、明示的に設定することを推奨

### 注意点

- ローカル開発環境では `development` を使用
- Vercelの本番環境では必ず `production` を設定

---

## 📝 まとめチェックリスト

環境変数を設定する前に、以下を確認してください：

- [ ] `DATABASE_URL`: Supabaseから取得済み、パスワードを置き換え済み
- [ ] `JWT_SECRET`: 32文字以上のランダム文字列を生成済み
- [ ] `VITE_APP_ID`: Google Cloud ConsoleでOAuth Client IDを作成済み
- [ ] `VITE_OAUTH_PORTAL_URL`: OAuthサーバーのURLを確認済み
- [ ] `NODE_ENV`: `production` に設定予定

---

## 💾 ローカル開発用の設定方法

### 一時的なメモとして使う場合

**⚠️ 絶対にGitにコミットしないでください！**

もし一時的にメモとして残したい場合は、以下の方法があります：

1. **`.env.local`ファイルを作成**（`.gitignore`に含まれています）
   ```bash
   # .env.local（Gitにコミットされません）
   DATABASE_URL=postgresql://postgres:your_password@...
   JWT_SECRET=your_secret_here
   ```

2. **別のローカル専用ファイルを作成**
   ```bash
   # .env.private（.gitignoreに追加）
   DATABASE_URL=postgresql://postgres:your_password@...
   ```

3. **パスワードマネージャーを使用**
   - 1Password、LastPass、Bitwardenなど
   - 安全に管理できます

### `.env`ファイルの例

プロジェクトルートに`.env`ファイルを作成（`.gitignore`に含まれています）：

```bash
# .env（このファイルはGitにコミットされません）
DATABASE_URL=postgresql://postgres:your_actual_password@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=your_generated_secret_here
VITE_APP_ID=your_google_oauth_client_id
VITE_OAUTH_PORTAL_URL=https://oauth-server-url.com
NODE_ENV=development
```

**重要**: `.env`ファイルは既に`.gitignore`に含まれているため、Gitにコミットされません。

---

## 🚨 トラブルシューティング

### DATABASE_URLが接続できない

- Supabaseダッシュボードで接続文字列を再確認
- パスワードが正しいか確認
- ファイアウォール設定を確認（Supabase側）

### Google OAuthが動作しない

- OAuth Client IDが正しいか確認
- リダイレクトURIが正確に設定されているか確認
- Google Cloud Consoleで「OAuth同意画面」が公開されているか確認

### 環境変数が反映されない

- Vercelで環境変数を設定後、**再デプロイ**が必要
- 環境変数が正しい環境（Production/Preview/Development）に設定されているか確認

---

**最終更新**: 2025-10-31

