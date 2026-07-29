import React, { useState } from 'react';
import { useListMatches, Match, ListMatchesFilter } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useLocation } from 'wouter';
import { TeamLogo } from '@/components/team-logo';
import { formatTime, formatDate } from '@/lib/utils';
import { Calendar, ChevronLeft, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Static leagues list (shown in the Leagues tab)
const LEAGUES = [
  { id: "ucl",        name: "دوري أبطال أوروبا",    flag: "🏆", country: "أوروبا" },
  { id: "laliga",     name: "الدوري الإسباني",       flag: "🇪🇸", country: "إسبانيا" },
  { id: "pl",         name: "الدوري الإنجليزي",      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "إنجلترا" },
  { id: "bundesliga", name: "الدوري الألماني",       flag: "🇩🇪", country: "ألمانيا" },
  { id: "seriea",     name: "الدوري الإيطالي",       flag: "🇮🇹", country: "إيطاليا" },
  { id: "ligue1",     name: "الدوري الفرنسي",        flag: "🇫🇷", country: "فرنسا" },
  { id: "rospl",      name: "دوري روشن السعودي",     flag: "🇸🇦", country: "السعودية" },
  { id: "uaepro",     name: "دوري الخليج العربي",    flag: "🇦🇪", country: "الإمارات" },
  { id: "ucl_q",      name: "دوري أبطال آسيا",       flag: "🌏", country: "آسيا" },
  { id: "concacaf",   name: "كأس العالم للأندية",    flag: "🌍", country: "دولي" },
];

export default function MatchesPage() {
  const [filter, setFilter] = useState<ListMatchesFilter>('today');
  const { data: matches, isLoading } = useListMatches(
    { filter },
    { query: { enabled: filter !== 'by_league' } as never },
  );

  const showLeagues = filter === 'by_league';

  return (
    <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 pb-20">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">المباريات</h1>
      </div>

      <Tabs defaultValue="today" value={filter} onValueChange={(v) => setFilter(v as ListMatchesFilter)} dir="rtl">
        <TabsList className="w-full bg-muted/50 p-1 mb-6 flex overflow-x-auto hide-scrollbar">
          <TabsTrigger value="today"    className="flex-1 min-w-[72px]">اليوم</TabsTrigger>
          <TabsTrigger value="live"     className="flex-1 min-w-[72px] data-[state=active]:text-red-500">مباشر</TabsTrigger>
          <TabsTrigger value="tomorrow" className="flex-1 min-w-[72px]">غداً</TabsTrigger>
          <TabsTrigger value="past"     className="flex-1 min-w-[72px]">نتائج</TabsTrigger>
          <TabsTrigger value="by_league" className="flex-1 min-w-[72px]">دوريات</TabsTrigger>
        </TabsList>
      </Tabs>

      {showLeagues ? (
        <LeaguesList />
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {matches && matches.length > 0 ? (
              matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
            ) : (
              <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
                <Calendar className="h-12 w-12 opacity-20" />
                <p>
                  {filter === 'past'
                    ? 'لا توجد نتائج متاحة حالياً'
                    : 'لا توجد مباريات متاحة لهذا التصنيف'}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Leagues List ──────────────────────────────────────────────────────────────

function LeaguesList() {
  const [, setLocation] = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 gap-3"
    >
      {LEAGUES.map((league, i) => (
        <motion.div
          key={league.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <button
            onClick={() => setLocation(`/leagues/${league.id}`)}
            className="w-full text-right"
          >
            <Card className="hover-elevate cursor-pointer hover:border-primary/40 transition-colors group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                  {league.flag}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold group-hover:text-primary transition-colors">{league.name}</p>
                  <p className="text-xs text-muted-foreground">{league.country}</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </CardContent>
            </Card>
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Match Card ────────────────────────────────────────────────────────────────

function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <Link href={`/matches/${match.id}`}>
      <Card className="hover-elevate cursor-pointer overflow-hidden border-transparent hover:border-border transition-all group">
        {isLive && <div className="h-1 w-full bg-red-500 animate-pulse"></div>}
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-medium border-b border-border/40 pb-2">
            <span>{match.league.name}</span>
            {isLive ? (
              <span className="text-red-500 font-bold animate-pulse">{match.minute}'</span>
            ) : isFinished ? (
              <span>انتهت</span>
            ) : (
              <span>{formatDate(match.scheduledAt)}</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 w-[35%]">
              <TeamLogo name={match.homeTeam.name} className="w-10 h-10 shadow-sm" />
              <span className="font-bold text-sm truncate">{match.homeTeam.name}</span>
            </div>

            <div className="flex-1 flex justify-center">
              {isLive || isFinished ? (
                <div className="text-2xl font-black tabular-nums tracking-tighter flex items-center gap-3">
                  <span className={match.homeScore! > (match.awayScore || 0) ? 'text-foreground' : 'text-muted-foreground'}>{match.homeScore}</span>
                  <span className="text-muted-foreground/40 text-sm">-</span>
                  <span className={(match.awayScore || 0) > match.homeScore! ? 'text-foreground' : 'text-muted-foreground'}>{match.awayScore}</span>
                </div>
              ) : (
                <div className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-lg text-sm font-bold tabular-nums">
                  {formatTime(match.scheduledAt)}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 w-[35%] text-left">
              <span className="font-bold text-sm truncate">{match.awayTeam.name}</span>
              <TeamLogo name={match.awayTeam.name} className="w-10 h-10 shadow-sm" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
