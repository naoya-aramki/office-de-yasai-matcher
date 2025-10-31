import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, cases, InsertCase, Case } from "../drizzle/schema";
import { ENV } from './_core/env';
import { sql } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      console.error("[Database] DATABASE_URL is not set");
      return null;
    }
    
    try {
      // PostgreSQL用の接続プールを作成
      console.log("[Database] Connecting to database...");
      _sql = postgres(process.env.DATABASE_URL, {
        max: 1, // Vercel serverless functions用に接続数を制限
      });
      _db = drizzle(_sql);
      
      // 接続テスト
      await _sql`SELECT 1`;
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        detail: (error as any)?.detail,
        hint: (error as any)?.hint,
      });
      _db = null;
      _sql = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQLではupdatedAtを明示的に更新
    updateSet.updatedAt = sql`now()`;

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// 導入事例関連のヘルパー関数

export async function insertCase(caseData: InsertCase): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert case: database not available");
    return;
  }

  await db.insert(cases).values(caseData);
}

export async function getAllCases(): Promise<Case[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get cases: database not available");
    throw new Error("データベース接続が利用できません。DATABASE_URL環境変数を確認してください。");
  }

  try {
    return await db.select().from(cases);
  } catch (error) {
    console.error("[Database] Failed to get cases:", error);
    throw new Error(`データの取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCaseById(id: number): Promise<Case | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get case: database not available");
    return undefined;
  }

  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function clearAllCases(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot clear cases: database not available");
    return;
  }

  await db.delete(cases);
}
