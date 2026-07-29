import { pgTable, text, serial, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const groupLeaguesTable = pgTable("group_leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  creatorId: integer("creator_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupLeagueMembersTable = pgTable(
  "group_league_members",
  {
    groupId: integer("group_id")
      .notNull()
      .references(() => groupLeaguesTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

export type GroupLeague = typeof groupLeaguesTable.$inferSelect;
export type GroupLeagueMember = typeof groupLeagueMembersTable.$inferSelect;
