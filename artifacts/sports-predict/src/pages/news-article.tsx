import { useRoute, Link } from 'wouter';
import { ArrowRight, Clock, User, Eye, Bookmark, BookmarkCheck, Bell, Share2, Calendar } from 'lucide-react';
import { useGetNewsArticle } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useAppAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CATEGORY_LABELS: Record<string, string> = {
  breaking: 'عاجل',
  transfers: 'انتقالات',
  injuries: 'إصابات',
  press_conference: 'مؤتمرات',
  analysis: 'تحليلات',
  video_highlights: 'هايلايتس',
};

export default function NewsArticlePage() {
  const [, params] = useRoute('/news/:id');
  const articleId = params?.id ?? '';
  const { isAuthenticated } = useAppAuth();
  const { toast } = useToast();

  const { data: article, isLoading, error } = useGetNewsArticle(
    { id: articleId },
    { query: { enabled: !!articleId } },
  );

  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (article) {
      setIsBookmarked(article.isBookmarked ?? false);
    }
  }, [article]);

  async function toggleBookmark() {
    if (!isAuthenticated) {
      toast({ title: 'سجّل دخولك لحفظ الأخبار', variant: 'destructive' });
      return;
    }
    const method = isBookmarked ? 'DELETE' : 'POST';
    try {
      const res = await fetch(`/api/news/${articleId}/bookmark`, {
        method,
        credentials: 'include',
      });
      if (res.ok) {
        setIsBookmarked(!isBookmarked);
        toast({ title: isBookmarked ? 'تم إلغاء الحفظ' : 'تم حفظ الخبر ✓' });
      }
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: article?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'تم نسخ الرابط ✓' });
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20" dir="rtl">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-20 pb-20" dir="rtl">
        <p className="text-muted-foreground">لم يتم العثور على الخبر</p>
        <Link href="/news">
          <Button variant="outline" className="mt-4">العودة للأخبار</Button>
        </Link>
      </div>
    );
  }

  const categoryLabel = CATEGORY_LABELS[article.category] || article.category;

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Back */}
      <Link href="/news" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowRight className="w-4 h-4" />
        <span>الأخبار</span>
      </Link>

      {/* Cover image / placeholder */}
      <div className="h-56 md:h-72 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-muted relative">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <span className="text-6xl">📰</span>
          </div>
        )}
        {article.isBreaking && (
          <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse shadow">
            <Bell className="w-3 h-3" /> عاجل
          </div>
        )}
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-muted">{categoryLabel}</Badge>
          {article.isFeatured && (
            <Badge variant="default" className="bg-secondary text-secondary-foreground">مميز</Badge>
          )}
        </div>

        <h1 className="text-2xl font-black leading-tight">{article.title}</h1>
        {article.subtitle && (
          <p className="text-lg text-muted-foreground font-medium">{article.subtitle}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-y border-border py-3">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {article.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(article.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {article.readTimeMinutes} دقائق قراءة
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {article.viewCount.toLocaleString('ar')} مشاهدة
          </span>
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant={isBookmarked ? 'default' : 'outline'}
          size="sm"
          onClick={toggleBookmark}
          className="gap-2 flex-1"
        >
          {isBookmarked ? (
            <><BookmarkCheck className="w-4 h-4" /> محفوظ</>
          ) : (
            <><Bookmark className="w-4 h-4" /> حفظ</>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 flex-1">
          <Share2 className="w-4 h-4" />
          مشاركة
        </Button>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="prose prose-invert prose-sm max-w-none"
      >
        <div className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {article.content}
        </div>
      </motion.div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
          {article.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
