import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Vercel環境では、静的ファイルはVercelが自動的に配信する
  // ただし、SPAルーティングのためにフォールバックを提供
  const isVercel = !!process.env.VERCEL;
  
  // 静的ファイルのパスを決定
  const distPath = isVercel
    ? path.resolve(process.cwd(), "dist", "public")
    : path.resolve(import.meta.dirname, "../..", "dist", "public");
  
  if (!fs.existsSync(distPath)) {
    console.error(
      `[Static] Could not find the build directory: ${distPath}, make sure to build the client first`
    );
    // Vercel環境では、ビルドディレクトリが見つからない場合は警告のみ
    // （Vercelが自動的に配信するため）
    if (!isVercel) {
      return; // ローカル環境では早期リターン
    }
  }

  // Vercel環境では、APIルート以外のリクエストのみ静的ファイルを配信
  // APIルートは先に処理されているため、ここに来るのは静的ファイルかSPAルーティング用
  if (!isVercel) {
    // ローカル環境では静的ファイルを明示的に配信
    app.use(express.static(distPath));
  }

  // SPAルーティング用のフォールバック
  // APIルート以外の全てのリクエストをindex.htmlにフォールバック
  app.use("*", (req, res, next) => {
    // APIルートは既に処理されているはずなので、ここには来ない
    if (req.path.startsWith("/api/")) {
      return next();
    }
    
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });
}
