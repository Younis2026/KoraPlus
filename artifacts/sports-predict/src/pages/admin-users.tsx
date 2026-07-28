import { useState } from 'react';
import { 
  useListAdminUsers,
  getListAdminUsersQueryKey,
  useAdjustUserPoints,
  useResetLeaderboard
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, TrendingUp, TrendingDown, RefreshCcw, Award, CheckCircle, X } from 'lucide-react';

export default function AdminUsersPage() {
  const { data: users, isLoading } = useListAdminUsers();
  const queryClient = useQueryClient();
  
  const adjustPoints = useAdjustUserPoints();
  const resetLeaderboard = useResetLeaderboard();

  const [adjustingUser, setAdjustingUser] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;

    adjustPoints.mutate({ 
      id: adjustingUser.id, 
      data: { adjustment: adjustAmount, reason: adjustReason || 'تعديل إداري' } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
        setAdjustingUser(null);
        setAdjustAmount(0);
        setAdjustReason('');
      }
    });
  };

  const handleReset = (type: 'weekly' | 'monthly') => {
    const period = type === 'weekly' ? 'الأسبوعي' : 'الشهري';
    if (confirm(`هل أنت متأكد من تصفير الترتيب ${period}؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      resetLeaderboard.mutate({ data: { type } }, {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
          alert(res.message);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة المستخدمين</h1>
          <p className="text-slate-400 text-sm mt-1">متابعة المتصدرين وتعديل النقاط</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleReset('weekly')}
            className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold px-4 py-2 rounded-xl transition-colors text-sm border border-amber-500/20 cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" />
            تصفير الأسبوعي
          </button>
          <button 
            onClick={() => handleReset('monthly')}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold px-4 py-2 rounded-xl transition-colors text-sm border border-red-500/20 cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" />
            تصفير الشهري
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : (
        <div className="bg-[#121214] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-slate-300 min-w-[800px]">
              <thead className="bg-[#1c1c1f] text-slate-400 border-b border-white/5 uppercase font-medium">
                <tr>
                  <th className="px-4 py-4 rounded-tr-2xl w-16 text-center">الترتيب</th>
                  <th className="px-4 py-4">المستخدم</th>
                  <th className="px-4 py-4 text-center">المستوى</th>
                  <th className="px-4 py-4 text-center text-emerald-400">النقاط</th>
                  <th className="px-4 py-4 text-center">التوقعات</th>
                  <th className="px-4 py-4 text-center">الدقة</th>
                  <th className="px-4 py-4 rounded-tl-2xl">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users?.map((user, i) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-center font-bold text-white">
                      {user.globalRank || i + 1}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-bold text-white">{user.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex gap-2">
                        <span>@{user.username}</span>
                        <span>•</span>
                        <span>{user.country}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md text-xs border border-white/10 text-orange-300">
                        <Award className="w-3 h-3" />
                        {user.level}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center font-bold text-emerald-400 font-mono text-lg">
                      {user.totalPoints}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {user.totalPredictions}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {user.accuracy}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {adjustingUser?.id === user.id ? (
                        <form onSubmit={handleAdjustSubmit} className="flex items-center gap-2 bg-[#1c1c1f] p-1.5 rounded-lg border border-white/10">
                          <input 
                            type="number" 
                            required 
                            placeholder="+/-" 
                            className="w-16 bg-[#121214] border border-white/10 rounded-md px-2 py-1 text-center text-white focus:border-orange-500 outline-none text-xs" 
                            value={adjustAmount || ''} 
                            onChange={e => setAdjustAmount(Number(e.target.value))} 
                          />
                          <input 
                            type="text" 
                            placeholder="السبب (اختياري)" 
                            className="w-32 bg-[#121214] border border-white/10 rounded-md px-2 py-1 text-white focus:border-orange-500 outline-none text-xs" 
                            value={adjustReason} 
                            onChange={e => setAdjustReason(e.target.value)} 
                          />
                          <button type="submit" disabled={adjustPoints.isPending} className="p-1 bg-orange-500 text-orange-950 rounded-md hover:bg-orange-400 disabled:opacity-50 cursor-pointer">
                            {adjustPoints.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button type="button" onClick={() => setAdjustingUser(null)} className="p-1 bg-white/10 text-slate-400 rounded-md hover:text-white cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <button 
                          onClick={() => setAdjustingUser(user)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors text-xs border border-white/5 cursor-pointer"
                        >
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <TrendingDown className="w-3 h-3 text-red-400" />
                          تعديل النقاط
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">لا يوجد مستخدمين</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
