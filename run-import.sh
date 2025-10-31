#!/bin/bash

# CSVインポート用の簡単なスクリプト

echo "🚀 CSVインポートスクリプト"
echo "================================"
echo ""

# プロジェクトディレクトリに移動
cd "$(dirname "$0")"

# 接続文字列を設定
export DATABASE_URL="postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres"

echo "✅ DATABASE_URLを設定しました"
echo ""

# pnpmが使えるか確認
if command -v pnpm &> /dev/null; then
    echo "✅ pnpmが見つかりました"
    echo "📤 CSVインポートを開始します..."
    echo ""
    pnpm import:csv
elif command -v npm &> /dev/null; then
    echo "⚠️  pnpmが見つかりません。npmを使用します"
    echo "📤 CSVインポートを開始します..."
    echo ""
    npm run import:csv
elif command -v npx &> /dev/null; then
    echo "⚠️  pnpm/npmが見つかりません。npxを使用します"
    echo "📤 CSVインポートを開始します..."
    echo ""
    npx tsx import-csv-to-supabase.ts
else
    echo "❌ エラー: pnpm、npm、またはnpxが見つかりません"
    echo "Node.jsをインストールしてください: https://nodejs.org/"
    exit 1
fi

