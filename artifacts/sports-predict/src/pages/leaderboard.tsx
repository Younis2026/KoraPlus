import React, { useState } from 'react';
import {
  useGetLeaderboard,
  useGetFriendsLeaderboard,
  useListMyGroups,
  useCreateGroup,
  useJoinGroup,
  useSearchUsers,
  useFollowUser,
  useUnfollowUser,
  useGetGroupLeaderboard,
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Users, Globe, Search, Plus, Copy, UserPlus, UserCheck, Link } from 'lucide-react';
import { useAppAuth } from '@/components/auth-provider';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

type LeaderboardType = 'global' | 'weekly' | 'monthly';

interface LeaderboardEntry {
  rank: number;
  user: { id: string; name: string; avatar: string; country: string };
  points: number;
  predictions: number;
  accuracy: number;
  change: number;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-secondary text-secondary-foreground shadow-[0_0_14px_rgba(250,204,21,0.5)] text-base">
      🥇
    </div>
  );
  if (rank === 2) return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-slate-300 text-slate-800 text-base">
      🥈
    </div>
  );
  if (rank === 3) return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-amber-700/80 text-white text-base">
      🥉
    </div>
  );
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 bg-muted text-muted-foreground text-sm">
      {rank}
    </div>
  );
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe?: boolean }) {
  const correctPredictions = Math.round(entry.predictions * entry.accuracy / 100);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 transition-colors ${isMe ? 'bg-primary/5' : ''}`}
    >
      <RankBadge rank={entry.rank} />
      <Avatar className="w-9 h-9 shrink-0">
        <AvatarImage src={entry.user.avatar || undefined} />
        <AvatarFallback className="text-xs bg-muted">{entry.user.name.substring(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${isMe ? 'text-primary' : ''}`}>
          {isMe ? `${entry.user.name} (أنت)` : entry.user.name}
        </p>
        <p className="text-xs text-muted-foreground font-mono">ID: {entry.user.id}</p>
        <p className="text-xs text-muted-foreground">{correctPredictions} صحيح • {entry.accuracy}% دقة</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-black text-secondary tabular-nums">{entry.points.toLocaleString('ar-SA')}</p>
        <p className="text-[10px] text-muted-foreground">نقطة</p>
      </div>
    </motion.div>
  );
}

// ── Global Leaderboard ────────────────────────────────────────────────────────

function GlobalLeaderboard() {
  const [type, setType] = useState<LeaderboardType>('global');
  const { data, isLoading } = useGetLeaderboard({ type });
  const { user } = useAppAuth();

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center">
        {(['global', 'weekly', 'monthly'] as const).map((t) => (
          <Button
            key={t}
            variant={type === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => setType(t)}
          >
            {t === 'global' ? 'الكل' : t === 'weekly' ? 'أسبوعي' : 'شهري'}
          </Button>
        ))}
      </div>

      <Card>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-0">
                <Skeleton className="w-9 h-9 rounded-full" />
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-12" />
              </div>
            ))
          : data?.entries.map((entry) => (
              <LeaderboardRow
                key={entry.user.id}
                entry={entry}
                isMe={!!user && entry.user.id === data.userEntry?.user.id}
              />
            ))}
        {data?.userEntry && data.userEntry.rank > 10 && (
          <>
            <div className="px-4 py-1 text-center text-xs text-muted-foreground">•••</div>
            <LeaderboardRow entry={data.userEntry} isMe />
          </>
        )}
      </Card>
    </div>
  );
}

// ── Friends Leaderboard ───────────────────────────────────────────────────────

function FriendsLeaderboard() {
  const { isAuthenticated, login, user } = useAppAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading, refetch } = useGetFriendsLeaderboard({ query: { enabled: isAuthenticated } as any });
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading: searching } = useSearchUsers(
    { q: searchQuery },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: searchQuery.length >= 2 } as any },
  );
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const { toast } = useToast();

  async function handleFollow(userId: string, isFollowing: boolean) {
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync({ userId });
        toast({ description: 'تم إلغاء المتابعة' });
      } else {
        await followMutation.mutateAsync({ userId });
        toast({ description: 'تمت المتابعة! ستظهر في قائمة الأصدقاء' });
      }
      refetch();
    } catch {
      toast({ description: 'حدث خطأ، حاول مجدداً', variant: 'destructive' });
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16 space-y-4">
        <Users className="w-12 h-12 mx-auto text-muted-foreground" />
        <p className="font-bold text-lg">تابع أصدقاءك وتنافس معهم</p>
        <p className="text-muted-foreground text-sm">سجّل دخولك لرؤية ترتيب أصدقائك</p>
        <Button onClick={login} size="lg" className="mt-4">تسجيل الدخول</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="ابحث عن أصدقاء بالاسم أو اسم المستخدم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {searchQuery.length >= 2 && (
        <Card>
          <CardContent className="p-0">
            {searching && <div className="p-4 text-center text-sm text-muted-foreground">جارٍ البحث...</div>}
            {!searching && (!searchResults || searchResults.length === 0) && (
              <div className="p-4 text-center text-sm text-muted-foreground">لا نتائج لـ "{searchQuery}"</div>
            )}
            {searchResults?.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={u.avatar || undefined} />
                  <AvatarFallback className="text-xs">{u.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground">@{u.username} • {u.totalPoints} نقطة</p>
                </div>
                <Button
                  size="sm"
                  variant={u.isFollowing ? 'outline' : 'default'}
                  onClick={() => handleFollow(u.id, u.isFollowing)}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                >
                  {u.isFollowing
                    ? <><UserCheck className="w-4 h-4 ml-1" />متابَع</>
                    : <><UserPlus className="w-4 h-4 ml-1" />متابعة</>
                  }
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-0">
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="flex-1 space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </Card>
      ) : !data?.entries.length ? (
        <div className="text-center py-10 text-muted-foreground space-y-2">
          <Users className="w-10 h-10 mx-auto opacity-40" />
          <p className="text-sm">لم تتابع أحداً بعد. ابحث عن أصدقائك أعلاه!</p>
        </div>
      ) : (
        <Card>
          {data.entries.map((entry) => (
            <LeaderboardRow
              key={entry.user.id}
              entry={entry}
              isMe={!!user && entry.user.id === String(user.id)}
            />
          ))}
        </Card>
      )}
    </div>
  );
}

