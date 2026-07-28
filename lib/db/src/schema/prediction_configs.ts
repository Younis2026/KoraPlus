import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const predictionConfigsTable = pgTable("prediction_configs", {
  id: serial("id").primaryKey(),
  matchId: text("match_id").notNull().unique(),
  matchName: text("match_name").notNull(),
  isOpen: boolean("is_open").notNull().default(true),
  scorePoints: integer("score_points").notNull().default(100),
  goalscorерPoints: integer("goalscorer_points").notNull().default(75),
  momPoints: integer("mom_points").notNull().default(50),
  totalGoalsPoints: integer("total_goals_points").notNull().default(40),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPredictionConfigSchema = createInsertSchema(predictionConfigsTable).omit({ id: true });
export type InsertPredictionConfig = z.infer<typeof insertPredictionConfigSchema>;
export type PredictionConfigRow = typeof predictionConfigsTable.$inferSelect;
