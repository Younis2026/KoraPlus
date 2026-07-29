import { Router, type IRouter } from "express";
import {
  GetLeaderboardResponse,
  GetTopLeaderboardResponse,
  GetLeaderboardQueryParams,
  GetFriendsLeaderboardResponse,
} from "@workspace/api-zod";
import { db, usersTable, followsTable } from "@workspace/db";
import { eq, inArray, desc } from "drizzle-orm";

const router: IRouter = Router();

/** Fetch all real users ordered by total_points and shape them into leaderboard entries */
async function getRealLeaderboardEntries(limit = 100) {
  const users = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.totalPoints))
    .limit(limit);

  return users.map((u, i) => ({
    rank: i + 1,
    user: {
      id: String(u.id),
      name: u.name || u.username || "مستخدم",
      avatar: u.avatar || "",
      country: u.country || "SA",
    },
    points: u.totalPoints,
    predictions: u.totalPredictions,
    accuracy: u.accuracy,
    change: 0,
  }));
}

router.get("/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  const type = parsed.success ? (parsed.data.type ?? "global") : "global";

  let entries = await getRealLeaderboardEntries(50);

  // For weekly/monthly, scale down points proportionally (approximation until real tracking exists)
  if (type === "weekly") {
    entries = entries.map((e, i) => ({
      ...e,
      points: Math.round(e.points * 0.12),
      rank: i + 1,
    }));
  } else if (type === "monthly") {
    entries = entries.map((e, i) => ({
      ...e,
      points: Math.round(e.points * 0.45),
      rank: i + 1,
    }));
  }

  const total = await db.$count(usersTable);

  // Build userEntry for the authenticated user
  let userEntry;
  if (req.isAuthenticated()) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, parseInt(req.user.id, 10)));
    if (user) {
      // Find real rank position
      const userRankInList = entries.findIndex(
        (e) => e.user.id === String(user.id),
      );
      const rank =
        userRankInList >= 0 ? userRankInList + 1 : user.globalRank ?? 9999;
      userEntry = {
        rank,
        user: {
          id: String(user.id),
          name: user.name || user.username || "مستخدم",
          avatar: user.avatar || "",
          country: user.country || "SA",
        },
        points:
          type === "weekly"
            ? Math.round(user.totalPoints * 0.12)
            : type === "monthly"
              ? Math.round(user.totalPoints * 0.45)
              : user.totalPoints,
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

  res.json(
    GetLeaderboardResponse.parse({
      entries,
      total,
      userEntry,
    }),
  );
});

router.get("/leaderboard/top", async (_req, res): Promise<void> => {
  const top3 = await getRealLeaderboardEntries(3);
  res.json(GetTopLeaderboardResponse.parse(top3));
});

router.get("/leaderboard/friends", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return;
  }

  const meId = parseInt(req.user.id, 10);

  const following = await db
    .select()
    .from(followsTable)
    .where(eq(followsTable.followerId, meId));

  const followingIds = following.map((f) => f.followingId);
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
      name: u.name || u.username || "مستخدم",
      avatar: u.avatar || "",
      country: u.country || "SA",
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
