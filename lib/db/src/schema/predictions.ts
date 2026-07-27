import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().default(1),
  matchId: text("match_id").notNull(),
  homeScorePrediction: integer("home_score_prediction"),
  awayScorePrediction: integer("away_score_prediction"),
  firstGoalscorer: text("first_goalscorer"),
  manOfMatch: text("man_of_match"),
  totalGoalsPrediction: integer("total_goals_prediction"),
  status: text("status").notNull().default("pending"),
  pointsEarned: integer("points_earned"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ id: true, submittedAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;
