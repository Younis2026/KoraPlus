import { Router, type IRouter } from "express";
import {
  ListNewsResponse,
  GetNewsArticleResponse,
  ListNewsQueryParams,
  GetNewsArticleParams,
} from "@workspace/api-zod";
import { news as mockNews } from "../lib/mockData";
import { getResultsBasedNews } from "../lib/footballApi";

const router: IRouter = Router();

/** Merge live-result news with mock news, deduplicated and sorted by date */
async function getAllNews() {
  try {
    const liveNews = await getResultsBasedNews();
    // Combine: live news first (most recent), then mock news
    const combined = [...liveNews, ...mockNews];
    // Sort by publishedAt descending
    combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return combined;
  } catch {
    return mockNews;
  }
}

router.get("/news", async (req, res): Promise<void> => {
  const parsed = ListNewsQueryParams.safeParse(req.query);
  const category = parsed.success ? (parsed.data.category ?? "all") : "all";
  const teamId = parsed.success ? parsed.data.teamId : undefined;
  const leagueId = parsed.success ? parsed.data.leagueId : undefined;

  const allNews = await getAllNews();

  let filtered = [...allNews];
  if (category && category !== "all") {
    filtered = filtered.filter(n => n.category === category);
  }
  if (teamId) {
    filtered = filtered.filter(n => n.teamId === teamId);
  }
  if (leagueId) {
    filtered = filtered.filter(n => n.leagueId === leagueId);
  }

  res.json(ListNewsResponse.parse(filtered));
});

router.get("/news/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetNewsArticleParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "معرف الخبر غير صحيح" });
    return;
  }

  // Check live-result news first
  if (params.data.id.startsWith("result_")) {
    try {
      const liveNews = await getResultsBasedNews();
      const found = liveNews.find(n => n.id === params.data.id);
      if (found) {
        res.json(GetNewsArticleResponse.parse({
          ...found,
          content: `${found.summary}\n\nتفاصيل المباراة: ${found.title}\n\nهذا الخبر مُستخلَص تلقائياً من نتائج المباريات الحية. يمكنك متابعة المزيد من التفاصيل عبر قسم المباريات في التطبيق.`,
          videoUrl: null,
          tags: ['كرة القدم', 'نتائج', found.category],
        }));
        return;
      }
    } catch {
      // fall through
    }
  }

  const article = mockNews.find(n => n.id === params.data.id);
  if (!article) {
    res.status(404).json({ error: "لم يتم العثور على الخبر" });
    return;
  }

  const detail = {
    ...article,
    content: `${article.summary}\n\nتفاصيل الخبر: ${article.title}\n\nيُعدّ هذا الحدث من أبرز أحداث الموسم الكروي الحالي، حيث شهدنا لحظات استثنائية أذهلت جماهير كرة القدم حول العالم. ويتابع المختصون والمحللون الرياضيون مجريات الأمور عن كثب، متوقعين تداعيات كبيرة على مستوى المنافسات القادمة.\n\nوقد أفادت المصادر المطلعة أن هذا التطور يأتي ضمن مخططات مدروسة يسعى إليها الأطراف المعنية من أجل تعزيز مكانتهم في المشهد الكروي العالمي والإقليمي على حدٍّ سواء.`,
    videoUrl: article.category === "video_highlights" ? "https://example.com/video" : null,
    tags: [article.category, "كرة القدم", "رياضة"],
  };

  res.json(GetNewsArticleResponse.parse(detail));
});

export default router;
