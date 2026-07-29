import { Router, type IRouter } from "express";
import {
  GetLeaderboardResponse,
  GetTopLeaderboardResponse,
  GetLeaderboardQueryParams,
  GetFriendsLeaderboardResponse,
} from "@workspace/api-zod";
import { leaderboard } from "../lib/mockData";
import { db, usersTable, followsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  const type = parsed.success ? (parsed.data.type ?? "global") : "global";

  // For demo purposes, apply slight variation for weekly/monthly
  let entries = [...leaderboard.slice(0, 10)];
  if (type === "weekly") {
    entries = entries.map((e, i) => ({ ...e, points: Math.round(e.points * 0.12), rank: i + 1 }));
  } else if (type === "monthly") {
    entries = entries.map((e, i) => ({ ...e, points: Math.round(e.points * 0.45), rank: i + 1 }));
  }

  // Populate userEntry from authenticated user if available
  let userEntry;
  if (req.isAuthenticated()) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, parseInt(req.user.id, 10)));
    if (user) {
      userEntry = {
        rank: user.globalRank,
        user: { id: String(user.id), name: user.name, avatar: user.avatar, country: user.country },
        points: user.totalPoints,
        predictions: user.totalPredictions,
        accuracy: user.accuracy,
        change: 0,
      };
    }
  }

  if (!userEntry) {
    userEntry = {
      rank: 9999,
      user: { id: "0", name: "أنت", avatar: "", country: "SA" },
      points: 0,
      predictions: 0,
      accuracy: 0,
      change: 0,
    };
  }

  res.json(GetLeaderboardResponse.parse({
    entries,
    total: 8432,
    userEntry,
  }));
});

router.get("/leaderboard/top", async (_req, res): Promise<void> => {
  const top3 = leaderboard.slice(0, 3);
  res.json(GetTopLeaderboardResponse.parse(top3));
});

router.get("/leaderboard/friends", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return;
  }

  const meId = parseInt(req.user.id, 10);

  // Get who the user follows
  const following = await db
    .select()
    .from(followsTable)
    .where(eq(followsTable.followerId, meId));

  const followingIds = following.map((f) => f.followingId);

  // Include self in friends leaderboard
  const allIds = [meId, ...followingIds];

  const users = await db
    .select()
    .from(usersTable)
    .where(inArray(usersTable.id, allIds));

  const sorted = [...users].sort((a, b) => b.totalPoints - a.totalPoints);

  const entries = sorted.map((u, i) => ({
    rank: i + 1,
    user: {
      id: String(u.id),
      name: u.name,
      avatar: u.avatar,
      country: u.country,
    },
    points: u.totalPoints,
    predictions: u.totalPredictions,
    accuracy: u.accuracy,
    change: 0,
  }));

  const userEntry = entries.find((e) => e.user.id === String(meId)) ?? {
    rank: 1,
    user: { id: String(meId), name: "أنت", avatar: "", country: "SA" },
    points: 0,
    predictions: 0,
    accuracy: 0,
    change: 0,
  };

  res.json(
    GetFriendsLeaderboardResponse.parse({
      entries,
      total: entries.length,
      userEntry,
    }),
  );
});

export default router;
