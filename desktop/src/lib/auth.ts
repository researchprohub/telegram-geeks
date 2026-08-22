import { create } from "zustand";

export type AuthStatus = "loading" | "ready" | "anon";
export interface SessionUser { id: number; email: string; role: string; full_name?: string; }

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  status: AuthStatus;
  backendOk: boolean;
  restore: () => Promise<void>;
  setSession: (token: string, user: SessionUser) => void;
  logout: () => Promise<void>;
  setBackendOk: (ok: boolean) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  status: "loading",
  backendOk: true,
  restore: async () => {
    const token = await window.api?.tokenGet();
    if (token) {
      try {
        const res = await fetch("http://127.0.0.1:8765/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          set({ token, user, status: "ready" });
          return;
        }
      } catch {}
      set({ token, status: "ready" });
      return;
    }
    set({ token: null, user: null, status: "anon" });
  },
  setSession: (token, user) => set({ user, token, status: "ready" }),
  logout: async () => {
    await window.api?.tokenClear();
    set({ user: null, token: null, status: "anon" });
  },
  setBackendOk: (ok) => set({ backendOk: ok }),
}));