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

`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
DATABASE_URL=mysql://user:password@localhost:3306/database_name
NODE_ENV=development
```

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

