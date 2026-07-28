import { Router, type IRouter } from "express";
import {
  ListAdminMatchesResponse,
  CreateAdminMatchBody,
  CreateAdminMatchResponse,
  UpdateAdminMatchParams,
  UpdateAdminMatchBody,
  UpdateAdminMatchResponse,
  AddMatchEventParams,
  AddMatchEventBody,
  AddMatchEventResponse,
  DeleteMatchEventParams,
  SettleMatchPredictionsParams,
  SettleMatchPredictionsResponse,
  ListAdminArticlesResponse,
  CreateAdminArticleBody,
  CreateAdminArticleResponse,
  UpdateAdminArticleParams,
  UpdateAdminArticleBody,
  UpdateAdminArticleResponse,
  DeleteAdminArticleParams,
  ListPredictionConfigsResponse,
  UpdatePredictionConfigParams,
  UpdatePredictionConfigBody,
  UpdatePredictionConfigResponse,
  ListAdminUsersResponse,
  AdjustUserPointsParams,
  AdjustUserPointsBody,
  AdjustUserPointsResponse,
  ResetLeaderboardBody,
  ResetLeaderboardResponse,
  GetAdminStatsResponse,
} from "@workspace/api-zod";
import {
  db,
  adminMatchesTable,
  adminMatchEventsTable,
  adminArticlesTable,
  predictionConfigsTable,
  pointAdjustmentsTable,
  usersTable,
  predictionsTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { matches as mockMatches, news as mockNews, leaderboard } from "../lib/mockData";

const router: IRouter = Router();

// ─── Helper: serialize admin match row ────────────────────────────────────────
async function serializeAdminMatch(row: typeof adminMatchesTable.$inferSelect) {
  const events = await db
    .select()
    .from(adminMatchEventsTable)
    .where(eq(adminMatchEventsTable.matchId, String(row.id)));

  const config = await db
    .select()
    .from(predictionConfigsTable)
    .where(eq(predictionConfigsTable.matchId, String(row.id)));

  return {
    id: String(row.id),
    homeTeamName: row.homeTeamName,
    awayTeamName: row.awayTeamName,
    leagueName: row.leagueName,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status,
    homeScore: row.homeScore ?? null,
    awayScore: row.awayScore ?? null,
    minute: row.minute ?? null,
    venue: row.venue,
    predictionOpen: config[0]?.isOpen ?? row.predictionOpen,
    settledAt: row.settledAt ? row.settledAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    events: events.map(e => ({
      id: String(e.id),
      matchId: e.matchId,
      minute: e.minute,
      type: e.type,
      team: e.team,
      playerName: e.playerName,
      assistPlayerName: e.assistPlayerName ?? null,
      description: e.description,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────
router.get("/admin/stats", async (_req, res): Promise<void> => {
  const adminMatches = await db.select().from(adminMatchesTable);
  const allMatches = [...mockMatches, ...adminMatches.map(m => ({ ...m, id: "adm" + m.id, status: m.status }))];
  const articles = await db.select().from(adminArticlesTable);
  const predictions = await db.select().from(predictionsTable);
  const users = await db.select().from(usersTable);

  const liveCount = allMatches.filter(m => m.status === "live").length;
  const upcomingCount = allMatches.filter(m => m.status === "upcoming").length;
  const finishedCount = allMatches.filter(m => m.status === "finished").length;
  const pendingSettlements = predictions.filter(p => p.status === "pending" &&
    allMatches.find(m => String(m.id) === p.matchId && m.status === "finished")).length;

  res.json(GetAdminStatsResponse.parse({
    totalMatches: allMatches.length,
    liveMatches: liveCount,
    upcomingMatches: upcomingCount,
    finishedMatches: finishedCount,
    totalArticles: articles.length + mockNews.length,
    breakingNewsCount: articles.filter(a => a.isBreaking).length + mockNews.filter(n => n.isBreaking).length,
    totalPredictions: predictions.length,
    pendingSettlements,
    totalUsers: Math.max(users.length, leaderboard.length),
    activeThisWeek: Math.floor(leaderboard.length * 0.7),
  }));
});

// ─── Admin Matches ─────────────────────────────────────────────────────────────
router.get("/admin/matches", async (_req, res): Promise<void> => {
  const rows = await db.select().from(adminMatchesTable).orderBy(adminMatchesTable.scheduledAt);

  // Include mock matches as read-only entries with a "mock-" prefix
  const mockEntries = mockMatches.map(m => ({
    id: `mock-${m.id}`,
    homeTeamName: m.homeTeam.name,
    awayTeamName: m.awayTeam.name,
    leagueName: m.league.name,
    scheduledAt: m.scheduledAt,
    status: m.status,
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    minute: m.minute ?? null,
    venue: m.venue,
    predictionOpen: m.status === "upcoming",
    settledAt: null,
    createdAt: m.scheduledAt,
    events: [],
  }));

  const adminEntries = await Promise.all(rows.map(serializeAdminMatch));

  res.json(ListAdminMatchesResponse.parse([...mockEntries, ...adminEntries]));
});

router.post("/admin/matches", async (req, res): Promise<void> => {
  const parsed = CreateAdminMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(adminMatchesTable).values({
    homeTeamName: parsed.data.homeTeamName,
    awayTeamName: parsed.data.awayTeamName,
    leagueName: parsed.data.leagueName,
    scheduledAt: new Date(parsed.data.scheduledAt),
    status: parsed.data.status,
    venue: parsed.data.venue,
    predictionOpen: parsed.data.predictionOpen ?? true,
  }).returning();

  // Create default prediction config
  await db.insert(predictionConfigsTable).values({
    matchId: String(row.id),
    matchName: `${row.homeTeamName} vs ${row.awayTeamName}`,
    isOpen: parsed.data.predictionOpen ?? true,
    scorePoints: 100,
    goalscorерPoints: 75,
    momPoints: 50,
    totalGoalsPoints: 40,
  }).onConflictDoNothing();

  res.status(201).json(CreateAdminMatchResponse.parse(await serializeAdminMatch(row)));
});

router.patch("/admin/matches/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAdminMatchParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "معرف غير صحيح" });
    return;
  }

  // Mock matches cannot be edited via DB, return mock data with updates applied in memory
  if (params.data.id.startsWith("mock-")) {
    const mockId = params.data.id.replace("mock-", "");
    const mock = mockMatches.find(m => m.id === mockId);
    if (!mock) { res.status(404).json({ error: "لم يتم العثور على المباراة" }); return; }
    const body = UpdateAdminMatchBody.safeParse(req.body);
    const update = body.success ? body.data : {};
    res.json(UpdateAdminMatchResponse.parse({
      id: params.data.id,
      homeTeamName: mock.homeTeam.name,
      awayTeamName: mock.awayTeam.name,
      leagueName: mock.league.name,
      scheduledAt: mock.scheduledAt,
      status: update.status ?? mock.status,
      homeScore: update.homeScore ?? mock.homeScore ?? null,
      awayScore: update.awayScore ?? mock.awayScore ?? null,
      minute: update.minute ?? mock.minute ?? null,
      venue: mock.venue,
      predictionOpen: update.predictionOpen ?? (mock.status === "upcoming"),
      settledAt: null,
      createdAt: mock.scheduledAt,
      events: [],
    }));
    return;
  }

  const numId = parseInt(params.data.id, 10);
  const body = UpdateAdminMatchBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const updates: Partial<typeof adminMatchesTable.$inferInsert> = {};
  if (body.data.status !== undefined) updates.status = body.data.status;
  if (body.data.homeScore !== undefined) updates.homeScore = body.data.homeScore;
  if (body.data.awayScore !== undefined) updates.awayScore = body.data.awayScore;
  if (body.data.minute !== undefined) updates.minute = body.data.minute;

  const [updated] = await db.update(adminMatchesTable)
    .set(updates)
    .where(eq(adminMatchesTable.id, numId))
    .returning();

  if (!updated) { res.status(404).json({ error: "لم يتم العثور على المباراة" }); return; }

  // Update prediction config open state if provided
  if (body.data.predictionOpen !== undefined) {
    await db.update(predictionConfigsTable)
      .set({ isOpen: body.data.predictionOpen })
      .where(eq(predictionConfigsTable.matchId, String(numId)));
  }

  res.json(UpdateAdminMatchResponse.parse(await serializeAdminMatch(updated)));
});

// ─── Match Events ─────────────────────────────────────────────────────────────
router.post("/admin/matches/:id/events", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddMatchEventParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: "معرف غير صحيح" }); return; }

  const body = AddMatchEventBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [event] = await db.insert(adminMatchEventsTable).values({
    matchId: params.data.id,
    minute: body.data.minute,
    type: body.data.type,
    team: body.data.team,
    playerName: body.data.playerName,
    assistPlayerName: body.data.assistPlayerName ?? null,
    description: body.data.description,
  }).returning();

  res.status(201).json(AddMatchEventResponse.parse({
    id: String(event.id),
    matchId: event.matchId,
    minute: event.minute,
    type: event.type,
    team: event.team,
    playerName: event.playerName,
    assistPlayerName: event.assistPlayerName ?? null,
    description: event.description,
    createdAt: event.createdAt.toISOString(),
  }));
});

