import { useState } from 'react';
import { 
  useListPredictionConfigs,
  getListPredictionConfigsQueryKey,
  useUpdatePredictionConfig,
  useListAdminMatches,
  useSettleMatchPredictions,
  getListAdminMatchesQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, CheckCircle } from 'lucide-react';

export default function AdminPredictionsPage() {
  const { data: configs, isLoading } = useListPredictionConfigs();
  const { data: matches } = useListAdminMatches();
  const queryClient = useQueryClient();
  
  const updateConfig = useUpdatePredictionConfig();
  const settlePredictions = useSettleMatchPredictions();

  // Local state to track modifications before saving
  const [localEdits, setLocalEdits] = useState<Record<string, any>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleEdit = (matchId: string, field: string, value: any) => {
    setLocalEdits(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || configs?.find(c => c.matchId === matchId)),
        [field]: value
      }
    }));
  };

  const handleSave = (matchId: string) => {
    const data = localEdits[matchId];
    if (!data) return;
    
    setSavingId(matchId);
    updateConfig.mutate({ matchId, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPredictionConfigsQueryKey() });
        setSavingId(null);
        setLocalEdits(prev => {
          const next = { ...prev };
          delete next[matchId];
          return next;
        });
      },
      onError: () => setSavingId(null)
    });
  };

  const handleSettle = (id: string) => {
    if (confirm('هل أنت متأكد من تسوية هذه المباراة؟')) {
      settlePredictions.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminMatchesQueryKey() });
          alert('تمت التسوية بنجاح');
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">إعدادات التوقعات</h1>
        <p className="text-slate-400 text-sm mt-1">تحكم في فتح/إغلاق التوقعات ونقاط كل مباراة</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
      ) : (
        <div className="bg-[#121214] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-slate-300 min-w-[800px]">
              <thead className="bg-[#1c1c1f] text-slate-400 border-b border-white/5 uppercase font-medium">
                <tr>
                  <th className="px-4 py-4 rounded-tr-2xl">المباراة</th>
                  <th className="px-4 py-4 text-center">التوقعات مفتوحة</th>
                  <th className="px-4 py-4 text-center">النتيجة</th>
                  <th className="px-4 py-4 text-center">الهداف</th>
                  <th className="px-4 py-4 text-center">رجل المباراة</th>
                  <th className="px-4 py-4 text-center">مجموع الأهداف</th>
                  <th className="px-4 py-4 rounded-tl-2xl">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {configs?.map((config) => {
                  const data = localEdits[config.matchId] || config;
                  const isModified = !!localEdits[config.matchId];
                  const match = matches?.find(m => m.id === config.matchId);
                  
                  return (
                    <tr key={config.matchId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap font-bold text-white">
                        {config.matchName}
                        {match && match.status === 'finished' && !match.settledAt && (
                          <span className="block text-xs text-amber-400 mt-1 font-normal">بانتظار التسوية</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={data.isOpen} onChange={e => handleEdit(config.matchId, 'isOpen', e.target.checked)} />
                          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input type="number" min="0" className="w-16 bg-[#1c1c1f] border border-white/10 rounded-lg px-2 py-1.5 text-center text-white focus:border-purple-500 outline-none mx-auto block" value={data.scorePoints} onChange={e => handleEdit(config.matchId, 'scorePoints', Number(e.target.value))} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input type="number" min="0" className="w-16 bg-[#1c1c1f] border border-white/10 rounded-lg px-2 py-1.5 text-center text-white focus:border-purple-500 outline-none mx-auto block" value={data.goalscorерPoints} onChange={e => handleEdit(config.matchId, 'goalscorерPoints', Number(e.target.value))} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input type="number" min="0" className="w-16 bg-[#1c1c1f] border border-white/10 rounded-lg px-2 py-1.5 text-center text-white focus:border-purple-500 outline-none mx-auto block" value={data.momPoints} onChange={e => handleEdit(config.matchId, 'momPoints', Number(e.target.value))} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input type="number" min="0" className="w-16 bg-[#1c1c1f] border border-white/10 rounded-lg px-2 py-1.5 text-center text-white focus:border-purple-500 outline-none mx-auto block" value={data.totalGoalsPoints} onChange={e => handleEdit(config.matchId, 'totalGoalsPoints', Number(e.target.value))} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleSave(config.matchId)} 
                            disabled={!isModified || savingId === config.matchId}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${isModified ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
                          >
                            {savingId === config.matchId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isModified && <span className="text-xs font-bold">حفظ</span>}
                          </button>
                          
                          {match && match.status === 'finished' && !match.settledAt && (
                            <button onClick={() => handleSettle(match.id)} className="p-2 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors flex items-center gap-2 cursor-pointer">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs font-bold">تسوية التوقعات</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {configs?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">لا توجد إعدادات توقعات</td>
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
