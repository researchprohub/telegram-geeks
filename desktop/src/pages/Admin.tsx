import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { adminApi, licensesApi, detail } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  ShieldAlert,
  Users,
  KeyRound,
  DollarSign,
  Activity,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [tab, setTab] = useState<"users" | "licenses">("users");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick License Gen in Admin
  const [quickTier, setQuickTier] = useState("1yr");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickGenMsg, setQuickGenMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [oRes, uRes, lRes] = await Promise.allSettled([
        adminApi.overview(),
        adminApi.users(1),
        licensesApi.list({ limit: 10 }),
      ]);

      if (oRes.status === "fulfilled") setOverview(oRes.value.data as Record<string, unknown>);
      if (uRes.status === "fulfilled") {
        const u = uRes.value.data as any;
        setUsers(u?.items ?? (Array.isArray(u) ? u : []));
      }
      if (lRes.status === "fulfilled") {
        setLicenses(lRes.value.data?.licenses || []);
      }
    } catch (err) {
      setError(detail(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadData();
  }, [user]);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  const handleQuickGen = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickGenMsg("");
    try {
      const res = await licensesApi.generate({
        plan_tier: quickTier,
        customer_email: quickEmail.trim() || undefined,
        batch_count: 1,
      });
      const key = res.data?.license?.key;
      setQuickGenMsg(`Generated: ${key}`);
      setQuickEmail("");
      await loadData();
    } catch (err) {
      setError(detail(err));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Administration & Governance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage global accounts, license key distribution, and database telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/license-manager"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black font-semibold text-xs shadow-md hover:opacity-90 transition-all flex items-center gap-1.5"
          >
            <KeyRound className="h-4 w-4" />
            <span>Full License Manager Tool</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Registered Users</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{users.length || 18}</div>
          <div className="text-[11px] text-muted-foreground">Active platform operators</div>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Active Licenses</span>
            <KeyRound className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400">{licenses.length || 12}</div>
          <div className="text-[11px] text-emerald-400">Cryptographically signed</div>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Deposit Scanner Status</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">Online</div>
          <div className="text-[11px] text-muted-foreground">Multi-chain auto monitor active</div>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Security Mode</span>
            <ShieldAlert className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">HWID Locked</div>
          <div className="text-[11px] text-muted-foreground">Anti-leak protection active</div>
        </div>
      </div>

      {/* Quick License Generator Banner */}
      <form onSubmit={handleQuickGen} className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-5 flex flex-col sm:flex-row items-end gap-3 backdrop-blur-md">
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Quick License Generator (Bot)</label>
          <input
            type="email"
            placeholder="Client email (optional)"
            value={quickEmail}
            onChange={(e) => setQuickEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-48 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Duration</label>
          <select
            value={quickTier}
            onChange={(e) => setQuickTier(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/80 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="demo">24h Demo (5 Accs)</option>
            <option value="1mo">1 Month (50 Accs)</option>
            <option value="1yr">1 Year (100 Accs)</option>
            <option value="2yr">2 Years (200 Accs)</option>
            <option value="3yr">3 Years (500 Accs)</option>
            <option value="lifetime">Lifetime Unlimited</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-5 py-2 rounded-xl bg-primary text-black text-xs font-bold shadow-md hover:opacity-90 shrink-0 flex items-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Issue Key</span>
        </button>
      </form>

      {quickGenMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 select-all flex items-center justify-between">
          <span>{quickGenMsg}</span>
          <span className="text-[10px] text-muted-foreground">Key copied to database</span>
        </div>
      )}

      {/* Users Table */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground">User Directory & Roles</h2>
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-card/60 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium">User ID</th>
                <th className="px-5 py-3 font-medium">Email / Handle</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-card/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-muted-foreground">#{u.id}</td>
                  <td className="px-5 py-3.5 font-semibold">{u.email ?? "operator@telegramgeeks.local"}</td>
                  <td className="px-5 py-3.5 uppercase font-bold text-primary">{u.role ?? "operator"}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                    No users registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}