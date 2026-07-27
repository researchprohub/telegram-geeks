"use client";

import { useState, useEffect } from "react";
import { Zap, ArrowLeft, Play, RotateCcw, Loader2, Info, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const WARMUP_STAGES = [
  { name: "Read Only", days: "1-3", msgs: 0, reactions: 5, replies: 0, delay: "5m+" },
  { name: "React", days: "4-7", msgs: 0, reactions: 10, replies: 0, delay: "2m+" },
  { name: "Brief Reply", days: "8-14", msgs: 3, reactions: 15, replies: 2, delay: "1m+" },
  { name: "Reply", days: "15-21", msgs: 8, reactions: 20, replies: 5, delay: "30s+" },
  { name: "Share", days: "22-30", msgs: 12, reactions: 25, replies: 8, delay: "15s+" },
  { name: "Full", days: "31+", msgs: 20, reactions: 40, replies: 15, delay: "10s+" },
];

export default function BoosterPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [phone, setPhone] = useState("");
  const [duration, setDuration] = useState(30);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAccounts();
    fetchGroups();
  }, []);

  async function fetchAccounts() {
    try { const r = await api.get("/accounts/", { params: { pageSize: 100 } }); setAccounts(r.data?.items || r.data || []); } catch {}
  }

  async function fetchGroups() {
    try { const r = await api.get("/groups/", { params: { pageSize: 50 } }); setGroups(r.data?.items || r.data || []); } catch {}
  }

  async function checkProgress(p: string) {
    try { const r = await api.post("/modules/booster/execute", { operation: "get_progress", params: { phone: p } }); setProgress(prev => ({ ...prev, [p]: r.data?.result })); }
    catch {}
  }

  async function handleStartWarmup() {
    if (!phone) return;
    setLoading(true); setError("");
    try {
      const targetGroups = groups.filter(g => selectedGroups.includes(g.id)).map(g => ({ chat_id: g.chat_id, title: g.title }));
      await api.post("/modules/booster/execute", { operation: "start_warmup", params: { phone, target_groups: targetGroups, duration_days: duration } });
      checkProgress(phone);
    } catch (e: any) { setError(e.response?.data?.detail || "Failed to start warmup"); }
    finally { setLoading(false); }
  }

  async function handleRunCycle(p: string) {
    setExecuting(p);
    try {
      await api.post("/modules/booster/execute", { operation: "run_warmup_cycle", params: { phone: p } });
      checkProgress(p);
    } catch {}
    finally { setExecuting(null); }
  }

  function getStageForDay(day: number) {
    if (day <= 3) return 0;
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    if (day <= 30) return 4;
    return 5;
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Account Booster</h1>
            <p className="text-xs text-muted-foreground">30-day progressive account warm-up</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Start Warm-Up</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Account</label>
              <select value={phone} onChange={e => { setPhone(e.target.value); if (e.target.value) checkProgress(e.target.value); }} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select account...</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `Account #${a.id}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Duration (days)</label>
              <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={7} max={60} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Target Groups</label>
              <select multiple value={selectedGroups.map(String)} onChange={e => setSelectedGroups([...e.target.selectedOptions].map(o => Number(o.value)))}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary h-20">
                {groups.map((g: any) => <option key={g.id} value={g.id}>{g.title}</option>)}
                {groups.length === 0 && <option disabled>No groups available</option>}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleStartWarmup} disabled={loading || !phone}
                className="w-full bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Start
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Active Warm-Ups</h3>
          {Object.keys(progress).length === 0 ? (
            <p className="text-sm text-muted-foreground">No active warm-ups. Select an account and start above.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(progress).map(([ph, p]: [string, any]) => {
                const stageIdx = p?.current_day ? getStageForDay(p.current_day) : 0;
                const stage = WARMUP_STAGES[stageIdx];
                return (
                  <div key={ph} className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {p?.status === "running" ? <Clock className="h-4 w-4 text-orange-400" /> : <CheckCircle2 className="h-4 w-4 text-green-400" />}
                        <span className="text-sm font-medium text-foreground">{ph}</span>
                      </div>
                      <button onClick={() => handleRunCycle(ph)} disabled={executing === ph}
                        className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors inline-flex items-center gap-1 disabled:opacity-50">
                        {executing === ph ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />} Run Cycle
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span>Day {p?.current_day || 0}/{p?.total_days || duration}</span>
                      <span>Stage: {stage?.name || "—"}</span>
                      <span>Progress: {p?.progress || 0}%</span>
                      <span>Steps: {p?.successful_steps || 0}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${p?.progress || 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Warm-Up Schedule</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Stage</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Days</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">Messages</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">Reactions</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">Replies</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">Min Delay</th>
                </tr>
              </thead>
              <tbody>
                {WARMUP_STAGES.map((s, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-2 px-2 text-foreground font-medium">{s.name}</td>
                    <td className="py-2 px-2 text-muted-foreground">{s.days}</td>
                    <td className="py-2 px-2 text-center text-foreground">{s.msgs}</td>
                    <td className="py-2 px-2 text-center text-foreground">{s.reactions}</td>
                    <td className="py-2 px-2 text-center text-foreground">{s.replies}</td>
                    <td className="py-2 px-2 text-center text-muted-foreground">{s.delay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">How it works</h4>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              The Booster progressively increases account activity over 30+ days, simulating natural human behavior.
              Each stage adds more actions (messages, reactions, replies) with shorter delays.
              Start with at least 3-5 target groups for realistic interaction patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
