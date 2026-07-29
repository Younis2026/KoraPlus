import { Router, type IRouter } from "express";
import { GetHomeSummaryResponse } from "@workspace/api-zod";
import { news as mockNews, leagues } from "../lib/mockData";
import { getMatchesMerged, getResultsBasedNews } from "../lib/footballApi";
import { db, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/home/summary", async (req, res): Promise<void> => {
  // Fetch live matches, news, and leaderboard in parallel
  const [allMatchesResult, liveNewsResult, topUsersResult] =
    await Promise.allSettled([
      getMatchesMerged(),
      getResultsBasedNews(),
      db
        .select()
        .from(usersTable)
        .orderBy(desc(usersTable.totalPoints))
        .limit(3),
    ]);

  const matches =
    allMatchesResult.status === "fulfilled" ? allMatchesResult.value : [];
  const resultNews =
    liveNewsResult.status === "fulfilled" ? liveNewsResult.value : [];
  const topUsers =
    topUsersResult.status === "fulfilled" ? topUsersResult.value : [];

  const todayMatches = matches
    .filter((m) => m.status === "live" || m.status === "upcoming")
    .slice(0, 5);

  const liveMatchCount = matches.filter((m) => m.status === "live").length;

  // Breaking news: live results first, then mock breaking news
  const breakingNews = [
    ...resultNews.slice(0, 2),
    ...mockNews.filter((n) => n.isBreaking).slice(0, 2),
  ].slice(0, 3);

  const topLeagues = leagues.slice(0, 5);

  // Build top 3 leaderboard from real users
  const topLeaderboard = topUsers.map((u, i) => ({
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

  // Get the authenticated user's real rank and points
  let userRank = 0;
  let userPoints = 0;
  if (req.isAuthenticated()) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, parseInt(req.user.id, 10)));
    if (user) {
      userRank = user.globalRank ?? 9999;
      userPoints = user.totalPoints;
    }
  }

  const summary = {
    breakingNews,
    todayMatches: todayMatches as unknown as never,
    liveMatchCount,
    topLeagues,
    userRank,
    userPoints,
    upcomingPredictions: [],
    topLeaderboard,
  };

  res.json(GetHomeSummaryResponse.parse(summary));
});

export default router;
