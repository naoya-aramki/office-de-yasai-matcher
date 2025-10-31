#!/bin/bash

set -e  # エラーが発生したら停止

echo "🚀 CSVインポートを開始します..."
echo ""

# プロジェクトディレクトリに移動
cd "$(dirname "$0")"
echo "📁 作業ディレクトリ: $(pwd)"
echo ""

# 接続文字列を設定
export DATABASE_URL="postgresql://postgres:ody831match@db.krbkafougmvtkitsqxvt.supabase.co:5432/postgres"
echo "✅ DATABASE_URLを設定しました"
echo ""

# ファイルの存在確認
if [ ! -f "import-csv-to-supabase.ts" ]; then
    echo "❌ エラー: import-csv-to-supabase.ts が見つかりません"
    exit 1
fi

if [ ! -f "cases_20251031_071929.csv" ]; then
    echo "❌ エラー: cases_20251031_071929.csv が見つかりません"
    exit 1
fi

echo "✅ 必要なファイルが見つかりました"
echo ""

# Node.jsの確認
if ! command -v node &> /dev/null; then
    echo "❌ エラー: Node.jsがインストールされていません"
    echo "   https://nodejs.org/ からインストールしてください"
    exit 1
fi

echo "✅ Node.jsが見つかりました: $(node --version)"
echo ""

# npxで実行
echo "📤 CSVインポートを実行します..."
echo "=========================================="
echo ""

npx --yes tsx import-csv-to-supabase.ts

echo ""
echo "=========================================="
echo "✅ 完了しました！"

