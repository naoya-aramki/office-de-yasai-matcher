/**
 * Environment variable validation and access
 * Vercel + Supabase環境向けの環境変数管理
 * 
 * 既存のプロパティ名を維持しつつ、Vercel + Supabase向けの最適化を追加
 */

// オプション環境変数の取得
function getEnv(key: string, defaultValue: string = ""): string {
  return process.env[key] ?? defaultValue;
}

// 環境変数の設定を検証
export const ENV = {
  // 既存のプロパティ（後方互換性のため維持）
  appId: getEnv("VITE_APP_ID"),
  cookieSecret: getEnv("JWT_SECRET"),
  databaseUrl: getEnv("DATABASE_URL"),
  oAuthServerUrl: getEnv("OAUTH_SERVER_URL"),
  ownerOpenId: getEnv("OWNER_OPEN_ID"),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: getEnv("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: getEnv("BUILT_IN_FORGE_API_KEY"),
  
  // Vercel + Supabase向けの追加プロパティ
  DATABASE_URL: getEnv("DATABASE_URL"),
  JWT_SECRET: getEnv("JWT_SECRET"),
  NODE_ENV: (getEnv("NODE_ENV", "production") || "production") as "development" | "production",
  VERCEL: !!process.env.VERCEL,
  VERCEL_ENV: getEnv("VERCEL_ENV", "production"),
} as const;

// 起動時に環境変数を検証（警告のみ、エラーはスローしない）
if (process.env.NODE_ENV !== "test") {
  try {
    // DATABASE_URLの形式を簡易チェック
    if (ENV.databaseUrl && !ENV.databaseUrl.startsWith("postgresql://")) {
      console.warn(
        "[ENV] DATABASE_URL does not start with 'postgresql://'. " +
        "Make sure you're using a PostgreSQL connection string (Supabase)."
      );
    }
    
    // Vercel環境での確認
    if (ENV.VERCEL) {
      console.log("[ENV] Running in Vercel environment");
      if (!ENV.databaseUrl) {
        console.error(
          "[ENV] ⚠️  DATABASE_URL is not set in Vercel environment variables!"
        );
      }
      if (!ENV.cookieSecret) {
        console.error(
          "[ENV] ⚠️  JWT_SECRET is not set in Vercel environment variables!"
        );
      }
    }
  } catch (error) {
    console.error("[ENV] Environment validation error:", error);
    // エラーをスローしない（起動時に警告のみ）
  }
}
