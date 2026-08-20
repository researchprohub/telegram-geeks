import { useEffect } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

const NAV = [
  { to: "/", label: "Dashboard", icon: "Home" },
  { to: "/accounts", label: "Accounts", icon: "Users" },
  { to: "/modules", label: "Modules", icon: "Blocks" },
  { to: "/campaigns", label: "Campaigns", icon: "Megaphone" },
  { to: "/personas", label: "Personas", icon: "Bot" },
  { to: "/groups", label: "Groups", icon: "UsersRound" },
  { to: "/analytics", label: "Analytics", icon: "BarChart3" },
  { to: "/neuro-text", label: "Neuro-Text", icon: "Sparkles" },
  { to: "/converter", label: "Converter", icon: "RefreshCw" },
  { to: "/booster", label: "Booster", icon: "Zap" },
  { to: "/billing", label: "Billing", icon: "CreditCard" },
  { to: "/settings", label: "Settings", icon: "Settings" },
];

export default function Layout() {
  const { user, status, logout, setBackendOk, backendOk } = useAuth();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const st = await window.api?.backendStatus();
      if (!cancelled && st) setBackendOk(st.started);
    };
    check();
    const id = setInterval(check, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [setBackendOk]);

  if (status === "anon") return <Navigate to="/login" replace />;
  if (!backendOk) return <Navigate to="/backend-error" replace />;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-56 shrink-0 border-r border-border bg-background flex flex-col">
        <div className="px-4 py-4 font-semibold text-primary">TelegramGeeks</div>
        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${location.pathname === item.to ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <div className="truncate text-sm text-foreground">{user?.full_name || user?.email || user?.email}</div>
            <div className="text-xs text-muted-foreground">{user?.role}</div>
          </div>
          <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => logout()}>Logout</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}