// src/api-server.ts
import "dotenv/config";
import express2 from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// drizzle/schema.ts
import { pgEnum, pgTable, serial, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";
var roleEnum = pgEnum("role", ["user", "admin"]);
var users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  url: text("url"),
  industry: varchar("industry", { length: 100 }),
  employeeCount: integer("employeeCount"),
  challenges: text("challenges"),
  // JSON配列として保存
  reasons: text("reasons"),
  // JSON配列として保存
  effects: text("effects"),
  // JSON配列として保存
  fullText: text("fullText"),
  usageScale: varchar("usageScale", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
import { sql } from "drizzle-orm";
var _db = null;
var _sql = null;
async function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      console.error("[Database] DATABASE_URL is not set - this will cause API errors!");
      console.error("[Database] Please set DATABASE_URL in Vercel environment variables");
      return null;
    }
    try {
      console.log("[Database] Connecting to database...", {
        url_prefix: process.env.DATABASE_URL.substring(0, 20) + "..."
      });
      _sql = postgres(process.env.DATABASE_URL, {
        max: 1,
        // Vercel serverless functions用に接続数を制限
        idle_timeout: 20,
        connect_timeout: 10
      });
      _db = drizzle(_sql);
      console.log("[Database] Testing connection...");
      await _sql`SELECT 1`;
      console.log("[Database] Connected successfully \u2713");
    } catch (error) {
      console.error("[Database] Failed to connect:", {
        message: error instanceof Error ? error.message : String(error),
        code: error?.code,
        detail: error?.detail,
        hint: error?.hint,
        stack: error instanceof Error ? error.stack : void 0
      });
      _db = null;
      _sql = null;
      throw new Error(`\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u63A5\u7D9A\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    updateSet.updatedAt = sql`now()`;
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllCases() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get cases: database not available");
    throw new Error("\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u63A5\u7D9A\u304C\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002DATABASE_URL\u74B0\u5883\u5909\u6570\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
  }
  try {
    return await db.select().from(cases);
  } catch (error) {
    console.error("[Database] Failed to get cases:", error);
    throw new Error(`\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
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
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
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
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";
function calculateMatchScore(prospectIndustry, prospectEmployeeCount, prospectChallenges, caseIndustry, caseEmployeeCount, caseChallenges) {
  let score = 0;
  const reasons = [];
  if (caseIndustry && prospectIndustry === caseIndustry) {
    score += 30;
    reasons.push(`\u540C\u3058\u696D\u754C\uFF08${prospectIndustry}\uFF09\u306E\u5C0E\u5165\u5B9F\u7E3E\u304C\u3042\u308A\u307E\u3059`);
  } else if (caseIndustry) {
    if (caseIndustry.includes(prospectIndustry) || prospectIndustry.includes(caseIndustry)) {
      score += 15;
      reasons.push(`\u985E\u4F3C\u696D\u754C\uFF08${caseIndustry}\uFF09\u306E\u5C0E\u5165\u5B9F\u7E3E\u304C\u3042\u308A\u307E\u3059`);
    }
  }
  if (prospectEmployeeCount !== null && caseEmployeeCount !== null) {
    const diff = Math.abs(prospectEmployeeCount - caseEmployeeCount);
    const ratio = diff / Math.max(prospectEmployeeCount, caseEmployeeCount);
    if (ratio < 0.2) {
      score += 40;
      reasons.push(`\u5F93\u696D\u54E1\u6570\u304C\u8FD1\u3044\u898F\u6A21\uFF08${caseEmployeeCount}\u540D\uFF09\u306E\u4F01\u696D\u3067\u3059`);
    } else if (ratio < 0.5) {
      score += 27;
      reasons.push(`\u5F93\u696D\u54E1\u6570\u304C\u6BD4\u8F03\u7684\u8FD1\u3044\u898F\u6A21\uFF08${caseEmployeeCount}\u540D\uFF09\u306E\u4F01\u696D\u3067\u3059`);
    } else if (ratio < 1) {
      score += 13;
      reasons.push(`\u5F93\u696D\u54E1\u6570\u306F${caseEmployeeCount}\u540D\u306E\u4F01\u696D\u3067\u3059`);
    }
  }
  const prospectChallengesLower = prospectChallenges.toLowerCase();
  let challengeMatchCount = 0;
  const matchedChallenges = [];
  for (const challenge of caseChallenges) {
    const challengeLower = challenge.toLowerCase();
    const keywords = [
      "\u5065\u5EB7",
      "\u98DF\u4E8B",
      "\u91CE\u83DC",
      "\u6804\u990A",
      "\u98DF\u751F\u6D3B",
      "\u798F\u5229\u539A\u751F",
      "\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3",
      "\u6E80\u8DB3\u5EA6",
      "\u63A1\u7528",
      "\u30A8\u30F3\u30B2\u30FC\u30B8\u30E1\u30F3\u30C8",
      "\u98DF\u74B0\u5883",
      "\u5065\u5EB7\u7D4C\u55B6"
    ];
    for (const keyword of keywords) {
      if (prospectChallengesLower.includes(keyword) && challengeLower.includes(keyword)) {
        challengeMatchCount++;
        matchedChallenges.push(challenge);
        break;
      }
    }
  }
  if (challengeMatchCount > 0) {
    score += Math.min(30, challengeMatchCount * 10);
    reasons.push(`\u985E\u4F3C\u306E\u8AB2\u984C\uFF08${matchedChallenges.slice(0, 2).join("\u3001")}\uFF09\u3092\u62B1\u3048\u3066\u3044\u307E\u3057\u305F`);
  }
  return { score, reasons };
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  cases: router({
    // 全事例を取得（認証なし）
    getAll: publicProcedure.query(async () => {
      try {
        const allCases = await getAllCases();
        return allCases.map((c) => {
          try {
            return {
              ...c,
              challenges: c.challenges ? JSON.parse(c.challenges) : [],
              reasons: c.reasons ? JSON.parse(c.reasons) : [],
              effects: c.effects ? JSON.parse(c.effects) : []
            };
          } catch (parseError) {
            console.error("[Cases] Failed to parse JSON for case:", c.id, parseError);
            return {
              ...c,
              challenges: [],
              reasons: [],
              effects: []
            };
          }
        });
      } catch (error) {
        console.error("[Cases] Failed to get all cases:", error);
        throw new Error(`\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
    // マッチング実行（認証なし）
    match: publicProcedure.input(z2.object({
      industry: z2.string(),
      employeeCount: z2.number().nullable(),
      challenges: z2.string(),
      excludeIds: z2.array(z2.number()).optional()
      // 除外するID
    })).mutation(async ({ input }) => {
      console.log("[Cases] Match request received:", {
        industry: input.industry,
        employeeCount: input.employeeCount,
        challenges: input.challenges?.substring(0, 50) + "...",
        excludeIds: input.excludeIds
      });
      try {
        console.log("[Cases] Fetching all cases from database...");
        const allCases = await getAllCases();
        console.log(`[Cases] Retrieved ${allCases.length} cases from database`);
        if (allCases.length === 0) {
          throw new Error("\u5C0E\u5165\u4E8B\u4F8B\u30C7\u30FC\u30BF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u63A5\u7D9A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
        }
        const excludeIds = input.excludeIds || [];
        const filteredCases = allCases.filter((c) => !excludeIds.includes(c.id));
        if (filteredCases.length === 0) {
          throw new Error("\u3053\u308C\u4EE5\u4E0A\u306E\u30DE\u30C3\u30C1\u30F3\u30B0\u5019\u88DC\u304C\u3042\u308A\u307E\u305B\u3093");
        }
        const scoredCases = filteredCases.map((c) => {
          try {
            const caseChallenges = c.challenges ? JSON.parse(c.challenges) : [];
            const { score, reasons } = calculateMatchScore(
              input.industry,
              input.employeeCount,
              input.challenges,
              c.industry,
              c.employeeCount,
              caseChallenges
            );
            return {
              case: {
                ...c,
                challenges: caseChallenges,
                reasons: c.reasons ? JSON.parse(c.reasons) : [],
                effects: c.effects ? JSON.parse(c.effects) : []
              },
              score,
              matchReasons: reasons
            };
          } catch (parseError) {
            console.error("[Cases] Failed to parse JSON for case:", c.id, parseError);
            return {
              case: {
                ...c,
                challenges: [],
                reasons: [],
                effects: []
              },
              score: 0,
              matchReasons: []
            };
          }
        });
        scoredCases.sort((a, b) => b.score - a.score);
        const bestMatch = scoredCases[0];
        return {
          matchedCase: bestMatch.case,
          matchScore: bestMatch.score,
          matchReasons: bestMatch.matchReasons
        };
      } catch (error) {
        console.error("[Cases] Match error:", error);
        throw new Error(`\u30DE\u30C3\u30C1\u30F3\u30B0\u51E6\u7406\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
function serveStatic(app2) {
  const distPath = process.env.VERCEL ? path2.resolve(process.cwd(), "dist", "public") : process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "../..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// src/api-server.ts
console.log("[Server] Starting server...", {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? "\u8A2D\u5B9A\u6E08\u307F" : "\u672A\u8A2D\u5B9A",
  DATABASE_URL_length: process.env.DATABASE_URL?.length || 0
});
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ limit: "50mb", extended: true }));
registerOAuthRoutes(app);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path: path3, type, ctx }) => {
      console.error(`[tRPC Error] ${type} ${path3}:`, {
        message: error.message,
        code: error.code,
        cause: error.cause,
        stack: error.stack
      });
    },
    responseMeta: () => {
      return {
        headers: {
          "Content-Type": "application/json"
        }
      };
    }
  })
);
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
}
app.use((err, req, res, next) => {
  console.error("[Server Error]", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
      ...process.env.NODE_ENV === "development" && { stack: err.stack }
    });
  }
});
var api_server_default = app;
export {
  api_server_default as default
};
