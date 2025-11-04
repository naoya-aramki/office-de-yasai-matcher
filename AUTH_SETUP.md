# 🔐 認証設定ガイド

このアプリケーションは`@officedeyasai.jp`のメールアドレスでのみアクセス可能です。

## 📋 設定手順

### 1. Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを作成または選択
3. **APIとサービス** → **認証情報**に移動
4. **認証情報を作成** → **OAuth 2.0 クライアント ID**を選択
5. アプリケーションの種類を**ウェブアプリケーション**に設定
6. 以下の情報を設定：
   - **名前**: Office de Yasai Matcher（任意）
   - **承認済みのリダイレクト URI**: 
     - `https://your-domain.vercel.app/api/oauth/callback`
     - `http://localhost:3000/api/oauth/callback`（ローカル開発用）
7. **作成**をクリック
8. **クライアントID**をコピー（これが`VITE_APP_ID`になります）

### 2. OAuthサーバーの設定

既存のOAuthサーバー（Manus OAuth）を使用する場合：

- `VITE_OAUTH_PORTAL_URL`: OAuthサーバーのURL
  - 例: `https://oauth.example.com`

### 3. Vercel環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

#### 必須環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `VITE_APP_ID` | Google OAuth App ID | `123456789-abcdefghijklmnop.apps.googleusercontent.com` |
| `VITE_OAUTH_PORTAL_URL` | OAuthサーバーURL | `https://oauth.example.com` |
| `JWT_SECRET` | Cookie署名用シークレット | ランダムな文字列（32文字以上推奨） |

#### 既存の環境変数

以下の環境変数も設定されていることを確認：

- `DATABASE_URL`: SupabaseのPostgreSQL接続URL
- `NODE_ENV`: `production`

### 4. ローカル開発環境の設定

`.env`ファイルに以下を追加：

```bash
VITE_APP_ID=your-google-oauth-client-id
VITE_OAUTH_PORTAL_URL=https://oauth-server-url.com
JWT_SECRET=your-random-secret-key
DATABASE_URL=postgresql://...
NODE_ENV=development
```

## 🔄 認証フロー

1. **ユーザーがページにアクセス**
   - 未認証の場合、自動的にログイン画面へリダイレクト

2. **Google OAuth認証**
   - Googleの認証画面が表示
   - 既にログイン済みの場合は自動的に認証

3. **メールアドレスのドメインチェック**
   - `@officedeyasai.jp`のメールアドレスのみ許可
   - その他のメールアドレスはアクセス拒否

4. **セッションCookieの発行**
   - 認証成功後、セッションCookieを発行（1年間有効）
   - 以降のアクセスでは自動的に認証済みとして扱う

## 🚨 トラブルシューティング

### 認証エラーが発生する場合

1. **環境変数の確認**
   - `VITE_APP_ID`が正しく設定されているか
   - `VITE_OAUTH_PORTAL_URL`が正しく設定されているか
   - Vercelで環境変数が正しく反映されているか（再デプロイが必要な場合あり）

2. **リダイレクトURIの確認**
   - Google Cloud Consoleで設定したリダイレクトURIが実際のURLと一致しているか
   - プロトコル（http/https）が正しいか

3. **ログの確認**
   - VercelのRuntime Logsでエラーを確認
   - ブラウザのコンソールでエラーを確認

### アクセス拒否される場合

- メールアドレスが`@officedeyasai.jp`で終わっているか確認
- Googleアカウントのメールアドレスが正しいか確認

### ログイン画面が表示されない場合

- `VITE_OAUTH_PORTAL_URL`が設定されているか確認
- `getLoginUrl()`関数が正しく動作しているか確認（ブラウザのコンソールで確認）

## 📝 実装の詳細

### バックエンド

- **OAuthコールバック** (`server/_core/oauth.ts`)
  - Google OAuthのコールバックを処理
  - メールアドレスのドメインチェックを実行
  - セッションCookieを発行

- **認証ミドルウェア** (`server/_core/sdk.ts`)
  - リクエストごとに認証状態を確認
  - メールアドレスのドメインチェックを実行

- **tRPCルーター** (`server/routers.ts`)
  - `protectedProcedure`を使用して認証が必要なエンドポイントを保護

### フロントエンド

- **認証フック** (`client/src/_core/hooks/useAuth.ts`)
  - 認証状態を管理
  - 未認証の場合は自動的にログイン画面へリダイレクト

- **Homeページ** (`client/src/pages/Home.tsx`)
  - 認証チェックを実装
  - 未認証の場合はログイン画面へリダイレクト
  - 認証済みの場合はユーザー情報を表示

## 🔒 セキュリティ

- **メールアドレスのドメインチェック**: サーバー側とクライアント側の両方で実装
- **セッションCookie**: 署名と暗号化により保護
- **HTTPS通信**: Vercelが自動的に提供
- **認証トークン**: JWTを使用して安全に管理

---

**最終更新**: 2025-10-31

