import { Router, type IRouter } from "express";
import { GetHomeSummaryResponse } from "@workspace/api-zod";
import { leagues } from "../lib/mockData";
import { getMatchesMerged, getResultsBasedNews } from "../lib/footballApi";
import { db, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

/** Map a live-results news item to the full NewsArticle shape that Zod expects */
function toNewsArticle(item: Awaited<ReturnType<typeof getResultsBasedNews>>[number]) {
  return {
    id: item.id,
    title: item.title,
    subtitle: "",
    summary: item.summary,
    author: "نتائج مباشرة",
    content: item.summary,
    category: item.category as
      | "breaking"
      | "transfers"
      | "injuries"
      | "press_conference"
      | "analysis"
      | "video_highlights",
    imageUrl: item.imageUrl,
    publishedAt: item.publishedAt,
    teamId: item.teamId ?? null,
    leagueId: item.leagueId ?? null,
    isBreaking: item.isBreaking,
    isFeatured: false,
    readTimeMinutes: item.readTimeMinutes,
    viewCount: 0,
    tags: [],
    videoUrl: null,
    isBookmarked: false,
  };
}

router.get("/home/summary", async (req, res): Promise<void> => {
  // Fetch live matches, news, and leaderboard in parallel — never crash
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

  // Breaking news: live results only — properly shaped as NewsArticle
  const breakingNews = resultNews
    .filter((n) => n.isBreaking)
    .slice(0, 3)
    .map(toNewsArticle);

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
    try {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, parseInt(req.user.id, 10)));
      if (user) {
        userRank = user.globalRank ?? 0;
        userPoints = user.totalPoints ?? 0;
      }
    } catch {
      // non-critical — keep defaults
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

  try {
    res.json(GetHomeSummaryResponse.parse(summary));
  } catch (err) {
    // Zod parse failed — return safe empty-state response so frontend never shows error
    console.error("[home/summary] Zod parse error:", err);
    res.json(
      GetHomeSummaryResponse.parse({
        breakingNews: [],
        todayMatches: [],
        liveMatchCount: 0,
        topLeagues,
        userRank,
        userPoints,
        upcomingPredictions: [],
        topLeaderboard,
      }),
    );
  }
});

export default router;
