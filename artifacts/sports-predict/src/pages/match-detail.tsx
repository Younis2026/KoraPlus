import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useGetMatch, useGetMatchPoll, MatchDetail, MatchEvent } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TeamLogo } from '@/components/team-logo';
import { formatTime, formatDate, cn } from '@/lib/utils';
import { ChevronRight, Shield, Activity, Users, Flame, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MatchDetailPage() {
  const params = useParams();
  const id = params.id!;
  
  const { data: match, isLoading } = useGetMatch(id, { query: { enabled: !!id, queryKey: ['match', id] } });
  
  if (isLoading) return <MatchDetailSkeleton />;
  if (!match) return <div className="p-8 text-center">المباراة غير موجودة</div>;

  const isLive = match.status === 'live';

  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      
      {/* Header Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="rounded-full shrink-0 hover:bg-muted">
          <Link href="/matches">
            <ChevronRight className="h-6 w-6" />
          </Link>
        </Button>
        <div className="flex-1 text-center font-bold text-sm text-muted-foreground truncate">
          {match.league.name}
        </div>
        <div className="w-10"></div>
      </div>

      {/* Match Scoreboard */}
      <div className="relative pt-6 pb-10 px-4 overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent z-0"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-muted/50 px-4 py-1 rounded-full text-xs font-semibold mb-6 border border-border">
            {isLive ? (
              <span className="text-red-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>مباشر • {match.minute}'</span>
            ) : match.status === 'finished' ? (
              'انتهت'
            ) : (
              formatDate(match.scheduledAt)
            )}
          </div>
          
          <div className="flex items-center justify-between w-full max-w-lg">
            <div className="flex flex-col items-center gap-3 w-1/3">
              <TeamLogo name={match.homeTeam.name} className="w-20 h-20 shadow-xl border-4 border-background" />
              <span className="font-black text-lg text-center leading-tight">{match.homeTeam.name}</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center">
              {isLive || match.status === 'finished' ? (
                <div className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter drop-shadow-lg text-primary">
                  {match.homeScore}<span className="text-muted-foreground/30 text-4xl mx-2">-</span>{match.awayScore}
                </div>
              ) : (
                <div className="text-3xl font-black text-muted-foreground tabular-nums">
                  {formatTime(match.scheduledAt)}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 w-1/3">
              <TeamLogo name={match.awayTeam.name} className="w-20 h-20 shadow-xl border-4 border-background" />
              <span className="font-black text-lg text-center leading-tight">{match.awayTeam.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 mt-2">
        <Tabs defaultValue="events" dir="rtl">
          <TabsList className="w-full bg-muted/50 p-1 mb-6 flex">
            <TabsTrigger value="events" className="flex-1">الأحداث</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">الإحصائيات</TabsTrigger>
            <TabsTrigger value="lineups" className="flex-1">التشكيلة</TabsTrigger>
            <TabsTrigger value="poll" className="flex-1">توقع الجماهير</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4 outline-none">
            {match.events.length > 0 ? (
              <div className="relative border-r-2 border-border/50 mr-4 pr-6 py-2 space-y-6">
                {match.events.map((event, i) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative"
                  >
                    <div className={cn(
                      "absolute -right-[33px] top-1 w-4 h-4 rounded-full border-4 border-background shadow-sm",
                      event.type === 'goal' ? "bg-secondary" :
                      event.type === 'yellow_card' ? "bg-yellow-400" :
                      event.type === 'red_card' ? "bg-red-500" :
                      "bg-primary"
                    )}></div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-primary w-8">{event.minute}'</span>
                        <span className="font-bold text-sm bg-muted px-2 py-0.5 rounded text-muted-foreground">{event.team === 'home' ? match.homeTeam.name : match.awayTeam.name}</span>
                      </div>
                      <div className="bg-card border rounded-lg p-3 mt-1 shadow-sm flex items-center gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-sm">{event.player.name}</p>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                          {event.assistPlayer && (
                            <p className="text-xs text-primary mt-1">تمريرة: {event.assistPlayer.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Activity />} text="لا توجد أحداث حتى الآن" />
            )}
          </TabsContent>

          <TabsContent value="stats" className="outline-none">
            {match.status !== 'upcoming' ? (
              <div className="space-y-6 p-2">
                <StatBar label="الاستحواذ (%)" home={match.stats.possession.home} away={match.stats.possession.away} homeColor="bg-primary" awayColor="bg-secondary" />
                <StatBar label="التسديدات" home={match.stats.shots.home} away={match.stats.shots.away} />
                <StatBar label="تسديدات على المرمى" home={match.stats.shotsOnTarget.home} away={match.stats.shotsOnTarget.away} />
                <StatBar label="ركلات ركنية" home={match.stats.corners.home} away={match.stats.corners.away} />
                <StatBar label="أخطاء" home={match.stats.fouls.home} away={match.stats.fouls.away} />
                <StatBar label="بطاقات صفراء" home={match.stats.yellowCards.home} away={match.stats.yellowCards.away} homeColor="bg-yellow-400" awayColor="bg-yellow-400" />
                <StatBar label="بطاقات حمراء" home={match.stats.redCards.home} away={match.stats.redCards.away} homeColor="bg-red-500" awayColor="bg-red-500" />
              </div>
            ) : (
              <EmptyState icon={<Activity />} text="الإحصائيات تتوفر بعد بدء المباراة" />
            )}
          </TabsContent>

          <TabsContent value="lineups" className="outline-none">
            {match.homeLineup.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold text-center mb-4 pb-2 border-b border-primary/20 text-primary">{match.homeTeam.name}</h3>
                  <div className="space-y-2">
                    {match.homeLineup.map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-card p-2 rounded-lg border shadow-sm">
                        <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{p.number}</span>
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-center mb-4 pb-2 border-b border-secondary/20 text-secondary">{match.awayTeam.name}</h3>
                  <div className="space-y-2">
                    {match.awayLineup.map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-card p-2 rounded-lg border shadow-sm flex-row-reverse text-left">
                        <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{p.number}</span>
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon={<Shield />} text="لم يتم الإعلان عن التشكيلة بعد" />
            )}
          </TabsContent>

          <TabsContent value="poll" className="outline-none">
            <MatchPollSection matchId={id} homeName={match.homeTeam.name} awayName={match.awayTeam.name} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatBar({ label, home, away, homeColor = "bg-foreground", awayColor = "bg-muted-foreground" }: { label: string, home: number, away: number, homeColor?: string, awayColor?: string }) {
  const total = home + away || 1; // avoid div by 0
  const homePercent = (home / total) * 100;
  
  return (
    <div>
      <div className="flex justify-between items-center text-sm font-bold mb-2">
        <span>{home}</span>
        <span className="text-muted-foreground text-xs">{label}</span>
        <span>{away}</span>
      </div>
      <div className="h-2 flex rounded-full overflow-hidden bg-muted">
        <div className={cn("h-full transition-all", homeColor)} style={{ width: `${homePercent}%` }}></div>
        <div className={cn("h-full transition-all", awayColor)} style={{ width: `${100 - homePercent}%` }}></div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4 border-2 border-dashed rounded-xl">
      <div className="h-12 w-12 opacity-20 [&>svg]:w-full [&>svg]:h-full">{icon}</div>
      <p className="font-medium">{text}</p>
    </div>
  );
}

function MatchPollSection({ matchId, homeName, awayName }: { matchId: string, homeName: string, awayName: string }) {
  const { data: poll, isLoading } = useGetMatchPoll(matchId, { query: { enabled: !!matchId, queryKey: ['matchPoll', matchId] } });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (!poll) return null;

  return (
    <Card className="bg-gradient-to-br from-card to-muted border-primary/20">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          توقع الجماهير
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between text-xs mb-1 font-bold">
            <span>{homeName}</span>
            <span className="text-primary">{poll.homeWinPercent}%</span>
          </div>
          <Progress value={poll.homeWinPercent} className="h-3" />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1 font-bold">
            <span>تعادل</span>
            <span className="text-muted-foreground">{poll.drawPercent}%</span>
          </div>
          <Progress value={poll.drawPercent} className="h-3 bg-muted" indicatorClassName="bg-muted-foreground" />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1 font-bold">
            <span>{awayName}</span>
            <span className="text-secondary">{poll.awayWinPercent}%</span>
          </div>
          <Progress value={poll.awayWinPercent} className="h-3 bg-muted" indicatorClassName="bg-secondary" />
        </div>
        <p className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50">إجمالي الأصوات: {poll.totalVotes}</p>
      </CardContent>
    </Card>
  );
}

function MatchDetailSkeleton() {
  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto p-4 space-y-8">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}
