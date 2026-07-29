import { ShieldAlert, ArrowRight, LogIn } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAppAuth } from '@/components/auth-provider';

export default function AdminLoginPage() {
  const { login, isAuthenticated, isAdmin, user } = useAppAuth();

  // If authenticated but not admin, show 403
  if (isAuthenticated && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4 font-sans" dir="rtl">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">403 — وصول مرفوض</h1>
          <p className="text-slate-400 text-sm">
            حسابك ({user?.displayName || user?.email}) لا يملك صلاحية الوصول للوحة التحكم.
          </p>
          <Link href="/">
            <Button variant="outline" className="mt-4">العودة للتطبيق</Button>
          </Link>
        </div>
      </div>
    );
  }

  // If authenticated and admin, they'll be redirected by AdminLayout
  if (isAuthenticated && isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4 font-sans" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#121214] rounded-2xl flex items-center justify-center mb-4 border border-white/5 shadow-xl">
            <ShieldAlert className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">لوحة التحكم</h1>
          <p className="text-slate-400 text-sm">سجّل دخولك بحساب المدير للوصول</p>
        </div>

        <div className="bg-[#121214] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
          <Button
            onClick={login}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold py-3 rounded-xl gap-2"
          >
            <LogIn className="w-5 h-5" />
            تسجيل الدخول
          </Button>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
            <ArrowRight className="w-4 h-4" />
            <span>العودة للتطبيق</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
