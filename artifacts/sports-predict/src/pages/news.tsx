import React, { useState } from 'react';
import { useListNews, NewsArticle, ListNewsCategory } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { Newspaper, Bell, RefreshCw, Activity, MessageSquare, LineChart, PlayCircle, Clock, Search, Bookmark, BookmarkCheck, Eye, User, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useAppAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES: { id: ListNewsCategory, label: string, icon: React.FC<{ className?: string }> }[] = [
  { id: 'all', label: 'الكل', icon: Newspaper },
  { id: 'breaking', label: 'عاجل', icon: Bell },
  { id: 'transfers', label: 'انتقالات', icon: RefreshCw },
  { id: 'injuries', label: 'إصابات', icon: Activity },
  { id: 'press_conference', label: 'مؤتمرات', icon: MessageSquare },
  { id: 'analysis', label: 'تحليلات', icon: LineChart },
  { id: 'video_highlights', label: 'هايلايتس', icon: PlayCircle },
];

export default function NewsPage() {
  const [category, setCategory] = useState<ListNewsCategory>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data: news, isLoading } = useListNews({ category, search: search || undefined });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    if (searchInput.trim()) setCategory('all');
  }

  function clearSearch() {
    setSearch('');
    setSearchInput('');
  }

  const featured = news?.find((a) => a.isFeatured);
  const regularNews = news?.filter((a) => !a.isFeatured || a.id !== featured?.id) ?? [];

  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div>
        <h1 className="text-2xl font-black tracking-tight mb-2">الأخبار</h1>
        <p className="text-sm text-muted-foreground">آخر التطورات والأخبار في عالم كرة القدم</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ابحث في الأخبار..."
            className="pr-9"
          />
        </div>
        <Button type="submit" variant="default" className="shrink-0">بحث</Button>
        {search && (
          <Button type="button" variant="outline" onClick={clearSearch} className="shrink-0">
            مسح
          </Button>
        )}
      </form>

      {search && (
        <p className="text-sm text-muted-foreground">
          نتائج البحث عن: <span className="font-bold text-foreground">"{search}"</span> — {news?.length ?? 0} نتيجة
        </p>
      )}

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar snap-x">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div 
            key={category + search}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Featured article */}
            {featured && !search && (
              <FeaturedNewsCard article={featured} />
            )}

            {/* Regular news grid */}
            {regularNews.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {regularNews.map((article, i) => (
                  <NewsCard key={article.id} article={article} index={i} />
                ))}
              </div>
            ) : !featured ? (
              <div className="col-span-full text-center py-20 text-muted-foreground flex flex-col items-center gap-4">
                <Newspaper className="h-12 w-12 opacity-20" />
                <p>{search ? 'لا توجد نتائج لبحثك' : 'لا توجد أخبار في هذا التصنيف حالياً'}</p>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function FeaturedNewsCard({ article }: { article: NewsArticle }) {
  const catObj = CATEGORIES.find(c => c.id === article.category) || CATEGORIES[0];
  const { isAuthenticated } = useAppAuth();
  const { toast } = useToast();
  const [bookmarked, setBookmarked] = useState(article.isBookmarked ?? false);

  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({ title: 'سجّل دخولك لحفظ الأخبار', variant: 'destructive' });
      return;
    }
    const method = bookmarked ? 'DELETE' : 'POST';
    try {
      const res = await fetch(`/api/news/${article.id}/bookmark`, { method, credentials: 'include' });
      if (res.ok) {
        setBookmarked(!bookmarked);
        toast({ title: bookmarked ? 'تم إلغاء الحفظ' : 'تم حفظ الخبر ✓' });
      }
    } catch { /* ignore */ }
  }

  const gradients = ['from-blue-900 to-slate-900', 'from-emerald-900 to-slate-900', 'from-rose-900 to-slate-900'];
  const gradient = gradients[(article.id.charCodeAt(0) || 0) % gradients.length];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Link href={`/news/${article.id}`}>
        <Card className="overflow-hidden hover-elevate cursor-pointer group relative">
          <div className={`h-52 w-full relative bg-gradient-to-br ${gradient}`}>
            {article.imageUrl ? (
              <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute top-3 right-3 flex gap-2">
              <Badge className="bg-secondary text-secondary-foreground text-xs">
                <Star className="w-3 h-3 mr-1" /> مميز
              </Badge>
              {article.isBreaking && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  <Bell className="w-3 h-3 mr-1" /> عاجل
                </Badge>
              )}
            </div>

            <button
              onClick={handleBookmark}
              className="absolute top-3 left-3 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors"
            >
              {bookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-primary" />
              ) : (
                <Bookmark className="w-4 h-4 text-white" />
              )}
            </button>

            <div className="absolute bottom-0 right-0 left-0 p-4">
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[10px] mb-2">
                {catObj.label}
              </Badge>
              <h2 className="font-black text-xl text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
              </h2>
              {article.subtitle && (
                <p className="text-white/70 text-sm mt-1 line-clamp-1">{article.subtitle}</p>
              )}
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{article.author}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTimeMinutes} د</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.viewCount.toLocaleString('ar')}</span>
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function NewsCard({ article, index }: { article: NewsArticle, index: number }) {
  const catObj = CATEGORIES.find(c => c.id === article.category) || CATEGORIES[0];
  const Icon = catObj.icon;
  const { isAuthenticated } = useAppAuth();
  const { toast } = useToast();
  const [bookmarked, setBookmarked] = useState(article.isBookmarked ?? false);
  
  const gradients = [
    'from-blue-900 to-slate-900',
    'from-emerald-900 to-slate-900',
    'from-rose-900 to-slate-900',
    'from-amber-900 to-slate-900',
    'from-purple-900 to-slate-900'
  ];
  const gradient = gradients[(article.id.charCodeAt(0) || 0) % gradients.length];

  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({ title: 'سجّل دخولك لحفظ الأخبار', variant: 'destructive' });
      return;
    }
    const method = bookmarked ? 'DELETE' : 'POST';
    try {
      const res = await fetch(`/api/news/${article.id}/bookmark`, { method, credentials: 'include' });
      if (res.ok) {
        setBookmarked(!bookmarked);
        toast({ title: bookmarked ? 'تم إلغاء الحفظ' : 'تم حفظ الخبر ✓' });
      }
    } catch { /* ignore */ }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/news/${article.id}`}>
        <Card className="overflow-hidden hover-elevate cursor-pointer group h-full flex flex-col">
          <div className={`h-40 w-full relative bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
            {article.imageUrl ? (
              <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                <Icon className="w-16 h-16 text-white/30 group-hover:scale-110 transition-transform duration-500" />
              </>
            )}
            
            <button
              onClick={handleBookmark}
              className="absolute top-2 left-2 p-1.5 bg-black/40 hover:bg-black/70 rounded-full transition-colors"
            >
              {bookmarked ? (
                <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Bookmark className="w-3.5 h-3.5 text-white" />
              )}
            </button>
            
            {article.isBreaking && (
              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-bold flex items-center gap-1 animate-pulse">
                <Bell className="w-3 h-3" /> عاجل
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readTimeMinutes} دقائق
            </div>
          </div>
          
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px] bg-muted">{catObj.label}</Badge>
              <span className="text-[10px] text-muted-foreground">{formatDate(article.publishedAt)}</span>
            </div>
            <h3 className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">{article.title}</h3>
            {article.subtitle && (
              <p className="text-xs text-muted-foreground font-medium mb-1 line-clamp-1">{article.subtitle}</p>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">{article.summary}</p>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{article.author}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.viewCount.toLocaleString('ar')}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