router.delete("/admin/matches/:id/events/:eventId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawEventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = DeleteMatchEventParams.safeParse({ id: rawId, eventId: rawEventId });
  if (!params.success) { res.status(400).json({ error: "معرف غير صحيح" }); return; }

  const eventNumId = parseInt(params.data.eventId, 10);
  await db.delete(adminMatchEventsTable).where(eq(adminMatchEventsTable.id, eventNumId));
  res.sendStatus(204);
});

// ─── Settle Predictions ──────────────────────────────────────────────────────
router.post("/admin/matches/:id/settle", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SettleMatchPredictionsParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: "معرف غير صحيح" }); return; }

  // Find all pending predictions for this match
  const pending = await db.select().from(predictionsTable)
    .where(eq(predictionsTable.matchId, params.data.id));

  const pendingCount = pending.filter(p => p.status === "pending").length;

  // Get match data (admin or mock)
  let homeScore: number | null = null;
  let awayScore: number | null = null;

  if (!params.data.id.startsWith("mock-")) {
    const numId = parseInt(params.data.id, 10);
    const [match] = await db.select().from(adminMatchesTable).where(eq(adminMatchesTable.id, numId));
    if (match) {
      homeScore = match.homeScore ?? null;
      awayScore = match.awayScore ?? null;

      // Mark match as settled
      await db.update(adminMatchesTable)
        .set({ settledAt: new Date(), status: "finished" })
        .where(eq(adminMatchesTable.id, numId));
    }
  }

  let totalPointsAwarded = 0;
  let settledCount = 0;

  // Get prediction config for point values
  const [config] = await db.select().from(predictionConfigsTable)
    .where(eq(predictionConfigsTable.matchId, params.data.id));
  const scorePoints = config?.scorePoints ?? 100;

  for (const pred of pending.filter(p => p.status === "pending")) {
    let earned = 0;
    let status = "lost";

    if (homeScore !== null && awayScore !== null &&
        pred.homeScorePrediction === homeScore && pred.awayScorePrediction === awayScore) {
      earned = scorePoints;
      status = "won";
    } else if (homeScore !== null && awayScore !== null) {
      // Check if result direction was correct (win/draw/loss)
      const actualResult = homeScore > awayScore ? "home" : homeScore < awayScore ? "away" : "draw";
      const predResult = (pred.homeScorePrediction ?? 0) > (pred.awayScorePrediction ?? 0) ? "home" :
                         (pred.homeScorePrediction ?? 0) < (pred.awayScorePrediction ?? 0) ? "away" : "draw";
      if (actualResult === predResult) {
        earned = Math.floor(scorePoints * 0.4);
        status = "partial";
      }
    }

    await db.update(predictionsTable)
      .set({ status, pointsEarned: earned })
      .where(eq(predictionsTable.id, pred.id));

    totalPointsAwarded += earned;
    settledCount++;
  }

  // Update user total points
  if (totalPointsAwarded > 0) {
    await db.update(usersTable)
      .set({ totalPoints: sql`${usersTable.totalPoints} + ${totalPointsAwarded}` })
      .where(eq(usersTable.id, 1));
  }

  res.json(SettleMatchPredictionsResponse.parse({
    matchId: params.data.id,
    settledCount,
    pointsAwarded: totalPointsAwarded,
    message: `تمت تسوية ${settledCount} توقع ومنح ${totalPointsAwarded} نقطة`,
  }));
});

