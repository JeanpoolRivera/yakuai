import { createContext, useContext } from "react";
import type { AuthUser, Role } from "../api/types";

export interface Session {
  user: AuthUser;
  token: string;
}

export interface AuthCtx {
  session: Session | null;
  ready: boolean;
  signInPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  role: Role | null;
  displayName: string;
}

export const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}
