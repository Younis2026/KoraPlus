import { useCallback, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: 'user' | 'admin';
  displayName: string | null;
  isProfileComplete: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
  refetch: () => void;
}

function getBasePath() {
  return import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch('/api/auth/user', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cancel = fetchUser();
    return cancel;
  }, [fetchUser]);

  const login = useCallback(() => {
    const base = getBasePath();
    const returnTo = encodeURIComponent(window.location.pathname.replace(base, '') || '/');
    window.location.href = `/api/login?returnTo=${returnTo}`;
  }, []);

  const logout = useCallback(() => {
    window.location.href = `/api/logout?returnTo=/`;
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user != null,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    refetch: fetchUser,
  };
}
