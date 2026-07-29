import React, { useState } from 'react';
import {
  useListAvailablePredictions,
  useListMyPredictions,
  useGetLeaderboard,
  useListRewards,
  useCreatePrediction,
  useUpdatePrediction,
  useDeletePrediction,
  PredictionMatch,
  Prediction,
  LeaderboardEntry,
  Reward,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { TeamLogo } from '@/components/team-logo';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/utils';
import { Link } from 'wouter';
import {
  Gift,
  Trophy,
  Target,
  Award,
  Clock,
  CheckCircle2,
  LogIn,
  Pencil,
  Trash2,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppAuth } from '@/components/auth-provider';

// ─── Prediction Dialog (Create) ───────────────────────────────────────────────

interface PredictionDialogProps {
  pm: PredictionMatch | null;
  onClose: () => void;
}

function PredictionDialog({ pm, onClose }: PredictionDialogProps) {
  const queryClient = useQueryClient();
  const { mutate: createPrediction, isPending } = useCreatePrediction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setSubmitted(true);
      },
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data
            ?.error ?? 'حدث خطأ، يرجى المحاولة مرة أخرى';
        setErrorMsg(msg);
      },
    },
  });

  const [homeGoals, setHomeGoals] = useState<string>('');
  const [awayGoals, setAwayGoals] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!pm) return null;

  const { match } = pm;

  function quickPick(home: number, away: number) {
    setHomeGoals(String(home));
    setAwayGoals(String(away));
    setErrorMsg(null);
  }

  function handleSubmit() {
    setErrorMsg(null);
    const homeNum = homeGoals !== '' ? parseInt(homeGoals, 10) : null;
    const awayNum = awayGoals !== '' ? parseInt(awayGoals, 10) : null;

    if (homeNum === null || awayNum === null) {
      setErrorMsg('يرجى إدخال النتيجة المتوقعة');
      return;
    }
    if (isNaN(homeNum) || isNaN(awayNum) || homeNum < 0 || awayNum < 0) {
      setErrorMsg('يرجى إدخال أرقام صحيحة غير سالبة');
      return;
    }

    createPrediction({
      data: {
        matchId: match.id,
        homeScorePrediction: homeNum,
        awayScorePrediction: awayNum,
      },
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl border-primary/20 bg-card text-card-foreground" dir="rtl">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-6 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-primary" />
            <h2 className="text-xl font-black">تم حفظ توقعك!</h2>
            <p className="text-muted-foreground text-sm">
              {match.homeTeam.name} {homeGoals} — {awayGoals} {match.awayTeam.name}
            </p>
            <Button onClick={onClose} className="w-full mt-2">
              حسناً
            </Button>
          </motion.div>
        ) : (
          <>
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base font-black text-center">
                توقع نتيجة المباراة
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-muted-foreground">
                {match.homeTeam.name} ضد {match.awayTeam.name}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between gap-2 py-3 border-y border-border/50">
              <div className="flex flex-col items-center gap-1 w-[40%]">
                <TeamLogo name={match.homeTeam.name} className="w-12 h-12" />
                <span className="text-xs font-bold text-center leading-tight">{match.homeTeam.name}</span>
              </div>
              <span className="text-muted-foreground text-sm font-bold">VS</span>
              <div className="flex flex-col items-center gap-1 w-[40%]">
                <TeamLogo name={match.awayTeam.name} className="w-12 h-12" />
                <span className="text-xs font-bold text-center leading-tight">{match.awayTeam.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-bold text-center">اختر النتيجة بسرعة</p>
              <div className="grid grid-cols-3 gap-2">
                {[{ label: 'فوز المضيف', h: 1, a: 0 }, { label: 'تعادل', h: 0, a: 0 }, { label: 'فوز الضيف', h: 0, a: 1 }].map(({ label, h, a }) => (
                  <button
                    key={label}
                    onClick={() => quickPick(h, a)}
                    className={`py-2 rounded-lg border text-xs font-bold transition-colors ${
                      homeGoals === String(h) && awayGoals === String(a)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/50 hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-bold text-center">
                أو أدخل النتيجة الدقيقة (+100 نقطة)
              </p>
              <div className="flex items-center gap-3">
                <Input type="number" min={0} max={20} placeholder="0" value={homeGoals}
                  onChange={(e) => { setHomeGoals(e.target.value); setErrorMsg(null); }}
                  className="text-center text-xl font-black h-12" />
                <span className="text-muted-foreground font-bold shrink-0">—</span>
                <Input type="number" min={0} max={20} placeholder="0" value={awayGoals}
                  onChange={(e) => { setAwayGoals(e.target.value); setErrorMsg(null); }}
                  className="text-center text-xl font-black h-12" />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-destructive text-center font-bold">{errorMsg}</p>
            )}

            <div className="flex items-center justify-center gap-1 text-xs text-secondary font-bold">
              <Gift className="w-4 h-4" />
              <span>تكسب حتى {pm.pointsAvailable} نقطة</span>
            </div>

            <Button className="w-full font-black text-base h-12 rounded-xl" onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'جاري الحفظ...' : 'تأكيد التوقع'}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Prediction Dialog ────────────────────────────────────────────────────

interface EditPredictionDialogProps {
  prediction: Prediction | null;
  onClose: () => void;
}

function EditPredictionDialog({ prediction, onClose }: EditPredictionDialogProps) {
  const queryClient = useQueryClient();
  const { mutate: updatePrediction, isPending } = useUpdatePrediction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        onClose();
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          ?? 'حدث خطأ، يرجى المحاولة مرة أخرى';
        setErrorMsg(msg);
      },
    },
  });

  const [homeGoals, setHomeGoals] = useState(String(prediction?.homeScorePrediction ?? ''));
  const [awayGoals, setAwayGoals] = useState(String(prediction?.awayScorePrediction ?? ''));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!prediction) return null;

  function handleSubmit() {
    if (!prediction) return;
    setErrorMsg(null);
    const homeNum = homeGoals !== '' ? parseInt(homeGoals, 10) : null;
    const awayNum = awayGoals !== '' ? parseInt(awayGoals, 10) : null;
    if (homeNum === null || awayNum === null || isNaN(homeNum) || isNaN(awayNum)) {
      setErrorMsg('يرجى إدخال أرقام صحيحة');
      return;
    }
    updatePrediction({
      id: prediction.id,
      data: { homeScorePrediction: homeNum, awayScorePrediction: awayNum },
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl border-primary/20 bg-card text-card-foreground" dir="rtl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-black text-center">تعديل التوقع</DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            {prediction.match.homeTeam.name} ضد {prediction.match.awayTeam.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-bold text-center">النتيجة المتوقعة</p>
          <div className="flex items-center gap-3">
            <Input type="number" min={0} max={20} placeholder="0" value={homeGoals}
              onChange={(e) => { setHomeGoals(e.target.value); setErrorMsg(null); }}
              className="text-center text-xl font-black h-12" />
            <span className="text-muted-foreground font-bold shrink-0">—</span>
            <Input type="number" min={0} max={20} placeholder="0" value={awayGoals}
              onChange={(e) => { setAwayGoals(e.target.value); setErrorMsg(null); }}
              className="text-center text-xl font-black h-12" />
          </div>
        </div>

        {errorMsg && <p className="text-xs text-destructive text-center font-bold">{errorMsg}</p>}

        <Button className="w-full font-black h-12 rounded-xl" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'جاري التعديل...' : 'حفظ التعديل'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

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

// ─── Available Predictions ─────────────────────────────────────────────────────

function AvailablePredictions() {
  const { isAuthenticated, login } = useAppAuth();
  const { data: matches, isLoading } = useListAvailablePredictions();
  const [activePm, setActivePm] = useState<PredictionMatch | null>(null);

  if (isLoading) return <LoadingList />;

  if (!matches || matches.length === 0) {
    return <EmptyState icon={<Clock />} text="لا توجد مباريات متاحة للتوقع حالياً" />;
  }

  function handlePredictClick(pm: PredictionMatch) {
    if (!isAuthenticated) { login(); return; }
    setActivePm(pm);
  }

  return (
    <>
      <div className="space-y-4">
        {matches.map((pm, i) => (
          <motion.div
            key={pm.match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
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
                    <span className="text-xs text-destructive font-bold">
                      يغلق: {formatDate(pm.closesAt)}
                    </span>
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
                  <Button
                    className="rounded-full px-8 font-bold"
                    disabled={pm.hasPredicted}
                    onClick={() => handlePredictClick(pm)}
                    variant={pm.hasPredicted ? 'secondary' : 'default'}
                  >
                    {pm.hasPredicted ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> تم التوقع</span>
                    ) : !isAuthenticated ? (
                      <span className="flex items-center gap-1"><LogIn className="w-4 h-4" /> سجّل للتوقع</span>
                    ) : (
                      'توقع الآن'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {activePm && (
          <PredictionDialog pm={activePm} onClose={() => setActivePm(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── My Predictions ────────────────────────────────────────────────────────────

function MyPredictions() {
  const { isAuthenticated, login } = useAppAuth();
  const queryClient = useQueryClient();
  const { data: predictions, isLoading } = useListMyPredictions(
    undefined,
    { query: { enabled: isAuthenticated } as never },
  );
  const { mutate: deletePrediction } = useDeletePrediction({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries(),
    },
  });

  const [editTarget, setEditTarget] = useState<Prediction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-4 border-2 border-dashed rounded-xl border-border/50 bg-muted/20">
        <Target className="w-16 h-16 opacity-20" />
        <p className="font-bold text-lg">سجّل دخولك لمتابعة توقعاتك</p>
        <Button onClick={login} className="gap-2">
          <LogIn className="w-4 h-4" /> تسجيل الدخول
        </Button>
      </div>
    );
  }

  if (isLoading) return <LoadingList />;
  if (!predictions || predictions.length === 0) {
    return <EmptyState icon={<Target />} text="لم تقم بأي توقعات بعد" />;
  }

  return (
    <>
      <div className="space-y-4">
        {predictions.map((p, i) => {
          // canEdit comes from the API response (before deadline)
          const canEdit = (p as Prediction & { canEdit?: boolean }).canEdit ?? false;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={
                p.status === 'won'
                  ? 'border-primary'
                  : p.status === 'lost'
                    ? 'border-destructive/50 opacity-70'
                    : ''
              }>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center border-b border-border/50 pb-3 mb-3">
                    <span className="text-xs font-bold text-muted-foreground">
                      {formatDate(p.match.scheduledAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      {!canEdit && p.status === 'pending' && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="w-3 h-3" /> مغلق
                        </span>
                      )}
                      <Badge
                        variant={p.status === 'won' ? 'default' : p.status === 'lost' ? 'destructive' : 'secondary'}
                      >
                        {p.status === 'won' ? 'فوز' : p.status === 'lost' ? 'خسارة' : p.status === 'partial' ? 'جزئي' : 'قيد الانتظار'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold w-[35%] truncate">{p.match.homeTeam.name}</span>
                    <div className="flex-1 flex justify-center gap-4 text-2xl font-black tabular-nums">
                      <span className="text-primary">{p.homeScorePrediction ?? '—'}</span>
                      <span className="text-muted-foreground/30">-</span>
                      <span className="text-primary">{p.awayScorePrediction ?? '—'}</span>
                    </div>
                    <span className="font-bold w-[35%] truncate text-left">{p.match.awayTeam.name}</span>
                  </div>

                  {p.pointsEarned != null && (
                    <div className="mt-4 pt-3 border-t border-border/50 flex justify-center">
                      <span className="text-sm font-bold text-secondary flex items-center gap-1">
                        <Trophy className="w-4 h-4" /> كسبت {p.pointsEarned} نقطة
                      </span>
                    </div>
                  )}

                  {canEdit && p.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-border/50 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 text-xs"
                        onClick={() => setEditTarget(p)}
                      >
                        <Pencil className="w-3 h-3" /> تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 text-xs text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                        onClick={() => setDeleteTarget(p.id)}
                      >
                        <Trash2 className="w-3 h-3" /> حذف
                      </Button>
                    </div>
                  )}

                  {!canEdit && p.status === 'pending' && (
                    <p className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" />
                      التوقعات مغلقة قبل 5 دقائق من بدء المباراة
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <AnimatePresence>
        {editTarget && (
          <EditPredictionDialog
            prediction={editTarget}
            onClose={() => setEditTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التوقع</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التوقع؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse">
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => {
                if (deleteTarget) {
                  deletePrediction({ id: deleteTarget });
                  setDeleteTarget(null);
                }
              }}
            >
              حذف
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Leaderboard ───────────────────────────────────────────────────────────────

function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ type: 'global' });

  if (isLoading) return <LoadingList />;
  if (!leaderboard) return null;

  if (leaderboard.entries.length === 0) {
    return <EmptyState icon={<Trophy />} text="لا يوجد لاعبون في الترتيب بعد. كن أول من يتوقع!" />;
  }

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
              i === 0 ? 'bg-secondary text-secondary-foreground shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                : i === 1 ? 'bg-slate-300 text-slate-800'
                : i === 2 ? 'bg-amber-700/80 text-white'
                : 'text-muted-foreground bg-muted'
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

// ─── Rewards ───────────────────────────────────────────────────────────────────

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

// ─── Shared Helpers ────────────────────────────────────────────────────────────

function LoadingList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4 border-2 border-dashed rounded-xl border-border/50 bg-muted/20">
      <div className="h-16 w-16 opacity-20 [&>svg]:w-full [&>svg]:h-full">{icon}</div>
      <p className="font-bold text-lg">{text}</p>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
