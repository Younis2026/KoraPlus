import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Home, LayoutDashboard, Trophy, Newspaper, Target, Users, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const isAuthed = localStorage.getItem('admin_authed');
    if (!isAuthed && location !== '/admin') {
      setLocation('/admin');
    }
  }, [location, setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('admin_authed');
    setLocation('/admin');
  };

  const navItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
    { href: '/admin/matches', icon: Trophy, label: 'المباريات' },
    { href: '/admin/news', icon: Newspaper, label: 'الأخبار' },
    { href: '/admin/predictions', icon: Target, label: 'التوقعات' },
    { href: '/admin/users', icon: Users, label: 'المستخدمون' },
  ];

  if (location === '/admin') {
    return <div dir="rtl" className="min-h-screen bg-[#09090b] text-white font-sans">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 font-sans" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 right-0 z-50 hidden w-64 flex-col border-l border-white/5 bg-[#121214] md:flex">
        <div className="flex h-16 items-center px-6 border-b border-white/5">
          <h1 className="text-xl font-bold text-white tracking-tight">المدير الرياضي</h1>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                location === item.href ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link 
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Home className="h-5 w-5" />
            <span className="font-medium">العودة للتطبيق</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/5 bg-[#121214]/80 px-4 backdrop-blur-md md:hidden">
        <h1 className="text-lg font-bold text-white tracking-tight">المدير الرياضي</h1>
        <div className="flex items-center gap-2">
          <Link href="/" className="p-2 text-slate-400 hover:text-white cursor-pointer">
            <Home className="h-5 w-5" />
          </Link>
          <button onClick={handleLogout} className="p-2 text-red-400 cursor-pointer">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Nav Tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-white/5 bg-[#121214] md:hidden px-2 pb-safe">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 cursor-pointer",
              location === item.href ? "text-emerald-400" : "text-slate-400 hover:text-white"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Main Content */}
      <main className="md:mr-64 pb-16 md:pb-0 p-4 md:p-8 min-h-[100dvh]">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
