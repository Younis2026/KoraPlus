import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Trophy, BarChart3, User, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/matches', label: 'المباريات', icon: Trophy },
    { href: '/predictions', label: 'التوقعات', icon: BarChart3 },
    { href: '/leaderboard', label: 'الترتيب', icon: Medal },
    { href: '/profile', label: 'حسابي', icon: User },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl px-4 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary font-sans transition-opacity hover:opacity-80">
            <Trophy className="h-6 w-6 text-primary" />
            توقع بلس
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80 flex items-center gap-2",
                  location === item.href ? "text-primary font-bold" : "text-foreground/60"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-2 pb-safe">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
