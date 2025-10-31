#!/bin/bash

echo "=========================================="
echo "🚀 CSVインポートを開始します"
echo "=========================================="
echo ""

cd /Users/a2025-057/Downloads/office-de-yasai-matcher

# 依存関係がインストールされているか確認
if [ ! -d "node_modules" ]; then
    echo "📦 依存関係をインストールしています..."
    npm install --legacy-peer-deps
    echo ""
fi

export DATABASE_URL="postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres"

echo "✅ 接続文字列を設定しました"
echo ""

echo "📤 CSVインポートを実行中..."
echo ""

npx --yes tsx import-csv-to-supabase.ts

echo ""
echo "=========================================="
echo "✅ 完了しました！"
echo "=========================================="

