import { Router, type IRouter } from "express";
import {
  ListNewsResponse,
  GetNewsArticleResponse,
  ListNewsQueryParams,
  GetNewsArticleParams,
  BookmarkArticleResponse,
  UnbookmarkArticleResponse,
} from "@workspace/api-zod";
import { db, adminArticlesTable, articleBookmarksTable } from "@workspace/db";
import { eq, desc, ilike, and, or, sql } from "drizzle-orm";
import { getResultsBasedNews } from "../lib/footballApi";

const router: IRouter = Router();

/** Serialize a DB article row to the API shape */
function serializeArticle(
  row: typeof adminArticlesTable.$inferSelect,
  isBookmarked = false,
) {
  return {
    id: String(row.id),
    title: row.title,
    subtitle: row.subtitle,
    summary: row.summary,
    author: row.author,
    content: row.content,
    category: row.category as "breaking" | "transfers" | "injuries" | "press_conference" | "analysis" | "video_highlights",
    imageUrl: row.imageUrl,
    publishedAt: row.publishedAt.toISOString(),
    teamId: row.teamId ?? null,
    leagueId: row.leagueId ?? null,
    isBreaking: row.isBreaking,
    isFeatured: row.isFeatured,
    readTimeMinutes: row.readTimeMinutes,
    viewCount: row.viewCount,
    tags: row.tags,
    videoUrl: null as string | null,
    isBookmarked,
  };
}

/** Convert live-result news to the full NewsArticle shape */
function serializeLiveArticle(
  article: Awaited<ReturnType<typeof getResultsBasedNews>>[number],
  isBookmarked = false,
) {
  return {
    id: article.id,
    title: article.title,
    subtitle: "",
    summary: article.summary,
    author: "نتائج مباشرة",
    content: article.summary,
    category: article.category as "breaking" | "transfers" | "injuries" | "press_conference" | "analysis" | "video_highlights",
    imageUrl: article.imageUrl,
    publishedAt: article.publishedAt,
    teamId: article.teamId ?? null,
    leagueId: article.leagueId ?? null,
    isBreaking: article.isBreaking,
    isFeatured: false,
    readTimeMinutes: article.readTimeMinutes,
    viewCount: 0,
    tags: ["كرة القدم", "نتائج"],
    videoUrl: null as string | null,
    isBookmarked,
  };
}

router.get("/news", async (req, res): Promise<void> => {
  const parsed = ListNewsQueryParams.safeParse(req.query);
  const category = parsed.success ? (parsed.data.category ?? "all") : "all";
  const search = parsed.success ? (parsed.data as { search?: string }).search : undefined;
  const teamId = parsed.success ? parsed.data.teamId : undefined;
  const leagueId = parsed.success ? parsed.data.leagueId : undefined;

  // Get bookmark IDs for authenticated user
  let bookmarkedIds = new Set<string>();
  if (req.isAuthenticated()) {
    const bookmarks = await db
      .select({ articleId: articleBookmarksTable.articleId })
      .from(articleBookmarksTable)
      .where(eq(articleBookmarksTable.userId, parseInt(req.user.id, 10)));
    bookmarkedIds = new Set(bookmarks.map((b) => b.articleId));
  }

  // Build DB query conditions
  const conditions = [eq(adminArticlesTable.isPublished, true)];
  if (category && category !== "all") {
    conditions.push(eq(adminArticlesTable.category, category));
  }
  if (teamId) conditions.push(eq(adminArticlesTable.teamId, teamId));
  if (leagueId) conditions.push(eq(adminArticlesTable.leagueId, leagueId));
  if (search) {
    conditions.push(
      or(
        ilike(adminArticlesTable.title, `%${search}%`),
        ilike(adminArticlesTable.summary, `%${search}%`),
      )!,
    );
  }

  const dbArticles = await db
    .select()
    .from(adminArticlesTable)
    .where(conditions.length === 1 ? conditions[0] : and(...conditions))
    .orderBy(desc(adminArticlesTable.publishedAt))
    .limit(50);

  const dbSerialized = dbArticles.map((a) => serializeArticle(a, bookmarkedIds.has(String(a.id))));

  // Also include live result news (only if no search/category filter or if matches)
  let liveArticles: ReturnType<typeof serializeLiveArticle>[] = [];
  if (!search && (!category || category === "all" || category === "breaking")) {
    try {
      const live = await getResultsBasedNews();
      const filtered = category === "breaking"
        ? live.filter((n) => n.isBreaking)
        : live;
      liveArticles = filtered.map((a) =>
        serializeLiveArticle(a, bookmarkedIds.has(a.id)),
      );
    } catch {
      // ignore
    }
  }

  // Merge: DB articles first, then live (avoid duplicates)
  const allArticles = [...dbSerialized, ...liveArticles];
  allArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  res.json(ListNewsResponse.parse(allArticles));
});

