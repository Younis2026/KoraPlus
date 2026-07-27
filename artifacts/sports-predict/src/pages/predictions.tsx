import React, { useState } from 'react';
import { 
  useListAvailablePredictions, 
  useListMyPredictions, 
  useGetLeaderboard, 
  useListRewards,
  PredictionMatch,
  Prediction,
  LeaderboardEntry,
  Reward
} from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TeamLogo } from '@/components/team-logo';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Link } from 'wouter';
import { Gift, Trophy, Target, Award, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PredictionsPage() {
  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">التوقعات</h1>
          <p className="text-sm text-muted-foreground">توقع، نافس، واربح جوائز قيمة</p>
        </div>
      </div>

      <Tabs defaultValue="available" dir="rtl">
        <TabsList className="w-full bg-muted/50 p-1 flex overflow-x-auto hide-scrollbar">
          <TabsTrigger value="available" className="flex-1 min-w-[100px]">المتاحة</TabsTrigger>
          <TabsTrigger value="mine" className="flex-1 min-w-[100px]">توقعاتي</TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1 min-w-[100px]">الترتيب</TabsTrigger>
          <TabsTrigger value="rewards" className="flex-1 min-w-[100px]">الجوائز</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="available" className="m-0 space-y-4 outline-none">
            <AvailablePredictions />
          </TabsContent>

          <TabsContent value="mine" className="m-0 space-y-4 outline-none">
            <MyPredictions />
          </TabsContent>

          <TabsContent value="leaderboard" className="m-0 outline-none">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="rewards" className="m-0 outline-none">
            <Rewards />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function AvailablePredictions() {
  const { data: matches, isLoading } = useListAvailablePredictions();

  if (isLoading) return <LoadingList />;
  
  if (!matches || matches.length === 0) {
    return <EmptyState icon={<Clock />} text="لا توجد مباريات متاحة للتوقع حالياً" />;
  }

  return (
    <div className="space-y-4">
      {matches.map((pm, i) => (
        <motion.div
          key={pm.match.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="overflow-hidden border-primary/20 relative group hover:border-primary/50 transition-colors">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1">
              <Gift className="w-3 h-3" />
              {pm.pointsAvailable} نقطة
            </div>
            
            <CardContent className="p-0">
              <div className="p-4 pt-8 bg-gradient-to-br from-muted/50 to-transparent flex items-center justify-between">
                <div className="flex flex-col items-center gap-2 w-[40%]">
                  <TeamLogo name={pm.match.homeTeam.name} className="w-14 h-14 shadow-md" />
                  <span className="font-bold text-sm text-center">{pm.match.homeTeam.name}</span>
                </div>
                
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs text-muted-foreground font-bold bg-background px-3 py-1 rounded-full border shadow-sm">
                    {formatDate(pm.match.scheduledAt)}
                  </div>
                  <span className="text-xs text-destructive font-bold">يغلق: {formatDate(pm.closesAt)}</span>
                </div>

                <div className="flex flex-col items-center gap-2 w-[40%]">
                  <TeamLogo name={pm.match.awayTeam.name} className="w-14 h-14 shadow-md" />
                  <span className="font-bold text-sm text-center">{pm.match.awayTeam.name}</span>
                </div>
              </div>
              
              <div className="p-4 bg-card border-t border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <UsersIcon /> {pm.crowdPrediction.totalVotes} توقعوا
                </div>
                <Button className="rounded-full px-8 font-bold" disabled={pm.hasPredicted}>
                  {pm.hasPredicted ? 'تم التوقع' : 'توقع الآن'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function MyPredictions() {
  const { data: predictions, isLoading } = useListMyPredictions();

  if (isLoading) return <LoadingList />;

  if (!predictions || predictions.length === 0) {
    return <EmptyState icon={<Target />} text="لم تقم بأي توقعات بعد" />;
  }

  return (
    <div className="space-y-4">
      {predictions.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className={p.status === 'won' ? 'border-primary' : p.status === 'lost' ? 'border-destructive/50 opacity-70' : ''}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center border-b border-border/50 pb-3 mb-3">
                <span className="text-xs font-bold text-muted-foreground">{formatDate(p.match.scheduledAt)}</span>
                <Badge variant={p.status === 'won' ? 'default' : p.status === 'lost' ? 'destructive' : 'secondary'}>
                  {p.status === 'won' ? 'فوز' : p.status === 'lost' ? 'خسارة' : p.status === 'partial' ? 'جزئي' : 'قيد الانتظار'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold w-[35%] truncate">{p.match.homeTeam.name}</span>
                <div className="flex-1 flex justify-center gap-4 text-2xl font-black tabular-nums">
                  <span className="text-primary">{p.homeScorePrediction}</span>
                  <span className="text-muted-foreground/30">-</span>
                  <span className="text-primary">{p.awayScorePrediction}</span>
                </div>
                <span className="font-bold w-[35%] truncate text-left">{p.match.awayTeam.name}</span>
              </div>

              {p.pointsEarned != null && (
                <div className="mt-4 pt-3 border-t border-border/50 flex justify-center">
                  <span className="text-sm font-bold text-secondary flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    كسبت {p.pointsEarned} نقطة
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ type: 'global' });

  if (isLoading) return <LoadingList />;
  if (!leaderboard) return null;

  return (
    <Card>
      <CardHeader className="bg-muted/30 border-b border-border p-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-5 h-5 text-secondary" />
          الترتيب العالمي
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {leaderboard.entries.map((entry, i) => (
          <div 
            key={entry.user.id} 
            className={`flex items-center gap-4 p-4 border-b border-border/50 last:border-0 ${
              i < 3 ? 'bg-gradient-to-r from-secondary/5 to-transparent' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
              i === 0 ? 'bg-secondary text-secondary-foreground shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
              i === 1 ? 'bg-slate-300 text-slate-800' :
              i === 2 ? 'bg-amber-700/80 text-white' :
              'text-muted-foreground bg-muted'
            }`}>
              {entry.rank}
            </div>
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
              <img src={entry.user.avatar || undefined} alt={entry.user.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{entry.user.name}</p>
              <div className="text-xs text-muted-foreground flex gap-2">
                <span>{entry.accuracy}% دقة</span>
                <span>•</span>
                <span>{entry.predictions} توقع</span>
              </div>
            </div>
            <div className="text-left shrink-0">
              <p className="font-black text-secondary">{entry.points}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Rewards() {
  const { data: rewards, isLoading } = useListRewards();

  if (isLoading) return <LoadingList />;
  if (!rewards || rewards.length === 0) return <EmptyState icon={<Gift />} text="لا توجد جوائز متاحة حالياً" />;

  return (
    <div className="space-y-4">
      {rewards.map((reward, i) => (
        <motion.div
          key={reward.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="overflow-hidden border-secondary/30 relative">
            <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
              {reward.type === 'weekly' ? 'أسبوعي' : 'شهري'}
            </div>
            <div className="h-32 w-full relative">
              <img src={reward.imageUrl || undefined} alt={reward.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
              <h3 className="absolute bottom-2 right-4 font-black text-xl text-white drop-shadow-md">{reward.title}</h3>
            </div>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">{reward.description}</p>
              
              <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">النقاط المطلوبة</p>
                  <p className="font-bold text-secondary text-lg">{reward.pointsRequired}</p>
                </div>
                <Award className="w-8 h-8 text-secondary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function LoadingList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4 border-2 border-dashed rounded-xl border-border/50 bg-muted/20">
      <div className="h-16 w-16 opacity-20 [&>svg]:w-full [&>svg]:h-full">{icon}</div>
      <p className="font-bold text-lg">{text}</p>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  );
}
