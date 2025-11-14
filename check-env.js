#!/usr/bin/env node
/**
 * 環境変数の確認スクリプト
 * ローカル開発環境で必要な環境変数が設定されているか確認します
 */

// .envファイルを読み込む
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .envファイルを読み込む
config({ path: resolve(__dirname, '.env') });

console.log('🔍 環境変数の確認を開始します...\n');

const requiredEnvVars = {
  'DATABASE_URL': {
    description: 'Supabase PostgreSQL接続URL',
    pattern: /^postgresql:\/\//,
    example: 'postgresql://postgres:password@host:5432/postgres'
  },
  'JWT_SECRET': {
    description: 'Cookie署名用シークレット',
    minLength: 32,
    example: 'your-random-secret-key-at-least-32-characters'
  },
  'VITE_APP_ID': {
    description: 'Google OAuth App ID (Client ID)',
    pattern: /\.apps\.googleusercontent\.com$/,
    example: '123456789-abcdefghijklmnop.apps.googleusercontent.com'
  }
};

const optionalEnvVars_check = {
  'GOOGLE_CLIENT_SECRET': {
    description: 'Google OAuth Client Secret (オプション: サーバーサイドアプリの場合のみ必要)',
    example: 'GOCSPX-...'
  }
};

const optionalEnvVars = {
  'NODE_ENV': {
    description: '実行環境',
    defaultValue: 'development'
  },
  'PORT': {
    description: 'サーバーポート',
    defaultValue: '3000'
  }
};

let hasErrors = false;
let hasWarnings = false;

// 必須環境変数の確認
console.log('📋 必須環境変数:');
console.log('─'.repeat(60));

for (const [key, config] of Object.entries(requiredEnvVars)) {
  const value = process.env[key];
  
  if (!value) {
    console.log(`❌ ${key}: 設定されていません`);
    console.log(`   ${config.description}`);
    console.log(`   例: ${config.example}\n`);
    hasErrors = true;
    continue;
  }
  
  // パターンチェック
  if (config.pattern && !config.pattern.test(value)) {
    console.log(`⚠️  ${key}: 形式が正しくない可能性があります`);
    console.log(`   現在の値: ${value.substring(0, 50)}...`);
    console.log(`   期待される形式: ${config.example}\n`);
    hasWarnings = true;
    continue;
  }
  
  // 最小長チェック
  if (config.minLength && value.length < config.minLength) {
    console.log(`⚠️  ${key}: 長さが不足しています（${config.minLength}文字以上推奨）`);
    console.log(`   現在の長さ: ${value.length}文字\n`);
    hasWarnings = true;
    continue;
  }
  
  // 値の一部をマスクして表示（セキュリティのため）
  const maskedValue = key === 'DATABASE_URL' 
    ? value.replace(/:([^:@]+)@/, ':****@')  // パスワードをマスク
    : value.length > 50 
      ? value.substring(0, 50) + '...'
      : value;
  
  console.log(`✅ ${key}: 設定済み`);
  console.log(`   値: ${maskedValue}\n`);
}

// オプション環境変数の確認
console.log('\n📋 オプション環境変数:');
console.log('─'.repeat(60));

for (const [key, config] of Object.entries(optionalEnvVars)) {
  const value = process.env[key] || config.defaultValue;
  console.log(`ℹ️  ${key}: ${value} ${!process.env[key] ? '(デフォルト値)' : ''}`);
}

// Google OAuth Client Secret (オプション)
if (optionalEnvVars_check.GOOGLE_CLIENT_SECRET) {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (secret) {
    console.log(`ℹ️  GOOGLE_CLIENT_SECRET: 設定済み`);
  } else {
    console.log(`ℹ️  GOOGLE_CLIENT_SECRET: 未設定（オプション）`);
  }
}

// 結果サマリー
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ エラー: 必須環境変数が設定されていません');
  console.log('\n💡 解決方法:');
  console.log('   1. .envファイルを作成して環境変数を設定してください');
    console.log('   2. または、環境変数を直接エクスポートしてください:');
    console.log('      export DATABASE_URL="..."');
    console.log('      export JWT_SECRET="..."');
    console.log('      export VITE_APP_ID="..."');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  警告: 一部の環境変数の形式に問題がある可能性があります');
  console.log('   上記の警告を確認してください');
  process.exit(0);
} else {
  console.log('✅ すべての必須環境変数が正しく設定されています！');
  console.log('\n🚀 次のステップ:');
  console.log('   1. npm run dev でサーバーを起動');
  console.log('   2. ブラウザで http://localhost:3000 にアクセス');
  console.log('   3. Googleログインをテスト');
  process.exit(0);
}

