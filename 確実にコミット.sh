#!/bin/bash

# 確実にコミットとプッシュを行うスクリプト

echo "=========================================="
echo "🔍 Gitの状態を確認します"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# 現在の状態を表示
echo "📋 変更されたファイル:"
git status --short
echo ""

# 変更があるか確認
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ コミットする変更がありません"
    exit 0
fi

# コミットメッセージを入力
if [ -z "$1" ]; then
    echo "📝 コミットメッセージを入力してください:"
    read -r commit_message
else
    commit_message="$1"
fi

if [ -z "$commit_message" ]; then
    echo "❌ コミットメッセージが空です"
    exit 1
fi

echo ""
echo "=========================================="
echo "📦 変更をステージングに追加します"
echo "=========================================="
git add .

echo ""
echo "=========================================="
echo "💾 コミットします"
echo "=========================================="
echo "メッセージ: $commit_message"
git commit -m "$commit_message"

if [ $? -ne 0 ]; then
    echo "❌ コミットに失敗しました"
    exit 1
fi

echo ""
echo "=========================================="
echo "🚀 リモートにプッシュします"
echo "=========================================="
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ プッシュに失敗しました"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ 完了しました！"
echo "=========================================="
echo ""
echo "最新のコミット:"
git log --oneline -1
echo ""
echo "リモートとの同期:"
git status -sb

