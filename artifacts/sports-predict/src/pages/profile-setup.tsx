import { useState } from 'react';
import { useLocation } from 'wouter';
import { User, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';

export default function ProfileSetupPage() {
  const { user, refetch } = useAppAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const suggested = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : '';

  const [displayName, setDisplayName] = useState(suggested);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      toast({ title: 'يجب أن يكون الاسم حرفين على الأقل', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/profile/setup', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      await refetch();
      toast({ title: 'تم حفظ اسمك بنجاح 🎉' });
      setLocation('/');
    } catch {
      toast({ title: 'حدث خطأ، يرجى المحاولة مرة أخرى', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSkip() {
    setLocation('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">أهلاً بك! 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">
              اختر اسم العرض الذي سيظهر في التطبيق
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">اسم العرض</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="أدخل اسمك..."
                className="pr-10"
                maxLength={50}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              سيظهر هذا الاسم في الترتيب والتوقعات وفي الملف الشخصي
            </p>
          </div>

          <Button
            type="submit"
            className="w-full font-black h-12 rounded-xl"
            disabled={isSubmitting || displayName.trim().length < 2}
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ والمتابعة'}
          </Button>
        </form>

        <button
          onClick={handleSkip}
          className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          تخطي للآن
        </button>
      </div>
    </div>
  );
}
