import { Router, type IRouter } from "express";
import {
  ListAvailablePredictionsResponse,
  ListMyPredictionsResponse,
  CreatePredictionBody,
  CreatePredictionResponse,
  GetPredictionHistoryResponse,
  CalculatePotentialPointsQueryParams,
  CalculatePotentialPointsResponse,
  ListRewardsResponse,
} from "@workspace/api-zod";
import { db, predictionsTable } from "@workspace/db";
import { matchPolls, rewards } from "../lib/mockData";
import { eq, and } from "drizzle-orm";
import { getMatchesMerged, type LiveMatch } from "../lib/footballApi";

const router: IRouter = Router();

/** Build a safe match stub for predictions whose match is no longer in the live feed */
function matchStub(matchId: string): LiveMatch {
  return {
    id: matchId,
    homeTeam: { id: "unknown", name: "فريق المضيف", logo: "", country: "" },
    awayTeam: { id: "unknown", name: "فريق الضيف", logo: "", country: "" },
    scheduledAt: new Date().toISOString(),
    status: "finished",
    homeScore: null,
    awayScore: null,
    league: { id: "unknown", name: "دوري", logo: "", country: "", season: "" },
    venue: "",
    minute: null,
  };
}

router.get("/predictions/available", async (req, res): Promise<void> => {
  const allMatches = await getMatchesMerged();
  const availableMatches = allMatches.filter(
    (m) => m.status === "upcoming" || m.status === "live",
  );

  // Determine which matches the current user has already predicted
  let predictedMatchIds = new Set<string>();
  if (req.isAuthenticated()) {
    const userId = parseInt(req.user.id, 10);
    const userPredictions = await db
      .select({ matchId: predictionsTable.matchId })
      .from(predictionsTable)
      .where(eq(predictionsTable.userId, userId));
    predictedMatchIds = new Set(userPredictions.map((p) => p.matchId));
  }

  const result = availableMatches.map((match) => ({
    match: match as unknown as never,
    closesAt: match.scheduledAt,
    pointsAvailable: 150,
    crowdPrediction: (matchPolls as Record<string, typeof matchPolls[keyof typeof matchPolls]>)[match.id] ?? {
      matchId: match.id,
      homeWinPercent: 40,
      drawPercent: 30,
      awayWinPercent: 30,
      totalVotes: 500,
    },
    hasPredicted: predictedMatchIds.has(match.id),
  }));

  res.json(ListAvailablePredictionsResponse.parse(result));
});

router.get("/predictions", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول لعرض التوقعات" });
    return;
  }

  const allMatches = await getMatchesMerged();
  const matchMap = new Map(allMatches.map((m) => [m.id, m]));

  const dbPredictions = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.userId, parseInt(req.user.id, 10)));

  const enriched = dbPredictions.map((p) => {
    const match = matchMap.get(p.matchId) ?? matchStub(p.matchId);
    return {
      id: String(p.id),
      match: match as unknown as never,
      homeScorePrediction: p.homeScorePrediction ?? null,
      awayScorePrediction: p.awayScorePrediction ?? null,
      firstGoalscorer: p.firstGoalscorer ?? null,
      manOfMatch: p.manOfMatch ?? null,
      totalGoalsPrediction: p.totalGoalsPrediction ?? null,
      status: p.status,
      pointsEarned: p.pointsEarned ?? null,
      submittedAt: p.submittedAt.toISOString(),
    };
  });

  res.json(ListMyPredictionsResponse.parse(enriched));
});

