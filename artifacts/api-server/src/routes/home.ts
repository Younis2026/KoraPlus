import { Router, type IRouter } from "express";
import { GetHomeSummaryResponse } from "@workspace/api-zod";
import { news as mockNews, leagues, leaderboard } from "../lib/mockData";
import { getMatchesMerged, getResultsBasedNews } from "../lib/footballApi";

const router: IRouter = Router();

router.get("/home/summary", async (req, res): Promise<void> => {
  // Fetch live matches and news in parallel
  const [allMatches, liveNews] = await Promise.allSettled([
    getMatchesMerged(),
    getResultsBasedNews(),
  ]);

  const matches = allMatches.status === "fulfilled" ? allMatches.value : [];
  const resultNews = liveNews.status === "fulfilled" ? liveNews.value : [];

  const todayMatches = matches
    .filter(m => m.status === "live" || m.status === "upcoming")
    .slice(0, 5);

  const liveMatchCount = matches.filter(m => m.status === "live").length;

  // Breaking news: live results first, then mock breaking news
  const breakingNews = [
    ...resultNews.slice(0, 2),
    ...mockNews.filter(n => n.isBreaking).slice(0, 2),
  ].slice(0, 3);

  const topLeagues = leagues.slice(0, 5);
  const topLeaderboard = leaderboard.slice(0, 3);

  const summary = {
    breakingNews,
    todayMatches,
    liveMatchCount,
    topLeagues,
    userRank: 47,
    userPoints: 1250,
    upcomingPredictions: [],
    topLeaderboard,
  };

  res.json(GetHomeSummaryResponse.parse(summary));
});

export default router;
