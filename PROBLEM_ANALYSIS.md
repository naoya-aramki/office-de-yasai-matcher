# 問題分析と解決策ドキュメント

## 📋 現在の状況

### 発生している問題
1. **Vercelデプロイエラー**: `api/server.js`と`api/server.ts`の競合
2. **モジュール解決エラー**: `server/_core/oauth`が見つからない
3. **404エラー**: `/api/trpc/cases.match`が404を返す
4. **ビルドの複雑化**: esbuildでのバンドルが複雑になっている

### 根本原因

#### 1. Vercelのserverless functionの仕組みとの不整合
- Vercelは`api`ディレクトリ内のファイルを自動的にserverless functionとして認識
- TypeScriptファイル（`.ts`）は自動トランスパイルされる
- JavaScriptファイル（`.js`）も認識されるが、ビルド時に生成されたファイルは認識されない可能性がある
- **問題**: `api/server.ts`を`src/api-server.ts`に移動したが、Vercelが`api/server.js`を正しく認識していない

#### 2. 依存関係のバンドル問題
- `api/server.ts`が`../server/_core/oauth`などの相対パスでインポート
- Vercelの実行環境では、これらのファイルが存在しない
- esbuildでバンドルする必要があるが、設定が複雑化

#### 3. ビルドプロセスの複雑化
- `vite build`でフロントエンドをビルド
- `esbuild`で`api/server.ts`をバンドル
- 複数のビルドステップが絡み合っている

---

## 🎯 推奨解決策

### オプション1: Vercelの標準的な構成に合わせる（推奨）

#### アーキテクチャ
```
api/
  server.ts          # Vercelが自動トランスパイル
server/
  _core/            # 共通モジュール
  routers.ts
  db.ts
```

#### 変更点
1. **`api/server.ts`を`api`ディレクトリに戻す**
   - Vercelが自動的にトランスパイルしてくれる
   - 相対パスで`../server`をインポート可能

2. **esbuildでのバンドルを削除**
   - Vercelが自動的にTypeScriptをトランスパイル
   - `package.json`の`build`スクリプトを簡素化

3. **依存関係の解決**
   - `server`ディレクトリ全体をリポジトリに含める
   - Vercelが実行時に必要なファイルを読み込む

#### メリット
- ✅ Vercelの標準的な動作に合わせる
- ✅ ビルドプロセスがシンプルになる
- ✅ デバッグが容易になる

#### デメリット
- ⚠️ コールドスタート時にすべてのファイルを読み込むため、初期レスポンスが遅い可能性

---

### オプション2: Next.jsに移行（長期的推奨）

#### アーキテクチャ
```
app/
  api/
    trpc/
      [trpc]/
        route.ts      # tRPCエンドポイント
  page.tsx            # フロントエンド
server/
  routers.ts
  db.ts
```

#### メリット
- ✅ Next.jsはVercelと完全に統合されている
- ✅ API Routesが標準サポート
- ✅ ビルドプロセスが自動化
- ✅ パフォーマンス最適化が組み込まれている

#### デメリット
- ⚠️ 大規模なリファクタリングが必要
- ⚠️ 学習コストがある

---

### オプション3: 現在の構成を修正（最小限の変更）

#### 変更点
1. **`api/server.js`をリポジトリに含める**（現在実装済み）
2. **`src/api-server.ts`を削除**
3. **`api/server.ts`を直接作成**
   - Vercelが自動トランスパイル
   - 相対パスで`../server`をインポート

#### メリット
- ✅ 最小限の変更で済む
- ✅ 既存のコードを活用できる

#### デメリット
- ⚠️ Vercelの自動トランスパイルに依存するため、エラーが発生しやすい

---

## 🚀 推奨アクション

### 即座に実行すべきこと

1. **`api/server.ts`を直接作成**
   ```bash
   # src/api-server.tsの内容をapi/server.tsにコピー
   cp src/api-server.ts api/server.ts
   ```

2. **不要なファイルを削除**
   ```bash
   rm src/api-server.ts
   rm api/server.js  # ビルド時に生成されるので不要
   ```

3. **ビルドスクリプトを簡素化**
   ```json
   {
     "build": "npx vite build"
   }
   ```

4. **`.gitignore`を更新**
   ```
   api/server.js  # ビルド時に生成されるファイル
   ```

---

## 📝 次のステップ

### 短期（今すぐ）
1. ✅ `api/server.ts`を直接作成
2. ✅ ビルドスクリプトを簡素化
3. ✅ Vercelでテスト

### 中期（1-2週間）
1. パフォーマンス測定
2. エラーハンドリングの改善
3. ログの強化

### 長期（1-2ヶ月）
1. Next.jsへの移行を検討
2. モノレポ構成の検討
3. CI/CDパイプラインの構築

---

## 🔍 トラブルシューティング

### 問題: `/api/server`が404を返す
**原因**: Vercelが`api/server.ts`を認識していない
**解決策**: 
- `api/server.ts`が存在するか確認
- Vercelのデプロイログでエラーを確認
- `vercel.json`の設定を確認

### 問題: モジュールが見つからない
**原因**: 相対パスの解決が失敗している
**解決策**:
- `tsconfig.json`の`paths`設定を確認
- Vercelの実行環境でファイルが存在するか確認

### 問題: ビルドが失敗する
**原因**: 依存関係の問題
**解決策**:
- `package.json`の依存関係を確認
- `.npmrc`で`legacy-peer-deps`を設定

---

## 📚 参考資料

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel TypeScript Support](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js#typescript)
- [tRPC with Vercel](https://trpc.io/docs/v10/nextjs)

---

**作成日**: 2025-10-31
**最終更新**: 2025-10-31

