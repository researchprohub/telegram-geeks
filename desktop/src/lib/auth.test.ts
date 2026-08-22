import { describe, it, expect, beforeEach } from "vitest";
import { useAuth } from "./auth";

let stored: string | null = null;

beforeEach(() => {
  stored = null;
  (globalThis as any).window = {
    api: {
      tokenGet: async () => stored,
      tokenSet: async (v: string) => { stored = v; return true; },
      tokenClear: async () => { stored = null; return true; },
      backendStatus: async () => ({ running: true, started: true }),
    },
  };
  useAuth.setState({ token: null, user: null, status: "loading", backendOk: true });
});

describe("useAuth", () => {
  it("restore() promotes a persisted token to ready", async () => {
    stored = "tok-123";
    await useAuth.getState().restore();
    expect(useAuth.getState().status).toBe("ready");
    expect(useAuth.getState().token).toBe("tok-123");
  });

  it("restore() with no token lands on anon", async () => {
    await useAuth.getState().restore();
    expect(useAuth.getState().status).toBe("anon");
  });

  it("logout() clears token, persists the clear, and lands on anon", async () => {
    stored = "tok-123";
    await useAuth.getState().restore();
    await useAuth.getState().logout();
    expect(useAuth.getState().status).toBe("anon");
    expect(useAuth.getState().token).toBeNull();
    expect(stored).toBeNull();
  });

  it("setSession() stores the user and token", () => {
    useAuth.getState().setSession("tok-999", { id: 1, email: "a@b.c", role: "admin" });
    expect(useAuth.getState().token).toBe("tok-999");
    expect(useAuth.getState().status).toBe("ready");
    expect(useAuth.getState().user?.role).toBe("admin");
  });
});