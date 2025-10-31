import { pgEnum, pgTable, serial, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 導入事例テーブル
 * オフィスで野菜の導入企業の情報を格納
 */
export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  url: text("url"),
  industry: varchar("industry", { length: 100 }),
  employeeCount: integer("employeeCount"),
  challenges: text("challenges"), // JSON配列として保存
  reasons: text("reasons"), // JSON配列として保存
  effects: text("effects"), // JSON配列として保存
  fullText: text("fullText"),
  usageScale: varchar("usageScale", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;
