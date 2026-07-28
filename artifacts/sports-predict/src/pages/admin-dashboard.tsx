import { useGetAdminStats } from '@workspace/api-client-react';
import { Trophy, Newspaper, Target, Users, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'المباريات',
      value: stats.totalMatches,
      icon: Trophy,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      href: '/admin/matches',
      sub: (
        <div className="flex gap-2 text-xs mt-2">
          <span className="text-emerald-400">{stats.liveMatches} جارية</span>
          <span className="text-amber-400">{stats.upcomingMatches} قادمة</span>
        </div>
      )
    },
    {
      title: 'الأخبار',
      value: stats.totalArticles,
      icon: Newspaper,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      href: '/admin/news',
      sub: <div className="text-xs mt-2 text-red-400">{stats.breakingNewsCount} أخبار عاجلة</div>
    },
    {
      title: 'التوقعات',
      value: stats.totalPredictions,
      icon: Target,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      href: '/admin/predictions',
      sub: stats.pendingSettlements > 0 
        ? <div className="text-xs mt-2 text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded-md inline-block">{stats.pendingSettlements} تنتظر التسوية</div>
        : <div className="text-xs mt-2 text-slate-400">لا توجد تسويات معلقة</div>
    },
    {
      title: 'المستخدمون',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      href: '/admin/users',
      sub: <div className="text-xs mt-2 text-orange-400">{stats.activeThisWeek} نشط هذا الأسبوع</div>
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">نظرة عامة</h1>
        <p className="text-slate-400 text-sm mt-1">إحصائيات وحالة النظام</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
          >
            <Link href={card.href} className="block bg-[#121214] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{card.value.toLocaleString('en-US')}</div>
              <div className="text-slate-400 text-sm font-medium">{card.title}</div>
              {card.sub}
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-white mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/admin/matches" className="flex items-center gap-3 bg-[#121214] p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors cursor-pointer text-white">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <span className="font-medium">إضافة مباراة</span>
          </Link>
          <Link href="/admin/news" className="flex items-center gap-3 bg-[#121214] p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer text-white">
            <Newspaper className="w-5 h-5 text-blue-400" />
            <span className="font-medium">نشر خبر</span>
          </Link>
          <Link href="/admin/predictions" className="flex items-center gap-3 bg-[#121214] p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors cursor-pointer text-white">
            <Target className="w-5 h-5 text-purple-400" />
            <span className="font-medium">تسوية التوقعات</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
