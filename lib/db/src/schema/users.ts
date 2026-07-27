import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("محمد الأحمد"),
  username: text("username").notNull().unique().default("mohammed"),
  avatar: text("avatar").notNull().default(""),
  country: text("country").notNull().default("SA"),
  totalPoints: integer("total_points").notNull().default(1250),
  globalRank: integer("global_rank").notNull().default(47),
  totalPredictions: integer("total_predictions").notNull().default(38),
  accuracy: integer("accuracy").notNull().default(63),
  level: text("level").notNull().default("محترف"),
  badgeCount: integer("badge_count").notNull().default(7),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