// ─── Admin Articles ──────────────────────────────────────────────────────────
router.get("/admin/articles", async (_req, res): Promise<void> => {
  const rows = await db.select().from(adminArticlesTable).orderBy(adminArticlesTable.publishedAt);

  const dbArticles = rows.map(a => ({
    id: `adm-${a.id}`,
    title: a.title,
    summary: a.summary,
    content: a.content,
    category: a.category,
    imageUrl: a.imageUrl,
    teamId: a.teamId ?? null,
    leagueId: a.leagueId ?? null,
    isBreaking: a.isBreaking,
    readTimeMinutes: a.readTimeMinutes,
    publishedAt: a.publishedAt.toISOString(),
    tags: a.tags ?? [],
  }));

  res.json(ListAdminArticlesResponse.parse(dbArticles));
});

router.post("/admin/articles", async (req, res): Promise<void> => {
  const parsed = CreateAdminArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(adminArticlesTable).values({
    title: parsed.data.title,
    summary: parsed.data.summary,
    content: parsed.data.content,
    category: parsed.data.category,
    imageUrl: parsed.data.imageUrl,
    teamId: parsed.data.teamId ?? null,
    leagueId: parsed.data.leagueId ?? null,
    isBreaking: parsed.data.isBreaking,
    readTimeMinutes: parsed.data.readTimeMinutes,
    tags: parsed.data.tags ?? [],
  }).returning();

  res.status(201).json(CreateAdminArticleResponse.parse({
    id: `adm-${row.id}`,
    title: row.title,
    summary: row.summary,
    content: row.content,
    category: row.category,
    imageUrl: row.imageUrl,
    teamId: row.teamId ?? null,
    leagueId: row.leagueId ?? null,
    isBreaking: row.isBreaking,
    readTimeMinutes: row.readTimeMinutes,
    publishedAt: row.publishedAt.toISOString(),
    tags: row.tags ?? [],
  }));
});

