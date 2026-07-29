import React from 'react';
import { useGetProfile, useGetProfileStats, useGetAchievements } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Settings, Trophy, Target, Flame, Medal, Shield, Share2, ShieldAlert, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

export default function ProfilePage() {
  const { data: profile, isLoading: loadingProfile } = useGetProfile();
  const { data: stats, isLoading: loadingStats } = useGetProfileStats();
  const { data: achievements, isLoading: loadingAchievements } = useGetAchievements();

  if (loadingProfile || loadingStats || loadingAchievements) {
    return <ProfileSkeleton />;
  }

  if (!profile || !stats || !achievements) {
    return <div className="p-8 text-center text-muted-foreground">حدث خطأ في تحميل البيانات</div>;
  }

  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header Profile Card */}
      <Card className="overflow-hidden border-primary/20 relative">
        <div className="absolute top-0 right-0 p-4 z-10 flex gap-2">
          <button className="w-8 h-8 rounded-full bg-background/50 backdrop-blur border flex items-center justify-center text-foreground hover:bg-background/80 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-full bg-background/50 backdrop-blur border flex items-center justify-center text-foreground hover:bg-background/80 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
        
        <div className="h-32 bg-gradient-to-r from-primary/80 to-secondary/80 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] mix-blend-overlay"></div>
        </div>
        
        <CardContent className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-12 mb-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-card shadow-xl">
                <AvatarImage src={profile.avatar || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">{profile.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-secondary text-secondary-foreground text-xs font-black px-2 py-0.5 rounded-full border-2 border-card shadow-md">
                مستوى {profile.level}
              </div>
            </div>
            
            <div className="text-center md:text-right flex-1 pt-2 md:pt-0">
              <h1 className="text-2xl font-black">{profile.name}</h1>
              <p className="text-muted-foreground text-sm">@{profile.username} • {profile.country}</p>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto justify-center mt-4 md:mt-0">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">الترتيب العالمي</p>
                <p className="font-black text-xl tabular-nums">#{profile.globalRank}</p>
              </div>
              <div className="w-px bg-border my-2"></div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">إجمالي النقاط</p>
                <p className="font-black text-xl tabular-nums text-secondary">{profile.totalPoints}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="إجمالي التوقعات" value={stats.totalPredictions} icon={<Target className="text-blue-500" />} />
        <StatCard title="توقعات صحيحة" value={stats.wonPredictions} icon={<Medal className="text-primary" />} />
        <StatCard title="نسبة الدقة" value={`${stats.accuracy}%`} icon={<Shield className="text-emerald-500" />} />
        <StatCard title="أفضل سلسلة" value={`${stats.bestStreak} متتالية`} icon={<Flame className="text-red-500" />} />
      </div>

      {/* Achievements Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-secondary" />
            الإنجازات
          </h2>
          <Badge variant="outline">{profile.badgeCount} مفتوح</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((ach, i) => (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`overflow-hidden h-full ${ach.isUnlocked ? 'bg-card border-primary/20' : 'bg-muted/30 opacity-70 border-dashed'}`}>
                <CardContent className="p-4 flex gap-4 items-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                    ach.isUnlocked ? 'bg-gradient-to-br from-secondary to-amber-600 shadow-lg shadow-secondary/20 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {/* Render icon based on achievement rarity or just a generic one */}
                    {ach.rarity === 'legendary' ? <Trophy className="w-6 h-6" /> : <Medal className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm truncate">{ach.title}</h3>
                      {ach.isUnlocked && <Badge className="text-[10px] h-4 px-1 shrink-0">مكتمل</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{ach.description}</p>
                    {!ach.isUnlocked && (
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{ach.progress}</span>
                          <span>{ach.target}</span>
                        </div>
                        <Progress value={(ach.progress / ach.target) * 100} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Admin Panel Access */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link href="/admin">
          <div className="group flex items-center gap-4 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 transition-colors">
              <ShieldAlert className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-emerald-300">لوحة التحكم</p>
              <p className="text-xs text-muted-foreground">إدارة المباريات والأخبار والتوقعات</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-emerald-500/60 group-hover:text-emerald-400 transition-colors shrink-0" />
          </div>
        </Link>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full gap-2">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xl font-black tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto p-4 space-y-6">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
      <Skeleton className="h-8 w-32 mb-4 mt-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    </div>
  );
}