// ── Group Leagues ─────────────────────────────────────────────────────────────

function GroupLeagues() {
  const { isAuthenticated, login } = useAppAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: groups, isLoading, refetch } = useListMyGroups({ query: { enabled: isAuthenticated } as any });
  const createMutation = useCreateGroup();
  const joinMutation = useJoinGroup();
  const { toast } = useToast();

  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const { data: groupDetail, isLoading: loadingDetail } = useGetGroupLeaderboard(
    selectedGroupId!,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: !!selectedGroupId && isAuthenticated } as any },
  );

  async function handleCreate() {
    if (!newGroupName.trim()) return;
    try {
      await createMutation.mutateAsync({ data: { name: newGroupName.trim() } });
      toast({ description: `تم إنشاء المجموعة "${newGroupName}"!` });
      setNewGroupName('');
      setShowCreate(false);
      refetch();
    } catch {
      toast({ description: 'تعذّر إنشاء المجموعة', variant: 'destructive' });
    }
  }

  async function handleJoin() {
    if (!inviteCodeInput.trim()) return;
    try {
      const group = await joinMutation.mutateAsync({ data: { inviteCode: inviteCodeInput.trim() } });
      toast({ description: `انضممت إلى "${group.name}"!` });
      setInviteCodeInput('');
      setShowJoin(false);
      refetch();
    } catch {
      toast({ description: 'رمز الدعوة غير صالح', variant: 'destructive' });
    }
  }

  function copyInviteCode(code: string) {
    navigator.clipboard.writeText(code);
    toast({ description: 'تم نسخ رمز الدعوة!' });
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16 space-y-4">
        <Trophy className="w-12 h-12 mx-auto text-muted-foreground" />
        <p className="font-bold text-lg">دوريات خاصة مع أصدقائك</p>
        <p className="text-muted-foreground text-sm">سجّل دخولك لإنشاء دوريات خاصة أو الانضمام إليها</p>
        <Button onClick={login} size="lg" className="mt-4">تسجيل الدخول</Button>
      </div>
    );
  }

  if (selectedGroupId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedGroupId(null)}>
          ← رجوع إلى الدوريات
        </Button>
        {loadingDetail ? (
          <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        ) : groupDetail ? (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{groupDetail.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground">رمز الدعوة:</span>
                  <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono font-bold tracking-widest">{groupDetail.inviteCode}</code>
                  <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" onClick={() => copyInviteCode(groupDetail.inviteCode)}>
                    <Copy className="w-3 h-3" />
                    نسخ
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{groupDetail.memberCount} عضو</p>
              </CardHeader>
            </Card>
            <Card>
              {groupDetail.entries.length > 0
                ? groupDetail.entries.map((entry) => (
                    <LeaderboardRow key={entry.user.id} entry={entry} />
                  ))
                : (
                  <CardContent className="p-6 text-center text-muted-foreground text-sm">
                    انضم أعضاء آخرون باستخدام رمز الدعوة!
                  </CardContent>
                )
              }
            </Card>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 flex-1">
              <Plus className="w-4 h-4" />
              إنشاء دوري
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء دوري خاص جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="اسم الدوري (مثال: دوري الأصدقاء)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                maxLength={60}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button onClick={handleCreate} disabled={createMutation.isPending || !newGroupName.trim()} className="w-full">
                {createMutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الدوري'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showJoin} onOpenChange={setShowJoin}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 flex-1">
              <Link className="w-4 h-4" />
              انضم برمز
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>الانضمام برمز دعوة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="مثال: A1B2C3D4"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                className="font-mono tracking-widest text-center text-lg"
                maxLength={8}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              <Button onClick={handleJoin} disabled={joinMutation.isPending || !inviteCodeInput.trim()} className="w-full">
                {joinMutation.isPending ? 'جارٍ الانضمام...' : 'انضم إلى الدوري'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
      ) : !groups || groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground space-y-2">
          <Trophy className="w-10 h-10 mx-auto opacity-40" />
          <p className="text-sm font-medium">لا توجد دوريات بعد</p>
          <p className="text-xs">أنشئ دورياً خاصاً أو انضم لواحد برمز الدعوة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedGroupId(group.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{group.name}</p>
                  <p className="text-xs text-muted-foreground">{group.memberCount} عضو</p>
                </div>
                <code className="text-xs text-muted-foreground font-mono shrink-0">{group.inviteCode}</code>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto p-4 space-y-4 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="w-6 h-6 text-secondary" />
        <h1 className="text-2xl font-black">الترتيب</h1>
      </div>

      <Tabs defaultValue="global">
        <TabsList className="w-full">
          <TabsTrigger value="global" className="flex-1 gap-1.5">
            <Globe className="w-4 h-4" />
            عالمي
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex-1 gap-1.5">
            <Users className="w-4 h-4" />
            أصدقاء
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex-1 gap-1.5">
            <Trophy className="w-4 h-4" />
            دوريات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-4">
          <GlobalLeaderboard />
        </TabsContent>

        <TabsContent value="friends" className="mt-4">
          <FriendsLeaderboard />
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <GroupLeagues />
        </TabsContent>
      </Tabs>
    </div>
  );
}
