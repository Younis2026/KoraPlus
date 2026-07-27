import { Router, type IRouter } from "express";
import {
  GetLeaderboardResponse,
  GetTopLeaderboardResponse,
  GetLeaderboardQueryParams,
} from "@workspace/api-zod";
import { leaderboard } from "../lib/mockData";

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

  const userEntry = {
    rank: 47,
    user: { id: "me", name: "محمد الأحمد", avatar: "", country: "SA" },
    points: type === "weekly" ? 148 : type === "monthly" ? 560 : 1250,
    predictions: 38,
    accuracy: 63,
    change: 5,
  };

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

export default router;