router.get("/news/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetNewsArticleParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "معرف الخبر غير صحيح" });
    return;
  }

  const articleId = params.data.id;

  // Check live-result news first
  if (articleId.startsWith("result_")) {
    try {
      const liveNews = await getResultsBasedNews();
      const found = liveNews.find((n) => n.id === articleId);
      if (found) {
        let isBookmarked = false;
        if (req.isAuthenticated()) {
          const [bm] = await db
            .select()
            .from(articleBookmarksTable)
            .where(
              and(
                eq(articleBookmarksTable.userId, parseInt(req.user.id, 10)),
                eq(articleBookmarksTable.articleId, articleId),
              ),
            );
          isBookmarked = !!bm;
        }
        res.json(
          GetNewsArticleResponse.parse({
            ...serializeLiveArticle(found, isBookmarked),
            content: `${found.summary}\n\nتفاصيل المباراة: ${found.title}\n\nهذا الخبر مُستخلَص تلقائياً من نتائج المباريات الحية.`,
            tags: ["كرة القدم", "نتائج", found.category],
          }),
        );
        return;
      }
    } catch {
      // fall through
    }
  }

  // Fetch from DB
  const numericId = parseInt(articleId, 10);
  if (isNaN(numericId)) {
    res.status(404).json({ error: "لم يتم العثور على الخبر" });
    return;
  }

  const [article] = await db
    .select()
    .from(adminArticlesTable)
    .where(and(eq(adminArticlesTable.id, numericId), eq(adminArticlesTable.isPublished, true)));

  if (!article) {
    res.status(404).json({ error: "لم يتم العثور على الخبر" });
    return;
  }

  // Increment view count
  await db
    .update(adminArticlesTable)
    .set({ viewCount: sql`${adminArticlesTable.viewCount} + 1` })
    .where(eq(adminArticlesTable.id, numericId));

  let isBookmarked = false;
  if (req.isAuthenticated()) {
    const [bm] = await db
      .select()
      .from(articleBookmarksTable)
      .where(
        and(
          eq(articleBookmarksTable.userId, parseInt(req.user.id, 10)),
          eq(articleBookmarksTable.articleId, String(numericId)),
        ),
      );
    isBookmarked = !!bm;
  }

  res.json(
    GetNewsArticleResponse.parse(
      serializeArticle({ ...article, viewCount: article.viewCount + 1 }, isBookmarked),
    ),
  );
});

// ─── Bookmark endpoints ────────────────────────────────────────────────────────

router.post("/news/:id/bookmark", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول للحفظ" });
    return;
  }
  const articleId = req.params.id;
  const userId = parseInt(req.user.id, 10);

  await db
    .insert(articleBookmarksTable)
    .values({ userId, articleId })
    .onConflictDoNothing();

  res.json(BookmarkArticleResponse.parse({ bookmarked: true, articleId }));
});

router.delete("/news/:id/bookmark", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return;
  }
  const articleId = req.params.id;
  const userId = parseInt(req.user.id, 10);

  await db
    .delete(articleBookmarksTable)
    .where(
      and(
        eq(articleBookmarksTable.userId, userId),
        eq(articleBookmarksTable.articleId, articleId),
      ),
    );

  res.json(UnbookmarkArticleResponse.parse({ bookmarked: false, articleId }));
});

export default router;
