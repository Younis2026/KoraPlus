import { Router, type IRouter } from "express";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  GetAchievementsResponse,
  GetFavoritesResponse,
  UpdateFavoritesBody,
  UpdateFavoritesResponse,
  GetProfileStatsResponse,
} from "@workspace/api-zod";
import { db, usersTable, userFavoritesTable, predictionsTable } from "@workspace/db";
import { achievements, teams, leagues, defaultFavorites } from "../lib/mockData";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function ensureUserById(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user;
}

async function ensureFavoritesForUser(userId: number) {
  const existing = await db.select().from(userFavoritesTable).where(eq(userFavoritesTable.userId, userId));
  if (existing.length === 0) {
    await db.insert(userFavoritesTable).values({
      userId,
      teamIds: ["rm", "alhilal"],
      leagueIds: ["laliga", "rospl"],
    });
    return (await db.select().from(userFavoritesTable).where(eq(userFavoritesTable.userId, userId)))[0];
  }
  return existing[0];
}

router.get("/profile", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return;
  }

  const userId = parseInt(req.user.id, 10);
  const user = await ensureUserById(userId);
  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }

  res.json(GetProfileResponse.parse({
    id: String(user.id),
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    country: user.country,
    totalPoints: user.totalPoints,
    globalRank: user.globalRank,
    totalPredictions: user.totalPredictions,
    accuracy: user.accuracy,
    joinedAt: user.createdAt.toISOString(),
    level: user.level,
    badgeCount: user.badgeCount,
  }));
});

router.patch("/profile", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return;
  }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = parseInt(req.user.id, 10);

  const [updated] = await db.update(usersTable)
    .set({
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.username && { username: parsed.data.username }),
      ...(parsed.data.avatar && { avatar: parsed.data.avatar }),
      ...(parsed.data.country && { country: parsed.data.country }),
    })
    .where(eq(usersTable.id, userId))
    .returning();

  res.json(UpdateProfileResponse.parse({
    id: String(updated.id),
    name: updated.name,
    username: updated.username,
    avatar: updated.avatar,
    country: updated.country,
    totalPoints: updated.totalPoints,
    globalRank: updated.globalRank,
    totalPredictions: updated.totalPredictions,
    accuracy: updated.accuracy,
    joinedAt: updated.createdAt.toISOString(),
    level: updated.level,
    badgeCount: updated.badgeCount,
  }));
});

router.get("/profile/achievements", async (_req, res): Promise<void> => {
  res.json(GetAchievementsResponse.parse(achievements));
});

router.get("/profile/favorites", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.json(GetFavoritesResponse.parse(defaultFavorites));
    return;
  }

  const userId = parseInt(req.user.id, 10);
  try {
    const fav = await ensureFavoritesForUser(userId);
    const favTeams = (fav.teamIds ?? []).map(id => teams.find(t => t.id === id)).filter(Boolean);
    const favLeagues = (fav.leagueIds ?? []).map(id => leagues.find(l => l.id === id)).filter(Boolean);
    res.json(GetFavoritesResponse.parse({ teams: favTeams, leagues: favLeagues }));
  } catch {
    res.json(GetFavoritesResponse.parse(defaultFavorites));
  }
});

router.patch("/profile/favorites", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return;
  }

  const parsed = UpdateFavoritesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = parseInt(req.user.id, 10);

  try {
    await ensureFavoritesForUser(userId);
    const [updated] = await db.update(userFavoritesTable)
      .set({
        ...(parsed.data.teamIds && { teamIds: parsed.data.teamIds }),
        ...(parsed.data.leagueIds && { leagueIds: parsed.data.leagueIds }),
      })
      .where(eq(userFavoritesTable.userId, userId))
      .returning();

    const favTeams = (updated.teamIds ?? []).map(id => teams.find(t => t.id === id)).filter(Boolean);
    const favLeagues = (updated.leagueIds ?? []).map(id => leagues.find(l => l.id === id)).filter(Boolean);
    res.json(UpdateFavoritesResponse.parse({ teams: favTeams, leagues: favLeagues }));
  } catch {
    res.status(500).json({ error: "خطأ في تحديث المفضلة" });
  }
});

router.get("/profile/stats", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.json(GetProfileStatsResponse.parse({
      totalPoints: 0,
      weeklyPoints: 0,
      monthlyPoints: 0,
      totalPredictions: 0,
      wonPredictions: 0,
      accuracy: 0,
      currentStreak: 0,
      bestStreak: 0,
      globalRank: 9999,
      weeklyRank: 9999,
    }));
    return;
  }

  const userId = parseInt(req.user.id, 10);
  const user = await ensureUserById(userId);

  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }

  // Compute from real prediction data
  const userPredictions = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.userId, userId));

  const total = userPredictions.length;
  const won = userPredictions.filter(p => p.status === "won").length;
  const totalPoints = userPredictions.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0);
  const accuracy = total > 0 ? Math.round((won / total) * 100) : 0;

  res.json(GetProfileStatsResponse.parse({
    totalPoints: user.totalPoints,
    weeklyPoints: 0,
    monthlyPoints: 0,
    totalPredictions: total,
    wonPredictions: won,
    accuracy,
    currentStreak: 0,
    bestStreak: 0,
    globalRank: user.globalRank,
    weeklyRank: user.globalRank,
  }));
});

export default router;
