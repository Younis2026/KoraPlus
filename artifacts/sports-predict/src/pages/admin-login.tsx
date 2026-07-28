import { useState } from 'react';
import { useLocation } from 'wouter';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'admin123') {
      localStorage.setItem('admin_authed', 'true');
      setLocation('/admin/dashboard');
    } else {
      setError(true);
      setPasscode('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4 font-sans" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#121214] rounded-2xl flex items-center justify-center mb-4 border border-white/5 shadow-xl">
            <ShieldAlert className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">لوحة التحكم</h1>
          <p className="text-slate-400 text-sm">أدخل رمز المرور للوصول للإدارة</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#121214] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
          <div>
            <input
              type="password"
              placeholder="رمز الدخول..."
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(false);
              }}
              className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-[0.2em] focus:outline-none focus:border-emerald-500/50 transition-colors"
              dir="ltr"
            />
            {error && <p className="text-red-400 text-sm text-center mt-3">رمز الدخول غير صحيح</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold py-3 rounded-xl transition-colors"
          >
            دخول
          </button>
        </form>
        
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
