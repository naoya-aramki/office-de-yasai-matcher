# Office de Yasai Matcher

「オフィスでやさい」の導入事例マッチングシステム

## 概要

このアプリケーションは、企業の課題や要望に基づいて、最適な「オフィスでやさい」の導入事例を提案するマッチングシステムです。

## 技術スタック

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Express, tRPC
- **Database**: MySQL with Drizzle ORM
- **UI**: Radix UI, Tailwind CSS
- **State Management**: TanStack Query

## セットアップ

### 前提条件

- Node.js 18以上
- pnpm 10以上
- MySQL

### インストール

```bash
# 依存関係のインストール
pnpm install

# データベースのセットアップ
pnpm db:push
```

### 環境変数

`.env.example`をコピーして`.env`ファイルを作成し、以下の環境変数を設定してください：

```bash
cp .env.example .env
```

#### 必須の環境変数

- `DATABASE_URL`: MySQLデータベースの接続URL
  - 例: `mysql://user:password@localhost:3306/office_de_yasai_matcher`
- `JWT_SECRET`: Cookie署名用のシークレットキー（ランダムな文字列を生成してください）
- `NODE_ENV`: 実行環境（`development` または `production`）

#### オプションの環境変数

- `VITE_APP_ID`: アプリケーションID
- `OAUTH_SERVER_URL`: OAuth認証サーバーのURL
- `OWNER_OPEN_ID`: オーナーのOpenID
- `BUILT_IN_FORGE_API_URL`: Forge API URL（AI機能用）
- `BUILT_IN_FORGE_API_KEY`: Forge APIキー（AI機能用）

### 開発サーバーの起動

```bash
pnpm dev
```

## スクリプト

- `pnpm dev` - 開発サーバーを起動
- `pnpm build` - プロダクションビルドを作成
- `pnpm start` - プロダクションサーバーを起動
- `pnpm check` - TypeScriptの型チェック
- `pnpm format` - コードフォーマット
- `pnpm test` - テストを実行
- `pnpm db:push` - データベースマイグレーション

## セキュリティ機能

このアプリケーションは、**@officedeyasai.jp のメールアドレスを持つユーザーのみがアクセス可能**です。

- OAuth認証時にメールアドレスのドメインをチェック
- すべてのAPIリクエストでメールアドレスを検証
- 許可されていないメールアドレスからのアクセスは自動的に拒否

## Vercelへのデプロイ

### 1. Vercelアカウントの準備

1. [Vercel](https://vercel.com)にアクセスしてアカウントを作成
2. GitHubアカウントと連携

### 2. プロジェクトのインポート

1. Vercelダッシュボードで「New Project」をクリック
2. GitHubリポジトリ `naoya-aramki/office-de-yasai-matcher` を選択
3. プロジェクト設定を確認：
   - **Framework Preset**: Other
   - **Root Directory**: `./` (そのまま)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `pnpm install`

### 3. 環境変数の設定

Vercelのプロジェクト設定で、以下の環境変数を追加：

**必須:**
- `DATABASE_URL` - MySQLデータベースの接続URL（例: `mysql://user:password@host:3306/database`）
- `JWT_SECRET` - Cookie署名用のシークレットキー（ランダムな文字列）
- `NODE_ENV` - `production`

**オプション:**
- `VITE_APP_ID` - アプリケーションID
- `OAUTH_SERVER_URL` - OAuth認証サーバーのURL
- `OWNER_OPEN_ID` - オーナーのOpenID
- `BUILT_IN_FORGE_API_URL` - Forge API URL
- `BUILT_IN_FORGE_API_KEY` - Forge APIキー

### 4. データベースのセットアップ

Vercelではデータベースマイグレーションを自動実行できないため、以下のいずれかの方法で実行：

**方法1: ローカルから実行**
```bash
DATABASE_URL="your_production_database_url" pnpm db:push
```

**方法2: Vercel CLIを使用**
```bash
vercel env pull .env.production
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) pnpm db:push
```

### 5. デプロイ

1. 「Deploy」ボタンをクリック
2. ビルドが完了するまで待機
3. デプロイされたURLにアクセスして動作確認

### 6. カスタムドメイン（オプション）

Vercelのプロジェクト設定からカスタムドメインを設定できます。

## ライセンス

MIT

