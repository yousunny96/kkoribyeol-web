"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, type User } from "./api";

export interface SignupInput {
  email: string;
  password: string;
  name: string;
  phone: string;
  emergencyName: string;
  emergencyPhone: string;
}

interface AuthState {
  user: User | null;
  /** 로그인 상태 확인이 끝났는지 (끝나기 전에는 로그인 화면으로 보내지 않는다) */
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (input: SignupInput) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    api<User>("/auth/me")
      // 코어 웹은 보호자 전용. 직원 토큰이 남아 있으면 버린다
      .then((u) => (u.kind === "guardian" ? setUser(u) : setToken(null)))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("kb-logout", onLogout);
    return () => window.removeEventListener("kb-logout", onLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>("/auth/login", { method: "POST", body: { email, password } });
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const r = await api<{ token: string; user: User }>("/auth/signup", { method: "POST", body: input });
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, signup, logout }), [user, ready, login, signup, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthProvider 안에서만 쓸 수 있어요.");
  return v;
}

/**
 * 로그인이 필요한 화면을 감싼다. 로그인하지 않았으면 로그인 화면으로 보낸다.
 * (화면에서 막는 것은 안내용이다. 진짜 막는 일은 백엔드가 한다)
 */
export function Guard({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [ready, user, router]);

  if (!ready || !user) return <p className="muted">로그인 상태를 확인하고 있어요…</p>;
  return <>{children}</>;
}
