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

## ライセンス

MIT

