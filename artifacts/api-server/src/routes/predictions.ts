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
import { matches, matchPolls, rewards } from "../lib/mockData";

const router: IRouter = Router();

router.get("/predictions/available", async (_req, res): Promise<void> => {
  const availableMatches = matches.filter(m => m.status === "upcoming" || m.status === "live");
  const result = availableMatches.map(match => ({
    match,
    closesAt: match.scheduledAt,
    pointsAvailable: 150,
    crowdPrediction: matchPolls[match.id] ?? {
      matchId: match.id,
      homeWinPercent: 40,
      drawPercent: 30,
      awayWinPercent: 30,
      totalVotes: 500,
    },
    hasPredicted: false,
  }));

  res.json(ListAvailablePredictionsResponse.parse(result));
});

router.get("/predictions", async (req, res): Promise<void> => {
  const dbPredictions = await db.select().from(predictionsTable);

  const enriched = dbPredictions.map(p => {
    const match = matches.find(m => m.id === p.matchId) ?? matches[0];
    return {
      id: String(p.id),
      match,
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
  const parsed = CreatePredictionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const match = matches.find(m => m.id === parsed.data.matchId);
  if (!match) {
    res.status(400).json({ error: "المباراة غير موجودة" });
    return;
  }

  const [inserted] = await db.insert(predictionsTable).values({
    matchId: parsed.data.matchId,
    homeScorePrediction: parsed.data.homeScorePrediction ?? null,
    awayScorePrediction: parsed.data.awayScorePrediction ?? null,
    firstGoalscorer: parsed.data.firstGoalscorer ?? null,
    manOfMatch: parsed.data.manOfMatch ?? null,
    totalGoalsPrediction: parsed.data.totalGoalsPrediction ?? null,
    status: "pending",
  }).returning();

  res.status(201).json(CreatePredictionResponse.parse({
    id: String(inserted.id),
    match,
    homeScorePrediction: inserted.homeScorePrediction ?? null,
    awayScorePrediction: inserted.awayScorePrediction ?? null,
    firstGoalscorer: inserted.firstGoalscorer ?? null,
    manOfMatch: inserted.manOfMatch ?? null,
    totalGoalsPrediction: inserted.totalGoalsPrediction ?? null,
    status: inserted.status,
    pointsEarned: null,
    submittedAt: inserted.submittedAt.toISOString(),
  }));
});

router.get("/predictions/history", async (_req, res): Promise<void> => {
  const dbPredictions = await db.select().from(predictionsTable);
  const total = dbPredictions.length;
  const won = dbPredictions.filter(p => p.status === "won").length;
  const totalPoints = dbPredictions.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0);
  const accuracy = total > 0 ? Math.round((won / total) * 100) : 0;

  const enriched = dbPredictions.map(p => {
    const match = matches.find(m => m.id === p.matchId) ?? matches[0];
    return {
      id: String(p.id),
      match,
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

  res.json(GetPredictionHistoryResponse.parse({
    totalPredictions: total,
    correctPredictions: won,
    totalPointsEarned: totalPoints,
    accuracyPercent: accuracy,
    predictions: enriched,
  }));
});

router.get("/predictions/points-calculator", async (req, res): Promise<void> => {
  const parsed = CalculatePotentialPointsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const pointsMap: Record<string, { base: number; difficulty: "easy" | "medium" | "hard" }> = {
    score: { base: 100, difficulty: "hard" },
    first_goalscorer: { base: 75, difficulty: "hard" },
    man_of_match: { base: 50, difficulty: "medium" },
    total_goals: { base: 40, difficulty: "medium" },
  };

  const typeInfo = pointsMap[parsed.data.predictionType] ?? { base: 50, difficulty: "medium" as const };
  const multiplier = 1.5;

  res.json(CalculatePotentialPointsResponse.parse({
    matchId: parsed.data.matchId,
    predictionType: parsed.data.predictionType,
    basePoints: typeInfo.base,
    bonusMultiplier: multiplier,
    potentialPoints: Math.round(typeInfo.base * multiplier),
    difficulty: typeInfo.difficulty,
  }));
});

router.get("/rewards", async (_req, res): Promise<void> => {
  res.json(ListRewardsResponse.parse(rewards));
});

export default router;
