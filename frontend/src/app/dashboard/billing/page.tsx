"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2, CreditCard, CheckCircle, Clock, AlertCircle, ArrowUpRight } from "lucide-react";

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

const PLAN_LABELS: Record<string, string> = {
  starter: "Base", pro_1mo: "1 Month", pro_1yr: "1 Year", pro_2yr: "2 Years", pro_3yr: "3 Years",
};

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
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
    }
    setLoading(false);
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
