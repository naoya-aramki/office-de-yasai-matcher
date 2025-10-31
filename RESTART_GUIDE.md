# 🚀 プロジェクト再構築ガイド

## 現在の問題点

1. Vercelデプロイが複雑化している
2. ビルドプロセスが複雑になっている
3. モジュール解決の問題が発生している

## 再構築の推奨アプローチ

### ステップ1: クリーンな構成から始める

#### 推奨ディレクトリ構成
```
office-de-yasai-matcher/
├── api/
│   └── server.ts              # Vercel serverless function（メインエントリーポイント）
├── server/
│   ├── _core/
│   │   ├── context.ts
│   │   ├── oauth.ts
│   │   └── ...
│   ├── routers.ts
│   └── db.ts
├── client/
│   └── src/                   # フロントエンド
├── shared/                    # 共有コード
├── drizzle/
│   └── schema.ts
├── package.json
├── vercel.json
└── tsconfig.json
```

### ステップ2: `api/server.ts`をシンプルに作成

```typescript
// api/server.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { serveStatic } from "../server/_core/vite";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth
registerOAuthRoutes(app);

// tRPC
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Static files (production only)
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
}

export default app;
```

### ステップ3: `package.json`を簡素化

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx watch server/_core/index.ts",
    "build": "vite build",
    "check": "tsc --noEmit"
  }
}
```

**ポイント**: esbuildでのバンドルは不要。Vercelが自動的にTypeScriptをトランスパイルする。

### ステップ4: `vercel.json`を最小限に

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "installCommand": "npm ci --legacy-peer-deps || npm install --legacy-peer-deps",
  "framework": null,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/server"
    },
    {
      "source": "/(.*)",
      "destination": "/api/server"
    }
  ]
}
```

### ステップ5: `.gitignore`を整理

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store

# Vercelが自動生成するファイルは除外しない
# api/server.js はビルド時に生成されるが、Vercelが認識するために含める
```

---

## 🔄 移行手順

### 1. バックアップ
```bash
cp -r office-de-yasai-matcher office-de-yasai-matcher-backup
```

### 2. クリーンアップ
```bash
cd office-de-yasai-matcher
rm -rf api/server.js
rm -rf src/api-server.ts
rm -rf .vercel-build-trigger
```

### 3. `api/server.ts`を作成
`src/api-server.ts`の内容を`api/server.ts`にコピー

### 4. `package.json`を更新
ビルドスクリプトからesbuildの部分を削除

### 5. テスト
```bash
npm run build
```

### 6. デプロイ
```bash
git add .
git commit -m "シンプルな構成にリファクタリング"
git push origin main
```

---

## ✅ チェックリスト

- [ ] `api/server.ts`が存在する
- [ ] `src/api-server.ts`が削除されている
- [ ] `package.json`の`build`スクリプトが`vite build`のみ
- [ ] `vercel.json`がシンプルな構成
- [ ] ローカルで`npm run build`が成功する
- [ ] Vercelでデプロイが成功する
- [ ] `/api/trpc/cases.match`が動作する

---

## 🆘 もし問題が発生したら

### 問題1: モジュールが見つからない
**解決策**: `tsconfig.json`の`paths`設定を確認

### 問題2: ビルドが失敗する
**解決策**: `package.json`の依存関係を確認

### 問題3: Vercelで404エラー
**解決策**: Runtime Logsでエラーを確認

---

## 📞 サポート

問題が解決しない場合は、以下の情報を確認してください：

1. Vercelのビルドログ
2. Runtime Logs
3. `package.json`の内容
4. `vercel.json`の内容

---

**作成日**: 2025-10-31

