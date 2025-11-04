# 🚀 Vercel + Supabase 最適化ガイド

このドキュメントでは、Vercel + Supabase環境向けに最適化されたコードの変更点と設定方法を説明します。

## 📋 最適化内容

### 1. Vercel設定の最適化 (`vercel.json`)

```json
{
  "functions": {
    "api/server.js": {
      "maxDuration": 30,  // 最大実行時間30秒
      "memory": 1024      // メモリ1GB
    }
  },
  "rewrites": [
    {
      "source": "/api/trpc/(.*)",
      "destination": "/api/server"
    },
    {
      "source": "/api/oauth/(.*)",
      "destination": "/api/server"
    },
    {
      "source": "/(.*)",
      "destination": "/api/server"
    }
  ]
}
```

**変更点**:
- Serverless Functionのリソース制限を明示的に設定
- APIルートのルーティングを最適化

### 2. Supabase接続の最適化 (`server/db.ts`)

```typescript
_sql = postgres(process.env.DATABASE_URL, {
  max: 1,                    // Serverless functionごとに1接続
  idle_timeout: 5,           // アイドルタイムアウト5秒
  connect_timeout: 10,       // 接続タイムアウト10秒
  prepare: false,            // プリペアドステートメント無効化
  ssl: 'require',            // SSL必須（Supabase要件）
});
```

**最適化の理由**:
- **`max: 1`**: VercelのServerless Functionsは各リクエストごとにインスタンスが起動するため、接続プールは不要
- **`idle_timeout: 5`**: 接続を素早く閉じてSupabaseの接続制限を守る
- **`prepare: false`**: Supabaseでプリペアドステートメントの互換性問題を回避
- **`ssl: 'require'`**: SupabaseはSSL接続が必須

### 3. エラーハンドリングの改善

#### データベース接続エラー
- Supabase特有のエラーコードを検出
- ユーザーフレンドリーなエラーメッセージを提供
- 開発環境でのみスタックトレースを表示

#### APIエラー
- 常にJSON形式でエラーレスポンスを返す
- 環境に応じた詳細レベルの調整

### 4. 静的ファイル配信の最適化 (`server/_core/vite.ts`)

```typescript
// Vercel環境では、静的ファイルはVercelが自動的に配信
// Serverless FunctionはSPAルーティング用のフォールバックのみ提供
```

**変更点**:
- Vercel環境では静的ファイルの配信をVercelに委譲
- Serverless FunctionはSPAルーティング用のフォールバックのみ担当

### 5. ビルドプロセスの最適化 (`package.json`)

```json
{
  "build": "npx vite build && npx esbuild src/api-server.ts --platform=node --packages=external --bundle --format=esm --outfile=api/server.js --resolve-extensions=.ts,.js --loader:.ts=ts --target=node20 --minify=false --sourcemap"
}
```

**追加オプション**:
- `--target=node20`: Node.js 20向けに最適化
- `--sourcemap`: デバッグ用のソースマップを生成

## 🔧 環境変数の設定

### Vercel環境変数

以下の環境変数をVercelのダッシュボードで設定してください：

#### 必須環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | SupabaseのPostgreSQL接続URL | `postgresql://postgres:password@host:5432/postgres` |
| `JWT_SECRET` | Cookie署名用のシークレットキー | ランダムな文字列（32文字以上推奨） |
| `NODE_ENV` | 実行環境 | `production` |

#### オプション環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `VERCEL_ENV` | Vercel環境（自動設定） | `production` |
| `VITE_APP_ID` | OAuth App ID（現在未使用） | - |
| `OAUTH_SERVER_URL` | OAuthサーバーURL（現在未使用） | - |
| `OWNER_OPEN_ID` | 管理者のOpenID（現在未使用） | - |

### Supabase接続URLの取得方法

1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. **Settings** → **Database** に移動
4. **Connection string** セクションで **URI** をコピー
5. パスワードを適切な値に置き換える

例：
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

## 🚨 トラブルシューティング

### データベース接続エラー

#### `ECONNREFUSED`
- **原因**: データベースサーバーに接続できない
- **解決策**: `DATABASE_URL`のホスト名とポートを確認

#### `ETIMEDOUT`
- **原因**: 接続がタイムアウト
- **解決策**: ネットワーク接続を確認、Supabaseのファイアウォール設定を確認

#### SSL関連エラー
- **原因**: SSL接続に失敗
- **解決策**: `DATABASE_URL`に`?sslmode=require`を追加（通常は自動で設定される）

#### 認証エラー
- **原因**: ユーザー名またはパスワードが間違っている
- **解決策**: `DATABASE_URL`の認証情報を確認

### Vercelデプロイエラー

#### `Cannot find module`
- **原因**: 依存関係が`dependencies`に含まれていない
- **解決策**: 必要なパッケージを`devDependencies`から`dependencies`に移動

#### `Build timeout`
- **原因**: ビルド時間が長すぎる
- **解決策**: `.vercelignore`で不要なファイルを除外

#### `Function timeout`
- **原因**: Serverless Functionの実行時間が長すぎる
- **解決策**: `vercel.json`の`maxDuration`を調整（最大30秒）

## 📊 パフォーマンス最適化

### 接続プール設定

VercelのServerless Functionsでは、各リクエストごとに新しいインスタンスが起動するため、接続プールは不要です。代わりに：

- 各関数インスタンスごとに1接続のみ使用
- リクエスト完了後、接続を素早く閉じる（`idle_timeout: 5`）

### キャッシュ戦略

- Supabaseの接続は自動的にプールされる（接続文字列が同じ場合）
- 静的ファイルはVercelのCDNで自動キャッシュされる

## 🔍 デバッグ

### ログの確認

1. **Vercelダッシュボード** → **Deployments** → **Runtime Logs**
2. ログには以下のプレフィックスが付きます：
   - `[Server]`: サーバー起動情報
   - `[Database]`: データベース接続情報
   - `[Cases]`: マッチング処理情報
   - `[tRPC Error]`: tRPCエラー情報

### ローカルでの確認

```bash
# 環境変数を設定
export DATABASE_URL="postgresql://..."
export JWT_SECRET="your-secret-key"
export NODE_ENV="production"

# ビルド
npm run build

# ローカルで実行（Vercel環境をシミュレート）
vercel dev
```

## 📝 チェックリスト

デプロイ前に以下を確認してください：

- [ ] `DATABASE_URL`が正しく設定されている
- [ ] `JWT_SECRET`が設定されている
- [ ] `NODE_ENV=production`が設定されている
- [ ] ビルドが成功する（`npm run build`）
- [ ] ローカルで動作確認できる（`vercel dev`）
- [ ] VercelのRuntime Logsでエラーがない

## 🎯 次のステップ

1. **監視の設定**: VercelのAnalyticsでパフォーマンスを監視
2. **エラー通知**: Sentryなどのエラー監視ツールを統合
3. **パフォーマンステスト**: 負荷テストを実施して最適化

---

**最終更新**: 2025-10-31

