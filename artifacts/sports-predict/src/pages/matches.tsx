import React, { useState } from 'react';
import { useListMatches, Match, ListMatchesFilter } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import { TeamLogo } from '@/components/team-logo';
import { formatTime, formatDate } from '@/lib/utils';
import { Calendar, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MatchesPage() {
  const [filter, setFilter] = useState<ListMatchesFilter>('today');
  const { data: matches, isLoading } = useListMatches({ filter });

  return (
    <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-4 space-y-6 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">المباريات</h1>
        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary cursor-pointer hover:bg-secondary/20 transition-colors">
          <Search className="h-5 w-5" />
        </div>
      </div>

      <Tabs defaultValue="today" value={filter} onValueChange={(v) => setFilter(v as ListMatchesFilter)} dir="rtl">
        <TabsList className="w-full bg-muted/50 p-1 mb-6 flex overflow-x-auto hide-scrollbar">
          <TabsTrigger value="today" className="flex-1 min-w-[80px]">اليوم</TabsTrigger>
          <TabsTrigger value="live" className="flex-1 min-w-[80px] data-[state=active]:text-red-500">مباشر</TabsTrigger>
          <TabsTrigger value="tomorrow" className="flex-1 min-w-[80px]">غداً</TabsTrigger>
          <TabsTrigger value="past" className="flex-1 min-w-[80px]">نتائج</TabsTrigger>
          <TabsTrigger value="by_league" className="flex-1 min-w-[80px]">دوريات</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
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
            className="space-y-3 pb-8"
          >
            {matches && matches.length > 0 ? (
              matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
            ) : (
              <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
                <Calendar className="h-12 w-12 opacity-20" />
                <p>لا توجد مباريات متاحة لهذا التصنيف</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live';
  
  return (
    <Link href={`/matches/${match.id}`}>
      <Card className="hover-elevate cursor-pointer overflow-hidden border-transparent hover:border-border transition-all group">
        {isLive && <div className="h-1 w-full bg-red-500 animate-pulse"></div>}
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-medium border-b border-border/40 pb-2">
            <span>{match.league.name}</span>
            {isLive ? (
              <span className="text-red-500 font-bold animate-pulse">{match.minute}'</span>
            ) : match.status === 'finished' ? (
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
              {isLive || match.status === 'finished' ? (
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
