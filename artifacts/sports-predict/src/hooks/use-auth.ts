import { useCallback, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: "user" | "admin";
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

const TOKEN_KEY = "koraball_supabase_access_token";
const REFRESH_TOKEN_KEY = "koraball_supabase_refresh_token";

function getBasePath() {
  return import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";
}

function getApiUrl(path: string) {
  const base = getBasePath();
  return `${base === "/" ? "" : base}${path}`;
}

function saveTokensFromUrl() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");

  if (!accessToken) return;

  localStorage.setItem(TOKEN_KEY, accessToken);

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  window.history.replaceState(
    {},
    document.title,
    `${window.location.pathname}${window.location.search}`,
  );
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    saveTokensFromUrl();

    const accessToken = localStorage.getItem(TOKEN_KEY);

    if (!accessToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl("/api/auth/user"), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();
      setUser(data.user ?? null);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const login = useCallback(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!supabaseUrl) {
      alert("إعداد تسجيل الدخول غير مكتمل.");
      return;
    }

    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const url =
      `${supabaseUrl}/auth/v1/authorize?provider=google` +
      `&redirect_to=${encodeURIComponent(redirectTo)}`;

    window.location.href = url;
  }, []);

  const logout = useCallback(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const accessToken = localStorage.getItem(TOKEN_KEY);

    if (supabaseUrl && accessToken) {
      void fetch(`${supabaseUrl}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    window.location.href = "/";
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    isAdmin: user?.role === "admin",
    login,
    logout,
    refetch: () => {
      void fetchUser();
    },
  };
}