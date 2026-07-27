import { Router, type IRouter } from "express";
import { GetHomeSummaryResponse } from "@workspace/api-zod";
import { matches, news, leagues, leaderboard } from "../lib/mockData";

const router: IRouter = Router();

router.get("/home/summary", async (req, res): Promise<void> => {
  const todayMatches = matches.filter(m => m.status === "live" || m.status === "upcoming");
  const liveMatchCount = matches.filter(m => m.status === "live").length;
  const breakingNews = news.filter(n => n.isBreaking).slice(0, 3);
  const topLeagues = leagues.slice(0, 5);
  const topLeaderboard = leaderboard.slice(0, 3);

  const summary = {
    breakingNews,
    todayMatches: todayMatches.slice(0, 5),
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
