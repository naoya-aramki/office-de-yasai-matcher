import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { validateEmailDomain } from "./emailValidation";
// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

// Google OAuth types
export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
};

export type GoogleUserInfo = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
};

export type ExchangeTokenResponse = {
  accessToken: string;
  refreshToken?: string;
};

export type GetUserInfoResponse = {
  openId: string;
  email: string;
  name: string;
  platform: string | null;
  loginMethod: string | null;
};

// Google OAuth endpoints
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";

class OAuthService {
  constructor() {
    console.log("[OAuth] Initialized with Google OAuth");
    if (!ENV.appId) {
      console.error(
        "[OAuth] ERROR: VITE_APP_ID is not configured! Set VITE_APP_ID environment variable."
      );
    }
  }

  private decodeState(state: string): string {
    const redirectUri = atob(state);
    return redirectUri;
  }

  async getTokenByCode(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    const redirectUri = this.decodeState(state);
    
    if (!ENV.appId) {
      throw new Error("VITE_APP_ID is not configured");
    }

    const params = new URLSearchParams({
      code,
      client_id: ENV.appId,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    // Google OAuth Client Secret is required for server-side token exchange
    if (ENV.googleClientSecret) {
      params.append("client_secret", ENV.googleClientSecret);
    }

    console.log("[OAuth] Exchanging code for token", {
      redirectUri,
      hasClientSecret: !!ENV.googleClientSecret,
    });

    try {
      // Exchange authorization code for access token using Google OAuth
      const { data } = await axios.post<GoogleTokenResponse>(
        GOOGLE_TOKEN_ENDPOINT,
        params,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: AXIOS_TIMEOUT_MS,
        }
      );

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
    } catch (error: any) {
      console.error("[OAuth] Token exchange failed", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  async getUserInfoByToken(
    token: ExchangeTokenResponse
  ): Promise<GetUserInfoResponse> {
    // Get user info from Google OAuth
    const { data } = await axios.get<GoogleUserInfo>(
      GOOGLE_USERINFO_ENDPOINT,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
        timeout: AXIOS_TIMEOUT_MS,
      }
    );

    // Map Google user info to our format
    return {
      openId: data.id, // Use Google user ID as openId
      email: data.email,
      name: data.name,
      platform: "google",
      loginMethod: "google",
    };
  }
}

class SDKServer {
  private readonly oauthService: OAuthService;

  constructor() {
    this.oauthService = new OAuthService();
  }

  private deriveLoginMethod(
    platforms: unknown,
    fallback: string | null | undefined
  ): string | null {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set<string>(
      platforms.filter((p): p is string => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (
      set.has("REGISTERED_PLATFORM_MICROSOFT") ||
      set.has("REGISTERED_PLATFORM_AZURE")
    )
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }

  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    return this.oauthService.getTokenByCode(code, state);
  }

  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken: string): Promise<GetUserInfoResponse> {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken,
    } as ExchangeTokenResponse);
    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoResponse;
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId) ||
        !isNonEmptyString(name)
      ) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        openId,
        appId,
        name,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async getUserInfoWithJwt(
    jwtToken: string
  ): Promise<GetUserInfoResponse> {
    // Verify JWT token and extract user info
    const session = await this.verifySession(jwtToken);
    if (!session) {
      throw new Error("Invalid JWT token");
    }

    // Get user from database
    const user = await db.getUserByOpenId(session.openId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      openId: user.openId,
      email: user.email || "",
      name: user.name || "",
      platform: user.loginMethod || "google",
      loginMethod: user.loginMethod || "google",
    };
  }

  async authenticateRequest(req: Request): Promise<User> {
    // Regular authentication flow
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    let user = await db.getUserByOpenId(sessionUserId);

    // User should already be in DB from OAuth callback
    // If not, it means the session is invalid

    if (!user) {
      throw ForbiddenError("User not found");
    }

    // Email domain validation - @officedeyasai.jp only
    try {
      validateEmailDomain(user.email);
    } catch (error) {
      console.warn(
        `[Auth] Access denied for email: ${user.email || "unknown"}`
      );
      throw ForbiddenError(
        "このアプリケーションは@officedeyasai.jpのメールアドレスでのみアクセス可能です。"
      );
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user;
  }
}

export const sdk = new SDKServer();