router.patch("/admin/articles/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAdminArticleParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: "معرف غير صحيح" }); return; }

  // Strip "adm-" prefix if present
  const numId = parseInt(params.data.id.replace("adm-", ""), 10);
  const body = UpdateAdminArticleBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const updates: Partial<typeof adminArticlesTable.$inferInsert> = {};
  if (body.data.title) updates.title = body.data.title;
  if (body.data.summary) updates.summary = body.data.summary;
  if (body.data.content) updates.content = body.data.content;
  if (body.data.category) updates.category = body.data.category;
  if (body.data.imageUrl !== undefined) updates.imageUrl = body.data.imageUrl;
  if (body.data.teamId !== undefined) updates.teamId = body.data.teamId;
  if (body.data.leagueId !== undefined) updates.leagueId = body.data.leagueId;
  if (body.data.isBreaking !== undefined) updates.isBreaking = body.data.isBreaking;
  if (body.data.readTimeMinutes !== undefined) updates.readTimeMinutes = body.data.readTimeMinutes;
  if (body.data.tags !== undefined) updates.tags = body.data.tags;

  const [updated] = await db.update(adminArticlesTable)
    .set(updates)
    .where(eq(adminArticlesTable.id, numId))
    .returning();

  if (!updated) { res.status(404).json({ error: "لم يتم العثور على الخبر" }); return; }

  res.json(UpdateAdminArticleResponse.parse({
    id: `adm-${updated.id}`,
    title: updated.title,
    summary: updated.summary,
    content: updated.content,
    category: updated.category,
    imageUrl: updated.imageUrl,
    teamId: updated.teamId ?? null,
    leagueId: updated.leagueId ?? null,
    isBreaking: updated.isBreaking,
    readTimeMinutes: updated.readTimeMinutes,
    publishedAt: updated.publishedAt.toISOString(),
    tags: updated.tags ?? [],
  }));
});

