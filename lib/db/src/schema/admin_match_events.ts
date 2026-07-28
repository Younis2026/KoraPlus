import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminMatchEventsTable = pgTable("admin_match_events", {
  id: serial("id").primaryKey(),
  matchId: text("match_id").notNull(),
  minute: integer("minute").notNull(),
  type: text("type").notNull(), // goal, yellow_card, red_card, substitution, var, penalty
  team: text("team").notNull(), // home, away
  playerName: text("player_name").notNull(),
  assistPlayerName: text("assist_player_name"),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdminMatchEventSchema = createInsertSchema(adminMatchEventsTable).omit({ id: true, createdAt: true });
export type InsertAdminMatchEvent = z.infer<typeof insertAdminMatchEventSchema>;
export type AdminMatchEventRow = typeof adminMatchEventsTable.$inferSelect;
