/* Sesión de autenticación: token + usuario + login/logout. */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getToken, setToken } from "../api/client";
import { login, logout as apiLogout, me } from "../api/endpoints";
import type { AuthUser } from "../api/types";
import { AuthContext, type AuthCtx, type Session } from "./auth-context";

const SESSION_KEY = "yakuai-session";

function loadStored(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw || !getToken()) return null;
    const user = JSON.parse(raw) as AuthUser;
    if (!user || !user.role) return null;
    return { user, token: getToken() };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(() => loadStored());
  const [ready, setReady] = useState(() => !getToken());

  useEffect(() => {
    let alive = true;
    if (!getToken()) {
      return () => {
        alive = false;
      };
    }
    me()
      .then((user) => {
        if (!alive) return;
        setSession((s) => (s ? { ...s, user } : s));
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        } catch {
          /* sin almacenamiento */
        }
      })
      .catch(() => {
        if (!alive) return;
        setToken("");
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch {
          /* sin almacenamiento */
        }
        setSession(null);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((tokenValue: string, user: AuthUser) => {
    setToken(tokenValue);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch {
      /* sin almacenamiento */
    }
    setSession({ user, token: tokenValue });
  }, []);

  const signInPassword = useCallback(
    async (email: string, password: string) => {
      const res = await login(email.trim(), password);
      persist(res.access_token, res.user);
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    try {
      if (getToken()) await apiLogout();
    } catch {
      /* salir aunque falle el servidor */
    }
    setToken("");
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* sin almacenamiento */
    }
    setSession(null);
  }, []);

  // Si el API responde 401 (token vencido/revocado), cerrar sesión local.
  useEffect(() => {
    const onUnauthorized = (): void => {
      setToken("");
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {
        /* sin almacenamiento */
      }
      setSession(null);
    };
    window.addEventListener("yakuai-unauthorized", onUnauthorized);
    return () => window.removeEventListener("yakuai-unauthorized", onUnauthorized);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      ready,
      signInPassword,
      signOut,
      role: session?.user.role ?? null,
      displayName: session?.user.name ?? "",
    }),
    [session, ready, signInPassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

