// Vercel serverless function entry point
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { serveStatic } from "../server/_core/vite";

// デバッグ情報をログ出力
console.log("[Server] Starting server...", {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? "設定済み" : "未設定",
  DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
});

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
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
}

// Error handling middleware (must be last)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Server Error]", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  
  // Always return JSON, never HTML
  if (!res.headersSent) {
    res.status(500).json({ 
      error: "Internal server error", 
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  }
});

// Export the Express app as a Vercel serverless function
export default app;

