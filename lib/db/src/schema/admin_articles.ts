import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminArticlesTable = pgTable("admin_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull().default("فريق التحرير"),
  category: text("category").notNull(), // breaking, transfers, injuries, press_conference, analysis, video_highlights
  imageUrl: text("image_url").notNull().default(""),
  teamId: text("team_id"),
  leagueId: text("league_id"),
  isBreaking: boolean("is_breaking").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(true),
  readTimeMinutes: integer("read_time_minutes").notNull().default(3),
  viewCount: integer("view_count").notNull().default(0),
  tags: text("tags").array().notNull().default([]),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAdminArticleSchema = createInsertSchema(adminArticlesTable).omit({ id: true, publishedAt: true, updatedAt: true });
export type InsertAdminArticle = z.infer<typeof insertAdminArticleSchema>;
export type AdminArticleRow = typeof adminArticlesTable.$inferSelect;