router.delete("/admin/articles/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAdminArticleParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: "معرف غير صحيح" }); return; }

  const numId = parseInt(params.data.id.replace("adm-", ""), 10);
  await db.delete(adminArticlesTable).where(eq(adminArticlesTable.id, numId));
  res.sendStatus(204);
});

// ─── Prediction Configs ──────────────────────────────────────────────────────
router.get("/admin/predictions/configs", async (_req, res): Promise<void> => {
  const rows = await db.select().from(predictionConfigsTable);

  // Seed configs for mock matches if not present
  const allMatchIds = mockMatches.map(m => `mock-${m.id}`);
  const existingIds = rows.map(r => r.matchId);
  const missingIds = allMatchIds.filter(id => !existingIds.includes(id));

  if (missingIds.length > 0) {
    for (const matchId of missingIds) {
      const mockId = matchId.replace("mock-", "");
      const mock = mockMatches.find(m => m.id === mockId);
      if (mock) {
        await db.insert(predictionConfigsTable).values({
          matchId,
          matchName: `${mock.homeTeam.name} ضد ${mock.awayTeam.name}`,
          isOpen: mock.status === "upcoming",
          scorePoints: 100,
          goalscorерPoints: 75,
          momPoints: 50,
          totalGoalsPoints: 40,
        }).onConflictDoNothing();
      }
    }
    const refreshed = await db.select().from(predictionConfigsTable);
    res.json(ListPredictionConfigsResponse.parse(refreshed.map(r => ({
      ...r,
      updatedAt: r.updatedAt.toISOString(),
    }))));
    return;
  }

  res.json(ListPredictionConfigsResponse.parse(rows.map(r => ({
    ...r,
    updatedAt: r.updatedAt.toISOString(),
  }))));
});

router.patch("/admin/predictions/configs/:matchId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const params = UpdatePredictionConfigParams.safeParse({ matchId: rawId });
  if (!params.success) { res.status(400).json({ error: "معرف غير صحيح" }); return; }

  const body = UpdatePredictionConfigBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const updates: Partial<typeof predictionConfigsTable.$inferInsert> = {};
  if (body.data.isOpen !== undefined) updates.isOpen = body.data.isOpen;
  if (body.data.scorePoints !== undefined) updates.scorePoints = body.data.scorePoints;
  if (body.data.goalscorерPoints !== undefined) updates.goalscorерPoints = body.data.goalscorерPoints;
  if (body.data.momPoints !== undefined) updates.momPoints = body.data.momPoints;
  if (body.data.totalGoalsPoints !== undefined) updates.totalGoalsPoints = body.data.totalGoalsPoints;

  // Upsert
  await db.insert(predictionConfigsTable)
    .values({
      matchId: params.data.matchId,
      matchName: params.data.matchId,
      isOpen: body.data.isOpen ?? true,
      scorePoints: body.data.scorePoints ?? 100,
      goalscorерPoints: body.data.goalscorерPoints ?? 75,
      momPoints: body.data.momPoints ?? 50,
      totalGoalsPoints: body.data.totalGoalsPoints ?? 40,
    })
    .onConflictDoUpdate({ target: predictionConfigsTable.matchId, set: updates });

  const [updated] = await db.select().from(predictionConfigsTable)
    .where(eq(predictionConfigsTable.matchId, params.data.matchId));

  res.json(UpdatePredictionConfigResponse.parse({
    ...updated,
    updatedAt: updated.updatedAt.toISOString(),
  }));
});

