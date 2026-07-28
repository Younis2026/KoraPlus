import { useState } from 'react';
import { 
  useListAdminMatches, 
  getListAdminMatchesQueryKey,
  useCreateAdminMatch,
  useUpdateAdminMatch,
  useAddMatchEvent,
  useSettleMatchPredictions
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit2, Activity, CheckCircle, Loader2, X, Clock, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function StatusBadge({ status }: { status: string }) {
  if (status === 'live') return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>جارية الآن</span>;
  if (status === 'upcoming') return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-3 h-3" />قادمة</span>;
  if (status === 'postponed') return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">مؤجلة</span>;
  return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">انتهت</span>;
}

export default function AdminMatchesPage() {
  const { data: matches, isLoading } = useListAdminMatches();
  const queryClient = useQueryClient();
  
  const createMatch = useCreateAdminMatch();
  const updateMatch = useUpdateAdminMatch();
  const addEvent = useAddMatchEvent();
  const settlePredictions = useSettleMatchPredictions();

  const [drawerOpen, setDrawerOpen] = useState<'create' | 'edit' | 'event' | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState<any>({});

  const closeDrawer = () => {
    setDrawerOpen(null);
    setSelectedMatch(null);
    setFormData({});
  };

  const openEdit = (match: any) => {
    setSelectedMatch(match);
    setFormData({
      status: match.status,
      homeScore: match.homeScore ?? '',
      awayScore: match.awayScore ?? '',
      minute: match.minute ?? '',
      predictionOpen: match.predictionOpen
    });
    setDrawerOpen('edit');
  };

  const openEvent = (match: any) => {
    setSelectedMatch(match);
    setFormData({
      minute: match.minute ?? 0,
      type: 'goal',
      team: 'home',
      playerName: '',
      description: ''
    });
    setDrawerOpen('event');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMatch.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminMatchesQueryKey() });
        closeDrawer();
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      status: formData.status,
      homeScore: formData.homeScore === '' ? null : Number(formData.homeScore),
      awayScore: formData.awayScore === '' ? null : Number(formData.awayScore),
      minute: formData.minute === '' ? null : Number(formData.minute),
      predictionOpen: formData.predictionOpen
    };
    updateMatch.mutate({ id: selectedMatch.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminMatchesQueryKey() });
        closeDrawer();
      }
    });
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent.mutate({ id: selectedMatch.id, data: { ...formData, minute: Number(formData.minute) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminMatchesQueryKey() });
        closeDrawer();
      }
    });
  };

  const handleSettle = (id: string) => {
    if (confirm('هل أنت متأكد من تسوية هذه المباراة؟ سيتم توزيع النقاط ولن تتمكن من التراجع.')) {
      settlePredictions.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminMatchesQueryKey() });
          alert('تمت التسوية بنجاح');
        }
      });
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة المباريات</h1>
          <p className="text-slate-400 text-sm mt-1">أضف وحدث نتائج وأحداث المباريات</p>
        </div>
        <button 
          onClick={() => { setFormData({ status: 'upcoming', predictionOpen: true }); setDrawerOpen('create'); }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          إضافة مباراة جديدة
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <div className="bg-[#121214] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-slate-300">
              <thead className="bg-[#1c1c1f] text-slate-400 border-b border-white/5 uppercase font-medium">
                <tr>
                  <th className="px-4 py-4 rounded-tr-2xl">المباراة</th>
                  <th className="px-4 py-4">البطولة</th>
                  <th className="px-4 py-4">الموعد</th>
                  <th className="px-4 py-4">الحالة</th>
                  <th className="px-4 py-4">النتيجة</th>
                  <th className="px-4 py-4 rounded-tl-2xl">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {matches?.map((match) => (
                  <tr key={match.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap font-bold text-white">
                      {match.homeTeamName} <span className="text-slate-500 font-normal px-2">ضد</span> {match.awayTeamName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{match.leagueName}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-500" />
                        <span dir="ltr">{format(new Date(match.scheduledAt), 'yyyy-MM-dd HH:mm')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap"><StatusBadge status={match.status} /></td>
                    <td className="px-4 py-4 whitespace-nowrap font-mono text-lg font-bold text-white">
                      {(match.homeScore !== null && match.awayScore !== null) ? `${match.homeScore} - ${match.awayScore}` : '-'}
                      {match.minute && <span className="text-xs text-emerald-400 font-sans ml-2">{match.minute}'</span>}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(match)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer" title="تعديل">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEvent(match)} className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer" title="إضافة حدث">
                          <Activity className="w-4 h-4" />
                        </button>
                        {match.status === 'finished' && !match.settledAt && (
                          <button onClick={() => handleSettle(match.id)} className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer" title="تسوية التوقعات">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {matches?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">لا توجد مباريات</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-full max-w-md bg-[#121214] border-r border-white/10 z-50 flex flex-col shadow-2xl"
              dir="rtl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h2 className="text-lg font-bold text-white">
                  {drawerOpen === 'create' ? 'إضافة مباراة جديدة' : drawerOpen === 'edit' ? 'تحديث المباراة' : 'إضافة حدث'}
                </h2>
                <button onClick={closeDrawer} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {drawerOpen === 'create' && (
                  <form id="drawer-form" onSubmit={handleCreateSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">الفريق المحلي</label>
                        <input required type="text" value={formData.homeTeamName || ''} onChange={e => setFormData({...formData, homeTeamName: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">الفريق الضيف</label>
                        <input required type="text" value={formData.awayTeamName || ''} onChange={e => setFormData({...formData, awayTeamName: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">البطولة / الدوري</label>
                      <input required type="text" value={formData.leagueName || ''} onChange={e => setFormData({...formData, leagueName: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">الملعب</label>
                      <input required type="text" value={formData.venue || ''} onChange={e => setFormData({...formData, venue: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">موعد المباراة</label>
                      <input required type="datetime-local" value={formData.scheduledAt || ''} onChange={e => setFormData({...formData, scheduledAt: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 dir-ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">الحالة</label>
                      <select value={formData.status || 'upcoming'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer">
                        <option value="upcoming">قادمة</option>
                        <option value="live">جارية الآن</option>
                        <option value="finished">انتهت</option>
                        <option value="postponed">مؤجلة</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-3 bg-[#1c1c1f] p-4 rounded-xl border border-white/10 cursor-pointer">
                      <input type="checkbox" checked={formData.predictionOpen || false} onChange={e => setFormData({...formData, predictionOpen: e.target.checked})} className="w-5 h-5 accent-emerald-500 cursor-pointer" />
                      <span className="text-white font-medium">فتح التوقعات</span>
                    </label>
                  </form>
                )}

                {drawerOpen === 'edit' && (
                  <form id="drawer-form" onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl mb-4 border border-white/5">
                      <div className="text-lg font-bold text-white text-center">{selectedMatch.homeTeamName} - {selectedMatch.awayTeamName}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">الحالة</label>
                      <select value={formData.status || 'upcoming'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer">
                        <option value="upcoming">قادمة</option>
                        <option value="live">جارية الآن</option>
                        <option value="finished">انتهت</option>
                        <option value="postponed">مؤجلة</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">أهداف المحلي</label>
                        <input type="number" min="0" value={formData.homeScore} onChange={e => setFormData({...formData, homeScore: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-center font-mono text-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">أهداف الضيف</label>
                        <input type="number" min="0" value={formData.awayScore} onChange={e => setFormData({...formData, awayScore: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-center font-mono text-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">الدقيقة</label>
                      <input type="number" min="0" max="120" value={formData.minute} onChange={e => setFormData({...formData, minute: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <label className="flex items-center gap-3 bg-[#1c1c1f] p-4 rounded-xl border border-white/10 cursor-pointer mt-4">
                      <input type="checkbox" checked={formData.predictionOpen || false} onChange={e => setFormData({...formData, predictionOpen: e.target.checked})} className="w-5 h-5 accent-emerald-500 cursor-pointer" />
                      <span className="text-white font-medium">فتح التوقعات</span>
                    </label>
                  </form>
                )}

                {drawerOpen === 'event' && (
                  <form id="drawer-form" onSubmit={handleEventSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">النوع</label>
                        <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer">
                          <option value="goal">هدف</option>
                          <option value="yellow_card">بطاقة صفراء</option>
                          <option value="red_card">بطاقة حمراء</option>
                          <option value="substitution">تبديل</option>
                          <option value="penalty">ركلة جزاء</option>
                          <option value="var">VAR</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">الدقيقة</label>
                        <input required type="number" min="1" max="120" value={formData.minute} onChange={e => setFormData({...formData, minute: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">الفريق</label>
                      <div className="flex gap-4">
                        <label className="flex-1 flex items-center gap-2 p-3 bg-[#1c1c1f] border border-white/10 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                          <input type="radio" name="team" value="home" checked={formData.team === 'home'} onChange={e => setFormData({...formData, team: e.target.value})} className="accent-emerald-500 cursor-pointer" />
                          <span className="text-white text-sm">{selectedMatch.homeTeamName}</span>
                        </label>
                        <label className="flex-1 flex items-center gap-2 p-3 bg-[#1c1c1f] border border-white/10 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                          <input type="radio" name="team" value="away" checked={formData.team === 'away'} onChange={e => setFormData({...formData, team: e.target.value})} className="accent-emerald-500 cursor-pointer" />
                          <span className="text-white text-sm">{selectedMatch.awayTeamName}</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">اسم اللاعب</label>
                      <input required type="text" value={formData.playerName} onChange={e => setFormData({...formData, playerName: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">وصف الحدث (اختياري)</label>
                      <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                  </form>
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-[#121214]">
                <button
                  type="submit"
                  form="drawer-form"
                  disabled={createMatch.isPending || updateMatch.isPending || addEvent.isPending}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-emerald-950 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 cursor-pointer"
                >
                  {(createMatch.isPending || updateMatch.isPending || addEvent.isPending) && <Loader2 className="w-5 h-5 animate-spin" />}
                  حفظ التغييرات
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
