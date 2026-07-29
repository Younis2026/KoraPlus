import { Router, type IRouter } from "express";
import {
  ListMatchesResponse,
  GetMatchResponse,
  GetMatchPollResponse,
  ListMatchesQueryParams,
  GetMatchParams,
  GetMatchPollParams,
} from "@workspace/api-zod";
import { matches as mockMatches, getMatchDetail, matchPolls } from "../lib/mockData";
import { getMatchesMerged } from "../lib/footballApi";

const router: IRouter = Router();

router.get("/matches", async (req, res): Promise<void> => {
  const query = ListMatchesQueryParams.safeParse(req.query);
  const filter = query.success ? query.data.filter : "today";

  let allMatches: typeof mockMatches;

  try {
    const live = await getMatchesMerged();
    // Cast live matches to match the mock type shape (compatible fields)
    allMatches = live as unknown as typeof mockMatches;
  } catch {
    allMatches = [...mockMatches];
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrowStart = new Date(todayEnd.getTime() + 1);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  let filtered = [...allMatches];

  if (filter === "live") {
    filtered = allMatches.filter(m => m.status === "live");
  } else if (filter === "today") {
    filtered = allMatches.filter(m => {
      const d = new Date(m.scheduledAt);
      return m.status === "live" || (m.status === "upcoming" && d >= todayStart && d <= todayEnd);
    });
    // If no "today" results, show all upcoming
    if (filtered.length === 0) {
      filtered = allMatches.filter(m => m.status === "live" || m.status === "upcoming");
    }
  } else if (filter === "tomorrow") {
    filtered = allMatches.filter(m => {
      const d = new Date(m.scheduledAt);
      return m.status === "upcoming" && d >= tomorrowStart && d <= tomorrowEnd;
    });
    if (filtered.length === 0) {
      filtered = allMatches.filter(m => m.status === "upcoming").slice(0, 6);
    }
  } else if (filter === "past") {
    filtered = allMatches.filter(m => m.status === "finished" || m.status === "postponed");
  } else if (filter === "by_league") {
    const leagueId = query.success ? query.data.leagueId : undefined;
    if (leagueId) {
      filtered = allMatches.filter(m => m.league.id === leagueId);
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

  // For live API matches (prefixed with sdb_), build a detail from what we have
  if (params.data.id.startsWith("sdb_")) {
    try {
      const allMatches = await getMatchesMerged();
      const match = allMatches.find(m => m.id === params.data.id);
      if (match) {
        // Build a detail object with empty lineup (real lineup requires premium API)
        const detail = {
          ...match,
          homeLineup: [],
          awayLineup: [],
          homeInjured: [],
          awayInjured: [],
          events: [],
          stats: {
            possession: { home: 50, away: 50 },
            shots: { home: 0, away: 0 },
            shotsOnTarget: { home: 0, away: 0 },
            corners: { home: 0, away: 0 },
            fouls: { home: 0, away: 0 },
            yellowCards: { home: 0, away: 0 },
            redCards: { home: 0, away: 0 },
          },
        };
        res.json(GetMatchResponse.parse(detail));
        return;
      }
    } catch {
      // fall through to mock
    }
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
