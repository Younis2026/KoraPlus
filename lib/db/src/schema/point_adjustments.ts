import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pointAdjustmentsTable = pgTable("point_adjustments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  adjustment: integer("adjustment").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPointAdjustmentSchema = createInsertSchema(pointAdjustmentsTable).omit({ id: true, createdAt: true });
export type InsertPointAdjustment = z.infer<typeof insertPointAdjustmentSchema>;
export type PointAdjustmentRow = typeof pointAdjustmentsTable.$inferSelect;
