import { Router, type IRouter } from "express";
import {
  ListAvailablePredictionsResponse,
  ListMyPredictionsResponse,
  CreatePredictionBody,
  CreatePredictionResponse,
  GetPredictionHistoryResponse,
  UpdatePredictionBody,
  UpdatePredictionResponse,
} from "@workspace/api-zod";
import { db, predictionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getMatchesMerged, type LiveMatch } from "../lib/footballApi";

const router: IRouter = Router();

/** Deadline = 5 minutes before kickoff */
function getDeadline(scheduledAt: string): Date {
  return new Date(new Date(scheduledAt).getTime() - 5 * 60 * 1000);
}

function isDeadlinePassed(scheduledAt: string): boolean {
  return new Date() >= getDeadline(scheduledAt);
}

function matchStub(id: string): LiveMatch {
  return {
    id,
    homeTeam: { id: "unknown", name: "الفريق الأول", logo: "", country: "" },
    awayTeam: { id: "unknown", name: "الفريق الثاني", logo: "", country: "" },
    league: { id: "unknown", name: "دوري", logo: "", country: "", season: "" },
    scheduledAt: new Date().toISOString(),
    status: "finished",
    homeScore: null,
    awayScore: null,
    minute: null,
    venue: "",
  };
}

// ─── Available predictions ─────────────────────────────────────────────────────

router.get("/predictions/available", async (req, res): Promise<void> => {
  const allMatches = await getMatchesMerged();

  // Only matches not yet kicked off AND prediction deadline not passed
  const now = new Date();
  const availableMatches = allMatches.filter(
    (m) => m.status === "upcoming" && now < getDeadline(m.scheduledAt),
  );

  // Get matches user already predicted (only when authenticated)
  const predictedMatchIds = new Set<string>();
  if (req.isAuthenticated()) {
    const myPreds = await db
      .select({ matchId: predictionsTable.matchId })
      .from(predictionsTable)
      .where(eq(predictionsTable.userId, parseInt(req.user.id, 10)));
    myPreds.forEach((p) => predictedMatchIds.add(p.matchId));
  }

  const result = availableMatches.map((match) => ({
    match: match as unknown as never,
    closesAt: getDeadline(match.scheduledAt).toISOString(),
    pointsAvailable: 150,
    crowdPrediction: {
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

// ─── My predictions ─────────────────────────────────────────────────────────

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
      canEdit: !isDeadlinePassed(match.scheduledAt),
    };
  });

  res.json(ListMyPredictionsResponse.parse(enriched));
});

// ─── Create prediction ─────────────────────────────────────────────────────

router.post("/predictions", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول للتوقع" });
    return;
  }

  const parsed = CreatePredictionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات التوقع غير صحيحة" });
    return;
  }

  const { matchId, homeScorePrediction, awayScorePrediction, firstGoalscorer, manOfMatch, totalGoalsPrediction } = parsed.data;

  // Validate match exists and deadline not passed
  const allMatches = await getMatchesMerged();
  const match = allMatches.find((m) => m.id === matchId);

  if (!match) {
    res.status(404).json({ error: "المباراة غير موجودة" });
    return;
  }

  if (isDeadlinePassed(match.scheduledAt)) {
    res.status(400).json({ error: "انتهى وقت التوقع قبل 5 دقائق من بدء المباراة" });
    return;
  }

  // Check for duplicate
  const userId = parseInt(req.user.id, 10);
  const [existing] = await db
    .select()
    .from(predictionsTable)
    .where(
      and(
        eq(predictionsTable.userId, userId),
        eq(predictionsTable.matchId, matchId),
      ),
    );

  if (existing) {
    res.status(409).json({ error: "لقد قمت بالتوقع على هذه المباراة مسبقاً" });
    return;
  }

  const [inserted] = await db
    .insert(predictionsTable)
    .values({
      userId,
      matchId,
      homeScorePrediction: homeScorePrediction ?? null,
      awayScorePrediction: awayScorePrediction ?? null,
      firstGoalscorer: firstGoalscorer ?? null,
      manOfMatch: manOfMatch ?? null,
      totalGoalsPrediction: totalGoalsPrediction ?? null,
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
      canEdit: true,
    }),
  );
});

