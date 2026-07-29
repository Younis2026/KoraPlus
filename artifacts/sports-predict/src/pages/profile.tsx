import React, { useState } from 'react';
import { useGetProfile, useGetProfileStats, useGetAchievements } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Settings, Trophy, Target, Flame, Medal, Shield, Share2,
  ShieldAlert, ChevronLeft, LogIn, LogOut, User, Bell,
  Globe, Moon, Pencil, Copy, Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useAppAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading, login, logout, user: authUser } = useAppAuth();
  const { toast } = useToast();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryOpts = { enabled: isAuthenticated } as any;
  const { data: profile, isLoading: loadingProfile } = useGetProfile({ query: queryOpts });
  const { data: stats, isLoading: loadingStats } = useGetProfileStats({ query: queryOpts });
  const { data: achievements, isLoading: loadingAchievements } = useGetAchievements({ query: queryOpts });

  function handleShare() {
    const profileUrl = window.location.origin + '/profile';
    const shareText = `توقعاتي الرياضية على توقع بلس — ${profile?.name ?? ''}`;
    if (navigator.share) {
      navigator.share({ title: 'توقع بلس', text: shareText, url: profileUrl })
        .catch(() => null);
    } else {
      navigator.clipboard.writeText(profileUrl).then(() => {
        setCopied(true);
        toast({ title: 'تم نسخ رابط الملف الشخصي ✓' });
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  if (authLoading) return <ProfileSkeleton />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-primary/20 overflow-hidden">
          {/* Branded header strip */}
          <div className="h-2 bg-gradient-to-r from-primary to-secondary" />

          <CardContent className="p-8 flex flex-col items-center gap-6 text-center">
            {/* App icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center shadow-lg">
              <Trophy className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black">توقع بلس</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                سجّل دخولك لمتابعة توقعاتك ومراكزك في الترتيب وإنجازاتك.
              </p>
            </div>

            <Button
              size="lg"
              onClick={login}
              className="w-full gap-2 font-bold text-base h-12 rounded-xl"
            >
              <LogIn className="w-5 h-5" />
              تسجيل الدخول
            </Button>

            <p className="text-xs text-muted-foreground/60">
              يستخدم التطبيق تسجيل الدخول الآمن عبر Replit
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingProfile || loadingStats || loadingAchievements) return <ProfileSkeleton />;

  if (!profile || !stats) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <p className="text-muted-foreground">حدث خطأ في تحميل البيانات</p>
        <Button variant="outline" onClick={() => window.location.reload()}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 pb-20">

      {/* Header Profile Card */}
      <Card className="overflow-hidden border-primary/20 relative">
        <div className="absolute top-0 right-0 p-4 z-10 flex gap-2">
          <button
            onClick={handleShare}
            title="مشاركة الملف الشخصي"
            className="w-8 h-8 rounded-full bg-background/50 backdrop-blur border flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button
            onClick={logout}
            title="تسجيل الخروج"
            className="w-8 h-8 rounded-full bg-background/50 backdrop-blur border flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            title="الإعدادات"
            className="w-8 h-8 rounded-full bg-background/50 backdrop-blur border flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="h-32 bg-gradient-to-r from-primary/80 to-secondary/80 relative">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '18px 18px' }} />
        </div>

        <CardContent className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-12 mb-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-card shadow-xl">
                <AvatarImage src={profile.avatar || authUser?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                  {profile.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-secondary text-secondary-foreground text-xs font-black px-2 py-0.5 rounded-full border-2 border-card shadow-md">
                مستوى {profile.level}
              </div>
            </div>

            <div className="text-center md:text-right flex-1 pt-2 md:pt-0">
              <h1 className="text-2xl font-black">{profile.name}</h1>
              <p className="text-muted-foreground text-sm font-mono">ID: {profile.id}</p>
            </div>
          </div>

          {/* Key stats under the name — always show numbers, never symbols */}
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div className="text-center bg-muted/40 rounded-xl p-3">
              <p className="font-black text-2xl tabular-nums text-secondary">{profile.totalPoints ?? 0}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">النقاط</p>
            </div>
            <div className="text-center bg-muted/40 rounded-xl p-3">
              <p className="font-black text-2xl tabular-nums">#{profile.globalRank ?? 0}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">الترتيب</p>
            </div>
            <div className="text-center bg-muted/40 rounded-xl p-3">
              <p className="font-black text-2xl tabular-nums text-primary">{stats.wonPredictions ?? 0}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">توقع صحيح</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="إجمالي التوقعات" value={stats.totalPredictions ?? 0} icon={<Target className="text-blue-500" />} />
        <StatCard title="نسبة الدقة" value={`${stats.accuracy ?? 0}%`} icon={<Shield className="text-emerald-500" />} />
        <StatCard title="أفضل سلسلة" value={`${stats.bestStreak ?? 0} متتالية`} icon={<Flame className="text-red-500" />} />
        <StatCard title="الشارات" value={profile.badgeCount ?? 0} icon={<Medal className="text-secondary" />} />
      </div>

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-secondary" />
              الإنجازات
            </h2>
            <Badge variant="outline">{profile.badgeCount ?? 0} مفتوح</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((ach, i) => (
              <motion.div key={ach.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`overflow-hidden h-full ${ach.isUnlocked ? 'bg-card border-primary/20' : 'bg-muted/30 opacity-70 border-dashed'}`}>
                  <CardContent className="p-4 flex gap-4 items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${ach.isUnlocked ? 'bg-gradient-to-br from-secondary to-amber-600 shadow-lg shadow-secondary/20 text-white' : 'bg-muted text-muted-foreground'}`}>
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
      )}

      {/* Admin Panel Access — only for admins */}
      {authUser?.role === 'admin' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Link href="/admin">
            <div className="group flex items-center gap-4 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
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
      )}

      {/* Settings Sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl" dir="rtl">
          <SheetHeader className="text-right pb-4">
            <SheetTitle className="text-xl font-black">الإعدادات</SheetTitle>
          </SheetHeader>

          <div className="space-y-2 pb-6">
            <SettingsItem icon={<Pencil className="w-5 h-5 text-primary" />} label="تعديل الملف الشخصي" onClick={() => { setSettingsOpen(false); window.location.href = '/profile/setup'; }} />
            <SettingsItem icon={<Bell className="w-5 h-5 text-amber-400" />} label="إشعارات" badge="قريباً" onClick={() => {}} />
            <SettingsItem icon={<Globe className="w-5 h-5 text-blue-400" />} label="اللغة" badge="العربية" onClick={() => {}} />
            <SettingsItem icon={<Moon className="w-5 h-5 text-purple-400" />} label="المظهر" badge="داكن" onClick={() => {}} />
            <div className="pt-2">
              <button
                onClick={() => { setSettingsOpen(false); logout(); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-bold">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SettingsItem({
  icon, label, badge, onClick
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted/60 transition-colors text-right"
    >
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="flex-1 font-medium">{label}</span>
      {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
      <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' })}
          <span className="truncate">{title}</span>
        </div>
        <p className="font-black text-2xl tabular-nums">{value ?? 0}</p>
      </CardContent>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto p-4 space-y-6">
      <Skeleton className="h-52 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    </div>
  );
}
