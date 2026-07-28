import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminMatchesTable = pgTable("admin_matches", {
  id: serial("id").primaryKey(),
  homeTeamName: text("home_team_name").notNull(),
  awayTeamName: text("away_team_name").notNull(),
  leagueName: text("league_name").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("upcoming"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  minute: integer("minute"),
  venue: text("venue").notNull().default(""),
  predictionOpen: boolean("prediction_open").notNull().default(true),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAdminMatchSchema = createInsertSchema(adminMatchesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdminMatch = z.infer<typeof insertAdminMatchSchema>;
export type AdminMatchRow = typeof adminMatchesTable.$inferSelect;
