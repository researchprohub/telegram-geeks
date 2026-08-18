"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2, Check, X, Blocks, Sparkles } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  account: "Account Management",
  gameplay: "Gameplay & Interaction",
  audience: "Audience Growth",
  utility: "Utilities",
  social: "Social & Engagement",
};

export default function FeaturesPricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [myPlan, setMyPlan] = useState<string>("starter");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [plansRes, modulesRes, me] = await Promise.all([
          api.get("/modules/plans"),
          api.get("/modules/"),
          api.get("/auth/me"),
        ]);
        setPlans(plansRes.data || []);
        setModules(modulesRes.data?.modules || []);
        setMyPlan(me.data?.plan_tier || me.data?.role || "starter");
      } catch {
        // partial load still renders
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-8 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const categories = [...new Set(modules.map((m: any) => m.category))];

  const tierLevel: Record<string, number> = { starter: 1, pro: 2, agency: 3, admin: 3 };
  const myLevel = tierLevel[myPlan] || 1;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Features & Pricing</h1>
        <p className="text-sm text-muted-foreground mt-1">Everything your plan unlocks across every module.</p>
      </div>

      {/* Plans */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {plans.map((plan) => {
          const level = tierLevel[plan.tier] || 1;
          const isCurrent = plan.tier === myPlan;
          const isUpgrade = level > tierLevel[myPlan] || 1;
          return (
            <div key={plan.tier} className={`rounded-xl border p-6 bg-card flex flex-col ${isCurrent ? "border-primary ring-1 ring-primary/30" : "border-border"}`}>
              {isCurrent && <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Your plan</span>}
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 flex-1">{plan.description}</p>
              <div className="mt-4">
                <span className="text-2xl font-bold text-foreground">${plan.price_monthly}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
                <span className="block text-xs text-muted-foreground">or ${plan.price_yearly}/yr</span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <p>{plan.accounts_limit} accounts</p>
                <p>{plan.campaigns_limit} campaigns</p>
                <p>{plan.ai_requests_per_day} AI requests/day</p>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {(plan.features || []).slice(0, 6).map((f: string) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Modules by category */}
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Module Catalog</h2>
        <span className="text-xs text-muted-foreground">({modules.length} modules)</span>
      </div>

      <div className="space-y-8">
        {categories.map((cat) => {
          const catModules = modules.filter((m: any) => m.category === cat);
          return (
            <div key={cat}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground/70 mb-3">
                {CATEGORY_LABELS[cat] || cat}
              </h3>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {catModules.map((mod: any) => {
                  const required = tierLevel[mod.tier] || 1;
                  const unlocked = tierLevel[myPlan] >= required || myPlan === "admin";
                  return (
                    <div key={mod.id} className={`rounded-xl border p-4 ${unlocked ? "border-border bg-card" : "border-border bg-card/50 opacity-60"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-sm text-foreground">{mod.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mod.description}</p>
                        </div>
                        {unlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[hsl(var(--success)_/_0.15)] text-success shrink-0">
                            <Check className="h-3 w-3" /> Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-warning/15 text-warning shrink-0">
                            <X className="h-3 w-3" /> {mod.tier}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/60 mt-3">{mod.operations.length} operations</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}