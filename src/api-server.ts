// Vercel serverless function entry point
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { serveStatic } from "../server/_core/static";

// Vercel環境の検出
const isVercel = !!process.env.VERCEL;
const isProduction = process.env.NODE_ENV === "production";

// デバッグ情報をログ出力（本番環境では最小限）
if (!isProduction || process.env.VERCEL_ENV === "development") {
  console.log("[Server] Starting server...", {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: isVercel,
    DATABASE_URL: process.env.DATABASE_URL ? "設定済み" : "未設定",
    DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
  });
}

const app = express();

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback under /api/oauth/callback
registerOAuthRoutes(app);

// tRPC API - must be before static file serving
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path, type, ctx }) => {
      console.error(`[tRPC Error] ${type} ${path}:`, {
        message: error.message,
        code: error.code,
        cause: error.cause,
        stack: error.stack,
      });
    },
    responseMeta: () => {
      // 常にJSONを返すようにする
      return {
        headers: {
          'Content-Type': 'application/json',
        },
      };
    },
  })
);

// 404 handler for API routes (before static files)
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Serve static files in production (must be last)
// Vercel環境では静的ファイルは自動的に配信されるが、
// SPAルーティングのためにフォールバックを提供
if (isProduction) {
  serveStatic(app);
}

// Error handling middleware (must be last)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const isDevelopment = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "development";
  
  console.error("[Server Error]", {
    message: err.message,
    url: req.url,
    method: req.method,
    isVercel: isVercel,
    ...(isDevelopment && { stack: err.stack }),
  });
  
  // Always return JSON, never HTML
  if (!res.headersSent) {
    // データベース接続エラーの場合は詳細なメッセージを返す
    const statusCode = err.statusCode || 500;
    const errorResponse: any = {
      error: statusCode >= 500 ? "Internal server error" : "Request error",
      message: err.message,
    };
    
    // 開発環境でのみスタックトレースを返す
    if (isDevelopment) {
      errorResponse.stack = err.stack;
    }
    
    res.status(statusCode).json(errorResponse);
  }
});

// Export the Express app as a Vercel serverless function
export default app;

