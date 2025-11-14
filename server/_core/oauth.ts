import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { validateEmailDomain } from "./emailValidation";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Email domain validation - @officedeyasai.jp only
      try {
        validateEmailDomain(userInfo.email);
        console.log(`[OAuth] Access granted for email: ${userInfo.email}`);
      } catch (error) {
        console.warn(
          `[OAuth] Access denied for email: ${userInfo.email || "unknown"}`
        );
        res.status(403).json({
          error: "Access denied",
          message:
            "このアプリケーションは@officedeyasai.jpのメールアドレスでのみアクセス可能です。",
        });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error("[OAuth] Error details:", {
        message: errorMessage,
        stack: errorStack,
        code: (error as any)?.code,
        response: (error as any)?.response?.data,
      });
      res.status(500).json({ 
        error: "OAuth callback failed",
        message: errorMessage,
        ...(process.env.NODE_ENV === "development" && { stack: errorStack })
      });
    }
  });
}
