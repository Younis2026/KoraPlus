import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  // Auth fields — populated via Replit OIDC upsert
  replitId: text("replit_id").unique(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  // Profile fields
  name: text("name").notNull().default("لاعب جديد"),
  username: text("username").notNull().unique().default("player"),
  avatar: text("avatar").notNull().default(""),
  country: text("country").notNull().default("SA"),
  totalPoints: integer("total_points").notNull().default(0),
  globalRank: integer("global_rank").notNull().default(9999),
  totalPredictions: integer("total_predictions").notNull().default(0),
  accuracy: integer("accuracy").notNull().default(0),
  level: text("level").notNull().default("مبتدئ"),
  badgeCount: integer("badge_count").notNull().default(0),
  // Access control
  role: text("role").notNull().default("user"),
  isProfileComplete: boolean("is_profile_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
