import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-8xl font-black text-primary animate-pulse drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">404</h1>
      <h2 className="mt-4 text-2xl font-bold">الصفحة غير موجودة</h2>
      <p className="mt-2 text-muted-foreground mb-8 max-w-sm">
        عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. قد تكون محذوفة أو تم تغيير رابطها.
      </p>
      <Button asChild size="lg" className="rounded-full font-bold px-8">
        <Link href="/">العودة للرئيسية</Link>
      </Button>
    </div>
  );
}
