import express, { type Express } from "express";
import fs from "fs";
import path from "path";

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