// ─── Admin Users ─────────────────────────────────────────────────────────────
router.get("/admin/users", async (_req, res): Promise<void> => {
  // Return leaderboard mock users + DB users merged
  const dbUsers = await db.select().from(usersTable);
  const adjustments = await db.select().from(pointAdjustmentsTable);

  const userAdjMap: Record<number, number> = {};
  for (const adj of adjustments) {
    userAdjMap[adj.userId] = (userAdjMap[adj.userId] ?? 0) + adj.adjustment;
  }

  const allUsers = leaderboard.map((entry, i) => ({
    id: entry.user.id,
    name: entry.user.name,
    username: entry.user.name.replace(/\s/g, "_").toLowerCase(),
    country: entry.user.country,
    totalPoints: entry.points,
    globalRank: entry.rank,
    totalPredictions: entry.predictions,
    accuracy: entry.accuracy,
    level: entry.points > 4000 ? "أسطورة" : entry.points > 2000 ? "محترف" : "مبتدئ",
    pointAdjustment: userAdjMap[i + 1] ?? 0,
    joinedAt: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  // Add DB user if exists
  for (const u of dbUsers) {
    const existing = allUsers.find(a => a.id === String(u.id));
    if (!existing) {
      allUsers.push({
        id: String(u.id),
        name: u.name,
        username: u.username,
        country: u.country,
        totalPoints: u.totalPoints + (userAdjMap[u.id] ?? 0),
        globalRank: u.globalRank,
        totalPredictions: u.totalPredictions,
        accuracy: u.accuracy,
        level: u.level,
        pointAdjustment: userAdjMap[u.id] ?? 0,
        joinedAt: u.createdAt.toISOString(),
      });
    }
  }

  res.json(ListAdminUsersResponse.parse(allUsers));
});

router.patch("/admin/users/:id/points", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdjustUserPointsParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: "معرف غير صحيح" }); return; }

  const body = AdjustUserPointsBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const numId = parseInt(params.data.id, 10);

  // Record the adjustment
  await db.insert(pointAdjustmentsTable).values({
    userId: isNaN(numId) ? 1 : numId,
    adjustment: body.data.adjustment,
    reason: body.data.reason,
  });

  // If it's the DB user (id=1), update their points
  if (!isNaN(numId)) {
    await db.update(usersTable)
      .set({ totalPoints: sql`${usersTable.totalPoints} + ${body.data.adjustment}` })
      .where(eq(usersTable.id, numId));
  }

  // Find in leaderboard or return updated user
  const lbEntry = leaderboard.find(e => e.user.id === params.data.id);
  const baseUser = lbEntry ?? {
    rank: numId,
    user: { id: params.data.id, name: "مستخدم", avatar: "", country: "SA" },
    points: 0, predictions: 0, accuracy: 0, change: 0,
  };

  res.json(AdjustUserPointsResponse.parse({
    id: params.data.id,
    name: lbEntry ? lbEntry.user.name : "مستخدم",
    username: lbEntry ? lbEntry.user.name.replace(/\s/g, "_").toLowerCase() : "user",
    country: lbEntry ? lbEntry.user.country : "SA",
    totalPoints: baseUser.points + body.data.adjustment,
    globalRank: lbEntry ? lbEntry.rank : 99,
    totalPredictions: lbEntry ? lbEntry.predictions : 0,
    accuracy: lbEntry ? lbEntry.accuracy : 0,
    level: "محترف",
    pointAdjustment: body.data.adjustment,
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
});

// ─── Reset Leaderboard ────────────────────────────────────────────────────────
router.post("/admin/leaderboard/reset", async (req, res): Promise<void> => {
  const parsed = ResetLeaderboardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // In a real system, this would zero out weekly/monthly points
  // For demo, just log the action
  const typeLabel = parsed.data.type === "weekly" ? "الأسبوعي" : "الشهري";

  res.json(ResetLeaderboardResponse.parse({
    type: parsed.data.type,
    resetAt: new Date().toISOString(),
    message: `تمت إعادة تعيين الترتيب ${typeLabel} بنجاح`,
  }));
});

// ─── News route: also serve admin articles in the main /news feed ─────────────
// (This is handled in the news route via merging)

export default router;
