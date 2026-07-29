import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Navigation } from '@/components/navigation';
import { useAppAuth } from '@/components/auth-provider';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAppAuth();
  const [location, setLocation] = useLocation();

  // Redirect first-time users to set their display name
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    if (location === '/profile/setup') return;
    if (user && !user.isProfileComplete) {
      setLocation('/profile/setup');
    }
  }, [isLoading, isAuthenticated, user, location, setLocation]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground overflow-x-hidden relative">
      <div className="flex-1 pb-16 md:pb-0 relative z-10">
        {children}
      </div>
      <Navigation />
      {/* Decorative noise/texture */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
    </div>
  );
}
