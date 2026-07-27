import React, { useState } from 'react';
import { useListNews, NewsArticle, ListNewsCategory } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Newspaper, Bell, RefreshCw, Activity, MessageSquare, LineChart, PlayCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES: { id: ListNewsCategory, label: string, icon: React.FC<any> }[] = [
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
  const { data: news, isLoading } = useListNews({ category });

  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div>
        <h1 className="text-2xl font-black tracking-tight mb-2">الأخبار</h1>
        <p className="text-sm text-muted-foreground">آخر التطورات والأخبار في عالم كرة القدم</p>
      </div>

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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div 
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="grid gap-4 md:grid-cols-2"
          >
            {news && news.length > 0 ? (
              news.map((article, i) => (
                <NewsCard key={article.id} article={article} index={i} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-muted-foreground flex flex-col items-center gap-4">
                <Newspaper className="h-12 w-12 opacity-20" />
                <p>لا توجد أخبار في هذا التصنيف حالياً</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function NewsCard({ article, index }: { article: NewsArticle, index: number }) {
  const catObj = CATEGORIES.find(c => c.id === article.category) || CATEGORIES[0];
  const Icon = catObj.icon;
  
  // Deterministic gradient based on article id
  const charCode = article.id.charCodeAt(0) || 0;
  const gradients = [
    'from-blue-900 to-slate-900',
    'from-emerald-900 to-slate-900',
    'from-rose-900 to-slate-900',
    'from-amber-900 to-slate-900',
    'from-purple-900 to-slate-900'
  ];
  const gradient = gradients[charCode % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden hover-elevate cursor-pointer group h-full flex flex-col">
        <div className={`h-40 w-full relative bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          {/* Abstract pattern overlay */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
          
          <Icon className="w-16 h-16 text-white/30 group-hover:scale-110 transition-transform duration-500" />
          
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
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">{article.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">{article.summary}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
