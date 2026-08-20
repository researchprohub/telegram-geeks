import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { modulesApi, accountsApi } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Dashboard() {
  const { user } = useAuth();
  const [total, setTotal] = useState(0);
  const [accounts, setAccounts] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, a] = await Promise.all([modulesApi.list(), accountsApi.list()]);
        if (!cancelled) {
          setTotal(m.data.total);
          setAccounts((a.data as any)?.total ?? (Array.isArray(a.data) ? a.data.length : 0));
        }
      } catch { /* leave defaults */ }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header>
        <h1>Welcome back, {user?.full_name || user?.email}</h1>
        <p className="text-muted-foreground">Your Telegram Geeks control center.</p>
      </header>
      <div className="grid grid-cols-2 gap-4">
        <Link to="/modules" className="card p-5 transition-colors hover:bg-primary/10">
          <div className="text-3xl font-bold text-primary">{total}</div>
          <div className="text-sm text-muted-foreground">Modules</div>
        </Link>
        <Link to="/accounts" className="card p-5 transition-colors hover:bg-primary/10">
          <div className="text-3xl font-bold text-primary">{accounts}</div>
          <div className="text-sm text-muted-foreground">Accounts</div>
        </Link>
      </div>
    </div>
  );
}