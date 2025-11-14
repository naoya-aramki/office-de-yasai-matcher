# 🔧 500エラーのトラブルシューティング

## 問題
ログインは成功するが、OAuthコールバックで500エラーが発生する

## 考えられる原因と解決方法

### 1. Google OAuth Client Secretが設定されていない

**症状**: サーバーサイドでトークン交換を行う場合、Client Secretが必要です

**解決方法**:
1. Google Cloud Console → APIとサービス → 認証情報
2. OAuth 2.0 クライアントIDをクリック
3. **クライアントシークレット**をコピー
4. Vercelの環境変数に追加：
   - **Name**: `GOOGLE_CLIENT_SECRET`
   - **Value**: コピーしたシークレット
   - **Environment**: Production, Preview, Development すべてにチェック

### 2. データベース接続エラー

**症状**: `DATABASE_URL`が正しく設定されていない、または接続できない

**解決方法**:
1. Vercelの環境変数で`DATABASE_URL`を確認
2. Supabaseダッシュボードで接続文字列を再確認
3. パスワードが正しいか確認

### 3. 環境変数が設定されていない

**症状**: `VITE_APP_ID`や`JWT_SECRET`が設定されていない

**解決方法**:
1. Vercelの環境変数を確認：
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `VITE_APP_ID`
   - `GOOGLE_CLIENT_SECRET`（推奨）

### 4. Vercelのログを確認

**手順**:
1. Vercelダッシュボード → プロジェクト
2. **Deployments** → 最新のデプロイメントをクリック
3. **Functions** → `/api/oauth/callback` をクリック
4. **Logs** タブでエラーログを確認

## デバッグ手順

1. **エラーログを確認**
   - Vercelのログで詳細なエラーメッセージを確認
   - エラーメッセージを共有してください

2. **環境変数を確認**
   ```bash
   # Vercelダッシュボードで確認
   - DATABASE_URL
   - JWT_SECRET
   - VITE_APP_ID
   - GOOGLE_CLIENT_SECRET（推奨）
   ```

3. **再デプロイ**
   - 環境変数を設定/変更した後、再デプロイが必要

## 次のステップ

エラーログの内容を共有していただければ、より具体的な解決方法を提案できます。

