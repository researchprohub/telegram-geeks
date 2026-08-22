"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2, CreditCard, CheckCircle, Clock, AlertCircle, ArrowUpRight, Puzzle, Lock, KeyRound, Copy, Check, Laptop, ShieldCheck, Sparkles, RefreshCw, Download } from "lucide-react";

interface Plan {
  id: string; name: string; price_monthly: number; price_yearly: number;
  accounts: number; campaigns: number; team_seats: number; pro_modules: boolean;
}

interface Subscription {
  plan_tier: string; status: string; started_at: string | null;
  expires_at: string | null; billing_cycle: string; auto_renew: boolean;
  max_accounts: number; max_campaigns: number; team_seats: number;
}

interface Order {
  order_id: string; amount: number; currency: string;
  plan_tier: string | null; billing_cycle: string | null;
  status: string; created_at: string;
}

interface ModulePlan { module_id: string; name: string; price_monthly: number; }

interface UserLicense {
  key: string;
  plan_tier: string;
  duration_days: number;
  max_accounts: number;
  max_campaigns: number;
  team_seats: number;
  allowed_modules: string[];
  hwid?: string | null;
  status: string;
  created_at: string;
  expires_at: string;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Base", pro_1mo: "1 Month", pro_1yr: "1 Year", pro_2yr: "2 Years", pro_3yr: "3 Years", lifetime: "Lifetime", pro: "Pro Plan", agency: "Agency Plan", admin: "Administrator Lifetime"
};

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [modules, setModules] = useState<ModulePlan[]>([]);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [license, setLicense] = useState<UserLicense | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [licenseGenerating, setLicenseGenerating] = useState(false);
  const [licenseSuccess, setLicenseSuccess] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    let loggedIn = false;
    try {
      const meRes = await api.get("/auth/me");
      loggedIn = !!meRes.data;
    } catch { /* not logged in */ }

    try {
      const plansRes = await api.get("/payments/plans");
      setPlans(plansRes.data);
    } catch { setError("Failed to load plans"); }

    if (loggedIn) {
      try {
        const subRes = await api.get("/payments/subscription");
        setSub(subRes.data);
      } catch { /* no sub */ }
      try {
        const ordersRes = await api.get("/payments/orders");
        setOrders(ordersRes.data);
      } catch { /* no orders */ }
      try {
        const modRes = await api.get("/payments/modules");
        setModules(modRes.data.plans);
        setActiveModules(modRes.data.active);
      } catch { /* no modules */ }
      try {
        const licRes = await api.get("/licenses/my-license");
        if (licRes.data?.status === "success") {
          setLicense(licRes.data.license || null);
          setIsPaid(licRes.data.is_paid || false);
        }
      } catch { /* no lic */ }
    }
    setLoading(false);
  }

  async function handleGenerateLicense() {
    setError("");
    setLicenseSuccess("");
    setLicenseGenerating(true);
    try {
      const res = await api.post("/licenses/my-license/generate");
      if (res.data?.status === "success" && res.data?.license) {
        setLicense(res.data.license);
        setLicenseSuccess(res.data.message || "License generated successfully!");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate license.");
    } finally {
      setLicenseGenerating(false);
    }
  }

  async function handleUnbindHwid() {
    setError("");
    setLicenseSuccess("");
    try {
      const res = await api.post("/licenses/my-license/unbind-hwid");
      if (res.data?.status === "success" && res.data?.license) {
        setLicense(res.data.license);
        setLicenseSuccess("Hardware lock successfully cleared! You can now activate on a new machine.");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to unbind hardware lock.");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  async function subscribeModule(module_id: string) {
    try {
      const res = await api.post(`/payments/module-subscribe?module_id=${module_id}`);
      if (res.data?.payment_url) window.open(res.data.payment_url, "_blank");
      await fetchData();
    } catch {
      setError("Failed to start module subscription");
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Billing</h1>
        <p className="text-slate-400 text-sm">Manage your plan and view order history</p>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {sub && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Current Plan</h2>
          <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold text-white capitalize">{PLAN_LABELS[sub.plan_tier] || sub.plan_tier}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    sub.status === "active" ? "bg-success/10 text-success border border-success/20"
                    : "bg-warning/10 text-warning border border-warning/20"
                  }`}>{sub.status}</span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                  <span>Up to {sub.max_accounts} accounts</span>
                  <span>Up to {sub.max_campaigns} campaigns</span>
                  <span>{sub.team_seats} team seat{sub.team_seats > 1 ? "s" : ""}</span>
                  {sub.expires_at && <span>Expires: {new Date(sub.expires_at).toLocaleDateString()}</span>}
                </div>
              </div>
              <CreditCard className="w-8 h-8 text-primary/40" />
            </div>
          </div>
        </section>
      )}

      {/* Desktop Application License Management */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Laptop className="w-5 h-5 text-primary" />
              <span>Windows Desktop License</span>
            </h2>
            <p className="text-xs text-slate-400">1 included standalone license key for your Windows Desktop client</p>
          </div>
          {license && (
            <a
              href="/downloads/TelegramGeeks-Pro-v2.4.0-Windows-x64.zip"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Download Desktop App</span>
            </a>
          )}
        </div>

        {licenseSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{licenseSuccess}</span>
          </div>
        )}

        <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-6 space-y-5">
          {license ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/[0.08]">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    <span>Your Activation Key</span>
                  </span>
                  <div className="font-mono text-base font-bold text-primary tracking-wider select-all">
                    {license.key}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(license.key)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all shrink-0"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? "Copied!" : "Copy Key"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-slate-400 block mb-1">Tier / Quota</span>
                  <span className="font-semibold text-white uppercase">{license.plan_tier}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-slate-400 block mb-1">Status</span>
                  <span className="font-semibold text-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                    {license.status}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-slate-400 block mb-1">Machine HWID Lock</span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {license.hwid ? (
                      <span className="text-cyan-400">Locked ({license.hwid.slice(0, 10)}...)</span>
                    ) : (
                      <span className="text-slate-400">Unbound (Ready for 1st PC)</span>
                    )}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-slate-400 block mb-1">Expiration</span>
                  <span className="font-semibold text-slate-200">
                    {new Date(license.expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {license.hwid && (
                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Switching to a new computer?</span>
                  <button
                    onClick={handleUnbindHwid}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Machine HWID Lock</span>
                  </button>
                </div>
              )}
            </div>
          ) : isPaid ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm">Included Desktop App License Available</h3>
                <p className="text-xs text-slate-400 max-w-lg">
                  Your active subscription entitles your account to 1 standalone Windows x64 Desktop Client license.
                </p>
              </div>
              <button
                onClick={handleGenerateLicense}
                disabled={licenseGenerating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-primary to-cyan-400 text-white hover:opacity-90 active:scale-[0.97] transition-all shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)] disabled:opacity-50 shrink-0"
              >
                {licenseGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{licenseGenerating ? "Generating..." : "Generate Desktop License"}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm">Desktop License Included with Paid Plans</h3>
                <p className="text-xs text-slate-400 max-w-lg">
                  Subscribe to any Starter, Pro, Agency, or Lifetime plan below to unlock your Windows Desktop Application activation key.
                </p>
              </div>
              <a
                href="/#price"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] text-white transition-all shrink-0"
              >
                <span>View Plans</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
              </a>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Available Plans</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.filter(p => p.id !== "starter").map(plan => (
            <div key={plan.id} className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5 hover:bg-white/[0.04] hover:border-primary/30 transition-all">
              <h3 className="font-semibold text-white mb-1">{plan.name}</h3>
              {plan.price_yearly > 0 && <p className="text-2xl font-bold text-primary mb-3">${plan.price_yearly}<span className="text-sm text-slate-400 font-normal">/yr</span></p>}
              {plan.price_monthly > 0 && plan.price_yearly === 0 && <p className="text-2xl font-bold text-primary mb-3">${plan.price_monthly}<span className="text-sm text-slate-400 font-normal">/mo</span></p>}
              <ul className="space-y-1.5 mb-5">
                <li className="text-xs text-slate-400 flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" />{plan.accounts} accounts</li>
                <li className="text-xs text-slate-400 flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" />{plan.campaigns} campaigns</li>
                <li className="text-xs text-slate-400 flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" />{plan.team_seats} team seats</li>
                {plan.pro_modules && <li className="text-xs text-slate-400 flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" />Pro modules</li>}
              </ul>
              <a href="/#price" className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)]">
                Purchase <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {modules.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-white">Module Add-ons</h2>
            <Puzzle className="w-4 h-4 text-primary/50" />
          </div>
          <p className="text-sm text-slate-400 mb-4">Monthly subscriptions for individual tools — independent of your base plan.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map(m => {
              const active = activeModules.includes(m.module_id);
              return (
                <div key={m.module_id} className={`bg-white/[0.02] backdrop-blur-md rounded-2xl border p-5 transition-all ${
                  active ? "border-success/40 bg-success/[0.03]" : "border-white/[0.07] hover:border-primary/30 hover:bg-white/[0.04]"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white">{m.name}</h3>
                    {active
                      ? <span className="text-xs font-medium px-2 py-0.5 rounded-full text-success bg-success/10 border border-success/20">Active</span>
                      : <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                  <p className="text-2xl font-bold text-primary mb-4">${m.price_monthly}<span className="text-sm text-slate-400 font-normal">/mo</span></p>
                  <button
                    onClick={() => subscribeModule(m.module_id)}
                    disabled={active}
                    className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all ${
                      active
                        ? "bg-success/10 text-success cursor-default border border-success/20"
                        : "bg-gradient-to-r from-primary to-cyan-400 hover:opacity-90 shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)]"
                    }`}
                  >
                    {active ? <><CheckCircle className="w-3.5 h-3.5" /> Subscribed</> : <>Subscribe <ArrowUpRight className="w-3.5 h-3.5" /></>}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {orders.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Order History</h2>
          <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Order</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Plan</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Date</th>
              </tr></thead>
              <tbody>{orders.map(o => (
                <tr key={o.order_id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-white font-mono text-xs">{o.order_id.slice(0, 24)}...</td>
                  <td className="px-5 py-3.5 text-white capitalize">{o.plan_tier || "—"}</td>
                  <td className="px-5 py-3.5 text-white">${o.amount}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      o.status === "completed" || o.status === "finished" || o.status === "confirmed"
                        ? "text-success bg-success/10 border border-success/20"
                        : o.status === "pending"
                        ? "text-warning bg-warning/10 border border-warning/20"
                        : "text-slate-400 bg-white/[0.04] border border-white/[0.05]"
                    }`}>
                      {o.status === "completed" || o.status === "finished" || o.status === "confirmed" ? <CheckCircle className="w-3 h-3" /> :
                       o.status === "pending" ? <Clock className="w-3 h-3" /> : null}
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
