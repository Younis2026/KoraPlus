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
import { db, usersTable, userFavoritesTable } from "@workspace/db";
import { achievements, teams, leagues, defaultFavorites } from "../lib/mockData";
import { eq } from "drizzle-orm";

const USER_ID = 1;

async function ensureUser() {
  const existing = await db.select().from(usersTable).where(eq(usersTable.id, USER_ID));
  if (existing.length === 0) {
    await db.insert(usersTable).values({ id: USER_ID }).onConflictDoNothing();
  }
  return existing[0] ?? (await db.select().from(usersTable).where(eq(usersTable.id, USER_ID)))[0];
}

async function ensureFavorites() {
  const existing = await db.select().from(userFavoritesTable).where(eq(userFavoritesTable.userId, USER_ID));
  if (existing.length === 0) {
    await db.insert(userFavoritesTable).values({
      userId: USER_ID,
      teamIds: ["rm", "alhilal"],
      leagueIds: ["laliga", "rospl"],
    });
    return (await db.select().from(userFavoritesTable).where(eq(userFavoritesTable.userId, USER_ID)))[0];
  }
  return existing[0];
}

const router: IRouter = Router();

router.get("/profile", async (req, res): Promise<void> => {
  try {
    const user = await ensureUser();
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
  } catch {
    res.json(GetProfileResponse.parse({
      id: "1",
      name: "محمد الأحمد",
      username: "mohammed_predict",
      avatar: "",
      country: "SA",
      totalPoints: 1250,
      globalRank: 47,
      totalPredictions: 38,
      accuracy: 63,
      joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      level: "محترف",
      badgeCount: 7,
    }));
  }
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    await ensureUser();
    const [updated] = await db.update(usersTable)
      .set({
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.username && { username: parsed.data.username }),
        ...(parsed.data.avatar && { avatar: parsed.data.avatar }),
        ...(parsed.data.country && { country: parsed.data.country }),
      })
      .where(eq(usersTable.id, USER_ID))
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
  } catch {
    res.status(500).json({ error: "خطأ في تحديث الملف الشخصي" });
  }
});

router.get("/profile/achievements", async (_req, res): Promise<void> => {
  res.json(GetAchievementsResponse.parse(achievements));
});

router.get("/profile/favorites", async (_req, res): Promise<void> => {
  try {
    const fav = await ensureFavorites();
    const favTeams = (fav.teamIds ?? []).map(id => teams.find(t => t.id === id)).filter(Boolean);
    const favLeagues = (fav.leagueIds ?? []).map(id => leagues.find(l => l.id === id)).filter(Boolean);
    res.json(GetFavoritesResponse.parse({ teams: favTeams, leagues: favLeagues }));
  } catch {
    res.json(GetFavoritesResponse.parse(defaultFavorites));
  }
});

router.patch("/profile/favorites", async (req, res): Promise<void> => {
  const parsed = UpdateFavoritesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    await ensureFavorites();
    const [updated] = await db.update(userFavoritesTable)
      .set({
        ...(parsed.data.teamIds && { teamIds: parsed.data.teamIds }),
        ...(parsed.data.leagueIds && { leagueIds: parsed.data.leagueIds }),
      })
      .where(eq(userFavoritesTable.userId, USER_ID))
      .returning();

    const favTeams = (updated.teamIds ?? []).map(id => teams.find(t => t.id === id)).filter(Boolean);
    const favLeagues = (updated.leagueIds ?? []).map(id => leagues.find(l => l.id === id)).filter(Boolean);
    res.json(UpdateFavoritesResponse.parse({ teams: favTeams, leagues: favLeagues }));
  } catch {
    res.status(500).json({ error: "خطأ في تحديث المفضلة" });
  }
});

router.get("/profile/stats", async (_req, res): Promise<void> => {
  res.json(GetProfileStatsResponse.parse({
    totalPoints: 1250,
    weeklyPoints: 148,
    monthlyPoints: 560,
    totalPredictions: 38,
    wonPredictions: 24,
    accuracy: 63,
    currentStreak: 4,
    bestStreak: 8,
    globalRank: 47,
    weeklyRank: 23,
  }));
});

export default router;
