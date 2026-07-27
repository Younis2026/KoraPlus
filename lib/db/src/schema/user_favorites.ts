import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userFavoritesTable = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().default(1),
  teamIds: text("team_ids").array().notNull().default([]),
  leagueIds: text("league_ids").array().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserFavoritesSchema = createInsertSchema(userFavoritesTable).omit({ id: true });
export type InsertUserFavorites = z.infer<typeof insertUserFavoritesSchema>;
export type UserFavorites = typeof userFavoritesTable.$inferSelect;
