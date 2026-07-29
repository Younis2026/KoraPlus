import { useRoute, Link } from 'wouter';
import { ArrowRight, Trophy, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useListMatches } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const LEAGUE_META: Record<string, { name: string; flag: string; country: string }> = {
  ucl:        { name: "دوري أبطال أوروبا",  flag: "🏆", country: "أوروبا" },
  laliga:     { name: "الدوري الإسباني",    flag: "🇪🇸", country: "إسبانيا" },
  pl:         { name: "الدوري الإنجليزي",   flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "إنجلترا" },
  bundesliga: { name: "الدوري الألماني",    flag: "🇩🇪", country: "ألمانيا" },
  seriea:     { name: "الدوري الإيطالي",    flag: "🇮🇹", country: "إيطاليا" },
  ligue1:     { name: "الدوري الفرنسي",     flag: "🇫🇷", country: "فرنسا" },
  rospl:      { name: "دوري روشن السعودي",  flag: "🇸🇦", country: "السعودية" },
  uaepro:     { name: "دوري الخليج العربي", flag: "🇦🇪", country: "الإمارات" },
};

export default function LeagueDetailPage() {
  const [, params] = useRoute('/leagues/:id');
  const leagueId = params?.id ?? '';
  const meta = LEAGUE_META[leagueId];

  const { data: matches, isLoading } = useListMatches(
    { filter: 'by_league', leagueId },
    { query: { enabled: !!leagueId } as never },
  );

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Back */}
      <Link href="/matches" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowRight className="w-4 h-4" />
        <span>الدوريات</span>
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-4xl">
          {meta?.flag ?? '🏆'}
        </div>
        <div>
          <h1 className="text-2xl font-black">{meta?.name ?? leagueId}</h1>
          <p className="text-muted-foreground text-sm">{meta?.country ?? ''} · موسم 2024/25</p>
        </div>
      </div>

      {/* Coming soon banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-bold">تفاصيل الدوري قريباً</p>
            <p className="text-sm text-muted-foreground">
              ستتضمن الجدول، الأهداف، والإحصاءات الكاملة.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming matches for this league */}
      <div>
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          المباريات
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : matches && matches.length > 0 ? (
          <div className="space-y-3">
            {matches.map((match, i) => (
              <motion.div key={match.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Link href={`/matches/${match.id}`}>
                  <Card className="hover-elevate cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="font-bold text-sm w-[35%] truncate">{match.homeTeam.name}</span>
                      <div className="flex flex-col items-center gap-1">
                        {match.status === 'finished' || match.status === 'live' ? (
                          <span className="font-black text-xl">{match.homeScore} - {match.awayScore}</span>
                        ) : (
                          <Badge variant="outline">{new Date(match.scheduledAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</Badge>
                        )}
                        {match.status === 'live' && (
                          <span className="text-xs text-red-500 font-bold animate-pulse">{match.minute}'</span>
                        )}
                      </div>
                      <span className="font-bold text-sm w-[35%] truncate text-left">{match.awayTeam.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <p>لا توجد مباريات متاحة لهذا الدوري حالياً</p>
          </div>
        )}
      </div>

      <Button variant="outline" asChild className="w-full">
        <Link href="/matches">عرض جميع المباريات</Link>
      </Button>
    </div>
  );
}
