import { Router, type IRouter } from "express";
import {
  ListMatchesResponse,
  GetMatchResponse,
  GetMatchPollResponse,
  ListMatchesQueryParams,
  GetMatchParams,
  GetMatchPollParams,
} from "@workspace/api-zod";
import { matches, getMatchDetail, matchPolls } from "../lib/mockData";

const router: IRouter = Router();

router.get("/matches", async (req, res): Promise<void> => {
  const query = ListMatchesQueryParams.safeParse(req.query);
  const filter = query.success ? query.data.filter : "today";

  let filtered = [...matches];

  if (filter === "live") {
    filtered = matches.filter(m => m.status === "live");
  } else if (filter === "today") {
    filtered = matches.filter(m => m.status === "live" || m.status === "upcoming");
  } else if (filter === "tomorrow") {
    filtered = matches.filter(m => m.status === "upcoming");
  } else if (filter === "past") {
    filtered = matches.filter(m => m.status === "finished");
  } else if (filter === "by_league") {
    const leagueId = query.success ? query.data.leagueId : undefined;
    if (leagueId) {
      filtered = matches.filter(m => m.league.id === leagueId);
    }
  }

  res.json(ListMatchesResponse.parse(filtered));
});

router.get("/matches/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetMatchParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "معرف المباراة غير صحيح" });
    return;
  }

  const detail = getMatchDetail(params.data.id);
  if (!detail) {
    res.status(404).json({ error: "لم يتم العثور على المباراة" });
    return;
  }

  res.json(GetMatchResponse.parse(detail));
});

router.get("/matches/:id/poll", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetMatchPollParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "معرف المباراة غير صحيح" });
    return;
  }

  const poll = matchPolls[params.data.id] ?? {
    matchId: params.data.id,
    homeWinPercent: 45,
    drawPercent: 27,
    awayWinPercent: 28,
    totalVotes: 1200,
  };

  res.json(GetMatchPollResponse.parse(poll));
});

export default router;
