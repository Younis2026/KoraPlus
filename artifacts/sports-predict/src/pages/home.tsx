import React from 'react';
import { useGetHomeSummary, Match } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Bell, Trophy, Flame, Play, ChevronLeft, ArrowLeft } from 'lucide-react';
import { TeamLogo } from '@/components/team-logo';
import { formatTime } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { data: summary, isLoading, error } = useGetHomeSummary();

  if (isLoading) {
    return <HomeSkeleton />;
  }

  if (error || !summary) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-destructive">حدث خطأ في تحميل البيانات</h2>
        <Button className="mt-4" onClick={() => window.location.reload()}>إعادة المحاولة</Button>
      </div>
    );
  }

  const liveMatches = summary.todayMatches.filter(m => m.status === 'live');
  const upcomingMatches = summary.todayMatches.filter(m => m.status === 'upcoming');

  return (
    <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      
      {/* User Widget */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary/20 to-transparent border border-primary/20"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary font-bold">
            م ب
          </div>
          <div>
            <h2 className="font-bold">مرحباً بك!</h2>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Trophy className="h-3 w-3 text-secondary" />
              <span>النقاط: <span className="font-bold text-foreground">{summary.userPoints}</span></span>
              <span className="mx-1">•</span>
              <span>الترتيب: <span className="font-bold text-foreground">{summary.userRank}</span></span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Breaking News Banner */}
      {summary.breakingNews.length > 0 && (
        <Link href="/news">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="group relative overflow-hidden rounded-xl bg-destructive text-destructive-foreground p-4 flex items-center gap-3 cursor-pointer shadow-lg shadow-destructive/20"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-30"></div>
            <div className="bg-white/20 p-2 rounded-full shrink-0 relative z-10">
              <Bell className="h-5 w-5 animate-bounce" />
            </div>
            <div className="flex-1 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">عاجل</span>
              <p className="font-medium text-sm line-clamp-1 group-hover:underline underline-offset-4">{summary.breakingNews[0].title}</p>
            </div>
            <ChevronLeft className="h-5 w-5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </Link>
      )}

      {/* Live Matches Indicator */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-500" />
            مباشر الآن
            {liveMatches.length > 0 && (
              <Badge variant="live" className="mr-2">{liveMatches.length}</Badge>
            )}
          </h3>
          <Link href="/matches" className="text-sm text-primary flex items-center hover:underline">
            عرض الكل
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>

        {liveMatches.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x hide-scrollbar">
            {liveMatches.map((match, i) => (
              <motion.div 
                key={match.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="snap-center shrink-0 w-[280px]"
              >
                <Link href={`/matches/${match.id}`}>
                  <Card className="hover-elevate cursor-pointer border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/50 via-red-500 to-red-500/50"></div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center text-xs mb-3 text-muted-foreground font-medium">
                        <span>{match.league.name}</span>
                        <span className="text-red-500 animate-pulse font-bold">{match.minute}'</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col items-center gap-1 w-1/3">
                          <TeamLogo name={match.homeTeam.name} className="w-12 h-12 text-sm" />
                          <span className="text-xs font-bold text-center truncate w-full">{match.homeTeam.name}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center">
                          <div className="text-3xl font-black tracking-tighter tabular-nums drop-shadow-md">
                            {match.homeScore} - {match.awayScore}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 w-1/3">
                          <TeamLogo name={match.awayTeam.name} className="w-12 h-12 text-sm" />
                          <span className="text-xs font-bold text-center truncate w-full">{match.awayTeam.name}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Play className="h-8 w-8 opacity-20" />
              <p>لا توجد مباريات مباشرة حالياً</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Today's Matches */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">مباريات اليوم</h3>
        </div>
        <div className="space-y-3">
          {upcomingMatches.slice(0, 3).map((match, i) => (
            <motion.div 
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
            >
              <Link href={`/matches/${match.id}`}>
                <Card className="hover-elevate cursor-pointer group">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 w-[40%]">
                      <TeamLogo name={match.homeTeam.name} className="w-8 h-8" />
                      <span className="font-semibold text-sm truncate">{match.homeTeam.name}</span>
                    </div>
                    <div className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-lg text-sm font-bold w-[20%] text-center tabular-nums">
                      {formatTime(match.scheduledAt)}
                    </div>
                    <div className="flex items-center gap-3 w-[40%] justify-end text-left">
                      <span className="font-semibold text-sm truncate">{match.awayTeam.name}</span>
                      <TeamLogo name={match.awayTeam.name} className="w-8 h-8" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
          {upcomingMatches.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">لا توجد مباريات قادمة اليوم</p>
          )}
        </div>
      </section>

      {/* Top 3 Leaderboard */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">نخبة التوقعات</h3>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {summary.topLeaderboard.map((entry, index) => (
              <div 
                key={entry.user.id} 
                className={`flex items-center gap-4 p-4 border-b last:border-0 ${
                  index === 0 ? 'bg-gradient-to-r from-secondary/10 to-transparent' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  index === 0 ? 'bg-secondary text-secondary-foreground shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                  index === 1 ? 'bg-slate-300 text-slate-800' :
                  'bg-amber-700/80 text-white'
                }`}>
                  {entry.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                  <img src={entry.user.avatar || undefined} alt={entry.user.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{entry.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{entry.user.country}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="font-bold text-secondary">{entry.points}</p>
                  <p className="text-[10px] text-muted-foreground">نقطة</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      
      {/* Bottom padding for mobile nav */}
      <div className="h-4"></div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-4 space-y-8">
      <Skeleton className="h-20 rounded-2xl w-full" />
      <Skeleton className="h-16 rounded-xl w-full" />
      
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-4 overflow-x-hidden">
          <Skeleton className="h-32 w-[280px] rounded-xl shrink-0" />
          <Skeleton className="h-32 w-[280px] rounded-xl shrink-0" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}