router.post("/predictions", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول لإرسال توقع" });
    return;
  }

  const parsed = CreatePredictionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = parseInt(req.user.id, 10);

  // Prevent duplicate predictions for the same match
  const [existing] = await db
    .select({ id: predictionsTable.id })
    .from(predictionsTable)
    .where(
      and(
        eq(predictionsTable.userId, userId),
        eq(predictionsTable.matchId, parsed.data.matchId),
      ),
    );

  if (existing) {
    res.status(409).json({ error: "لقد قمت بالتوقع على هذه المباراة مسبقاً" });
    return;
  }

  // Validate match exists in the live feed
  const allMatches = await getMatchesMerged();
  const match = allMatches.find((m) => m.id === parsed.data.matchId);
  if (!match) {
    res.status(400).json({ error: "المباراة غير موجودة" });
    return;
  }
  if (match.status === "finished") {
    res.status(400).json({ error: "انتهت المباراة ولا يمكن التوقع عليها" });
    return;
  }

  const [inserted] = await db
    .insert(predictionsTable)
    .values({
      userId,
      matchId: parsed.data.matchId,
      homeScorePrediction: parsed.data.homeScorePrediction ?? null,
      awayScorePrediction: parsed.data.awayScorePrediction ?? null,
      firstGoalscorer: parsed.data.firstGoalscorer ?? null,
      manOfMatch: parsed.data.manOfMatch ?? null,
      totalGoalsPrediction: parsed.data.totalGoalsPrediction ?? null,
      status: "pending",
    })
    .returning();

  res.status(201).json(
    CreatePredictionResponse.parse({
      id: String(inserted.id),
      match: match as unknown as never,
      homeScorePrediction: inserted.homeScorePrediction ?? null,
      awayScorePrediction: inserted.awayScorePrediction ?? null,
      firstGoalscorer: inserted.firstGoalscorer ?? null,
      manOfMatch: inserted.manOfMatch ?? null,
      totalGoalsPrediction: inserted.totalGoalsPrediction ?? null,
      status: inserted.status,
      pointsEarned: null,
      submittedAt: inserted.submittedAt.toISOString(),
    }),
  );
});

router.get("/predictions/history", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول لعرض سجل التوقعات" });
    return;
  }

  const allMatches = await getMatchesMerged();
  const matchMap = new Map(allMatches.map((m) => [m.id, m]));

  const dbPredictions = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.userId, parseInt(req.user.id, 10)));

  const total = dbPredictions.length;
  const won = dbPredictions.filter((p) => p.status === "won").length;
  const totalPoints = dbPredictions.reduce(
    (sum, p) => sum + (p.pointsEarned ?? 0),
    0,
  );
  const accuracy = total > 0 ? Math.round((won / total) * 100) : 0;

  const enriched = dbPredictions.map((p) => {
    const match = matchMap.get(p.matchId) ?? matchStub(p.matchId);
    return {
      id: String(p.id),
      match: match as unknown as never,
      homeScorePrediction: p.homeScorePrediction ?? null,
      awayScorePrediction: p.awayScorePrediction ?? null,
      firstGoalscorer: p.firstGoalscorer ?? null,
      manOfMatch: p.manOfMatch ?? null,
      totalGoalsPrediction: p.totalGoalsPrediction ?? null,
      status: p.status,
      pointsEarned: p.pointsEarned ?? null,
      submittedAt: p.submittedAt.toISOString(),
    };
  });

  res.json(
    GetPredictionHistoryResponse.parse({
      totalPredictions: total,
      correctPredictions: won,
      totalPointsEarned: totalPoints,
      accuracyPercent: accuracy,
      predictions: enriched,
    }),
  );
});

router.get("/predictions/points-calculator", async (req, res): Promise<void> => {
  const parsed = CalculatePotentialPointsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const pointsMap: Record<
    string,
    { base: number; difficulty: "easy" | "medium" | "hard" }
  > = {
    score: { base: 100, difficulty: "hard" },
    first_goalscorer: { base: 75, difficulty: "hard" },
    man_of_match: { base: 50, difficulty: "medium" },
    total_goals: { base: 40, difficulty: "medium" },
  };

  const typeInfo = pointsMap[parsed.data.predictionType] ?? {
    base: 50,
    difficulty: "medium" as const,
  };
  const multiplier = 1.5;

  res.json(
    CalculatePotentialPointsResponse.parse({
      matchId: parsed.data.matchId,
      predictionType: parsed.data.predictionType,
      basePoints: typeInfo.base,
      bonusMultiplier: multiplier,
      potentialPoints: Math.round(typeInfo.base * multiplier),
      difficulty: typeInfo.difficulty,
    }),
  );
});

router.get("/rewards", async (_req, res): Promise<void> => {
  res.json(ListRewardsResponse.parse(rewards));
});

export default router;