// ─── Update prediction (before deadline) ──────────────────────────────────────

router.patch("/predictions/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return;
  }

  const predId = parseInt(req.params.id, 10);
  if (isNaN(predId)) {
    res.status(400).json({ error: "معرف التوقع غير صحيح" });
    return;
  }

  const userId = parseInt(req.user.id, 10);

  const [pred] = await db
    .select()
    .from(predictionsTable)
    .where(and(eq(predictionsTable.id, predId), eq(predictionsTable.userId, userId)));

  if (!pred) {
    res.status(404).json({ error: "التوقع غير موجود" });
    return;
  }

  // Check deadline
  const allMatches = await getMatchesMerged();
  const match = allMatches.find((m) => m.id === pred.matchId) ?? matchStub(pred.matchId);

  if (isDeadlinePassed(match.scheduledAt)) {
    res.status(400).json({ error: "انتهى وقت التعديل — التوقعات تُغلق قبل 5 دقائق من بدء المباراة" });
    return;
  }

  const parsed = UpdatePredictionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات التعديل غير صحيحة" });
    return;
  }

  const [updated] = await db
    .update(predictionsTable)
    .set({
      homeScorePrediction: parsed.data.homeScorePrediction ?? pred.homeScorePrediction,
      awayScorePrediction: parsed.data.awayScorePrediction ?? pred.awayScorePrediction,
      firstGoalscorer: parsed.data.firstGoalscorer ?? pred.firstGoalscorer,
      manOfMatch: parsed.data.manOfMatch ?? pred.manOfMatch,
      totalGoalsPrediction: parsed.data.totalGoalsPrediction ?? pred.totalGoalsPrediction,
    })
    .where(eq(predictionsTable.id, predId))
    .returning();

  res.json(
    UpdatePredictionResponse.parse({
      id: String(updated.id),
      match: match as unknown as never,
      homeScorePrediction: updated.homeScorePrediction ?? null,
      awayScorePrediction: updated.awayScorePrediction ?? null,
      firstGoalscorer: updated.firstGoalscorer ?? null,
      manOfMatch: updated.manOfMatch ?? null,
      totalGoalsPrediction: updated.totalGoalsPrediction ?? null,
      status: updated.status,
      pointsEarned: updated.pointsEarned ?? null,
      submittedAt: updated.submittedAt.toISOString(),
      canEdit: true,
    }),
  );
});

// ─── Delete prediction (before deadline) ──────────────────────────────────────

router.delete("/predictions/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return;
  }

  const predId = parseInt(req.params.id, 10);
  if (isNaN(predId)) {
    res.status(400).json({ error: "معرف التوقع غير صحيح" });
    return;
  }

  const userId = parseInt(req.user.id, 10);

  const [pred] = await db
    .select()
    .from(predictionsTable)
    .where(and(eq(predictionsTable.id, predId), eq(predictionsTable.userId, userId)));

  if (!pred) {
    res.status(404).json({ error: "التوقع غير موجود" });
    return;
  }

  // Check deadline
  const allMatches = await getMatchesMerged();
  const match = allMatches.find((m) => m.id === pred.matchId) ?? matchStub(pred.matchId);

  if (isDeadlinePassed(match.scheduledAt)) {
    res.status(400).json({ error: "انتهى وقت الحذف — التوقعات تُغلق قبل 5 دقائق من بدء المباراة" });
    return;
  }

  await db.delete(predictionsTable).where(eq(predictionsTable.id, predId));
  res.status(204).send();
});

// ─── Prediction history ────────────────────────────────────────────────────────

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
  const totalPoints = dbPredictions.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0);
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
      canEdit: !isDeadlinePassed(match.scheduledAt),
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

export default router;
