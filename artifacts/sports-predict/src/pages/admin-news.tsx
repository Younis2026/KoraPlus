import { useState } from 'react';
import { 
  useListAdminArticles, 
  getListAdminArticlesQueryKey,
  useCreateAdminArticle,
  useUpdateAdminArticle,
  useDeleteAdminArticle
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, Loader2, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminNewsPage() {
  const { data: articles, isLoading } = useListAdminArticles();
  const queryClient = useQueryClient();
  
  const createNews = useCreateAdminArticle();
  const updateNews = useUpdateAdminArticle();
  const deleteNews = useDeleteAdminArticle();

  const [drawerOpen, setDrawerOpen] = useState<'create' | 'edit' | null>(null);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const closeDrawer = () => {
    setDrawerOpen(null);
    setSelectedNews(null);
    setFormData({});
  };

  const openCreate = () => {
    setFormData({
      category: 'breaking',
      isBreaking: false,
      readTimeMinutes: 3,
      tags: ''
    });
    setDrawerOpen('create');
  };

  const openEdit = (article: any) => {
    setSelectedNews(article);
    setFormData({
      ...article,
      tags: article.tags?.join(', ') || ''
    });
    setDrawerOpen('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      readTimeMinutes: Number(formData.readTimeMinutes),
      tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    };

    if (drawerOpen === 'create') {
      createNews.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminArticlesQueryKey() });
          closeDrawer();
        }
      });
    } else {
      updateNews.mutate({ id: selectedNews.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminArticlesQueryKey() });
          closeDrawer();
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الخبر؟')) {
      deleteNews.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminArticlesQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة الأخبار</h1>
          <p className="text-slate-400 text-sm mt-1">نشر وتعديل الأخبار الرياضية</p>
        </div>
        <button 
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-blue-950 font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          نشر خبر جديد
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles?.map((article) => (
            <div key={article.id} className="bg-[#121214] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden flex flex-col transition-all group">
              <div className="h-40 bg-zinc-800 relative overflow-hidden">
                <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {article.isBreaking && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> عاجل
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
                  {article.category === 'breaking' ? 'عاجل' : 
                   article.category === 'transfers' ? 'انتقالات' :
                   article.category === 'injuries' ? 'إصابات' :
                   article.category === 'press_conference' ? 'مؤتمرات' :
                   article.category === 'analysis' ? 'تحليل' : 'أهداف'}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight">{article.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">{article.summary}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="text-xs text-slate-500 dir-ltr">
                    {format(new Date(article.publishedAt), 'MMM dd, HH:mm')}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(article)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(article.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {articles?.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-[#121214] rounded-2xl border border-white/5">
              لا توجد أخبار منشورة
            </div>
          )}
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
              className="fixed inset-y-0 left-0 w-full max-w-xl bg-[#121214] border-r border-white/10 z-50 flex flex-col shadow-2xl"
              dir="rtl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h2 className="text-lg font-bold text-white">
                  {drawerOpen === 'create' ? 'نشر خبر جديد' : 'تعديل الخبر'}
                </h2>
                <button onClick={closeDrawer} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="drawer-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">العنوان</label>
                    <input required type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">الملخص</label>
                    <textarea required value={formData.summary || ''} onChange={e => setFormData({...formData, summary: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 min-h-[80px]" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">المحتوى</label>
                    <textarea required value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 min-h-[200px]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">التصنيف</label>
                      <select value={formData.category || 'breaking'} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                        <option value="breaking">عاجل</option>
                        <option value="transfers">انتقالات</option>
                        <option value="injuries">إصابات</option>
                        <option value="press_conference">مؤتمرات صحفية</option>
                        <option value="analysis">تحليلات</option>
                        <option value="video_highlights">أهداف وملخصات</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">وقت القراءة (دقائق)</label>
                      <input required type="number" min="1" value={formData.readTimeMinutes || 3} onChange={e => setFormData({...formData, readTimeMinutes: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">رابط الصورة</label>
                    <input required type="url" value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 dir-ltr" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">الوسوم (مفصول بفاصلة)</label>
                    <input type="text" value={formData.tags || ''} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="ريال مدريد, دوري الأبطال, إصابة" className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                  </div>

                  <label className="flex items-center gap-3 bg-[#1c1c1f] p-4 rounded-xl border border-red-500/20 cursor-pointer mt-4 hover:bg-red-500/5 transition-colors">
                    <input type="checkbox" checked={formData.isBreaking || false} onChange={e => setFormData({...formData, isBreaking: e.target.checked})} className="w-5 h-5 accent-red-500 cursor-pointer" />
                    <span className="text-red-400 font-bold">تحديد كخبر عاجل (يظهر باللون الأحمر)</span>
                  </label>
                </form>
              </div>

              <div className="p-6 border-t border-white/5 bg-[#121214]">
                <button
                  type="submit"
                  form="drawer-form"
                  disabled={createNews.isPending || updateNews.isPending}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-blue-950 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 cursor-pointer"
                >
                  {(createNews.isPending || updateNews.isPending) && <Loader2 className="w-5 h-5 animate-spin" />}
                  {drawerOpen === 'create' ? 'نشر الخبر' : 'حفظ التعديلات'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
