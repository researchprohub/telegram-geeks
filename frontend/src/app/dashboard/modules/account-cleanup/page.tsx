"use client";

import { useState, useEffect } from "react";
import { Eraser, ArrowLeft, Play, Loader2, Users, MessageSquare, CheckCheck, ShieldOff, Hash, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

const MODES = [
  { id: "mass_unsubscribe", label: "Mass Unsubscribe", icon: UserMinus },
  { id: "delete_dialogs", label: "Delete Dialogs", icon: MessageSquare },
  { id: "read_dialogs", label: "Read Dialogs", icon: CheckCheck },
  { id: "lift_restrictions", label: "Lift Restrictions", icon: ShieldOff },
] as const;

type CleanupMode = (typeof MODES)[number]["id"];

export default function AccountCleanupPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [accountId, setAccountId] = useState("");
  const [mode, setMode] = useState<CleanupMode>("mass_unsubscribe");
  const [chatList, setChatList] = useState("");
  const [dialogCount, setDialogCount] = useState(50);
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(8);
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } }).then(r => setAccounts(r.data?.items || r.data || [])).catch(() => {});
  }, []);

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  function toggleAccount(phone: string) {
    setSelectedAccounts(prev => prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]);
  }

  async function handleExecute() {
    if (mode === "mass_unsubscribe" && (selectedAccounts.length === 0 || !chatList.trim())) { setError("Select accounts and enter chat list"); return; }
    if ((mode === "delete_dialogs" || mode === "read_dialogs") && selectedAccounts.length === 0) { setError("Select at least one account"); return; }
    if (mode === "lift_restrictions" && !accountId) { setError("Select an account"); return; }
    setExecuting(true); setError("");
    try {
      addLog(`${mode === "mass_unsubscribe" ? "Unsubscribing" : mode === "delete_dialogs" ? "Deleting dialogs" : mode === "read_dialogs" ? "Marking dialogs read" : "Lifting restrictions"}...`);
      const r = await api.post("/modules/account_cleanup/execute", {
        operation: mode,
        params: {
          account_phones: selectedAccounts, account_id: accountId,
          chat_list: chatList.split("\n").map(s => s.trim()).filter(Boolean),
          dialog_count: dialogCount,
          thread_count: threadCount, proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });
      const res = r.data?.result || r.data;
      addLog(`Done: ${res.processed || res.count || "ok"}`, "success");
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Eraser className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Account Cleanup Tools</h1><p className="text-xs text-muted-foreground">Clean up groups, dialogs, and account restrictions</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>

          {mode === "lift_restrictions" ? (
            <div className="mb-3">
              <label className="block text-xs text-muted-foreground mb-1">Account</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select account...</option>
                {accounts.map((a: any) => (<option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>))}
              </select>
            </div>
          ) : (
            <div className="mb-3">
              <label className="block text-xs text-muted-foreground mb-1">Select Accounts</label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {accounts.map((a: any) => {
                  const phone = a.phone_number || a.phone;
                  return (
                    <label key={a.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-secondary/50">
                      <input type="checkbox" checked={selectedAccounts.includes(phone)} onChange={() => toggleAccount(phone)}
                        className="rounded border-border bg-secondary accent-primary" />
                      <span className="text-sm text-foreground">{phone || `#${a.id}`}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {mode === "mass_unsubscribe" && (
            <div className="mb-3">
              <label className="block text-xs text-muted-foreground mb-1">Chat List (one per line)</label>
              <textarea value={chatList} onChange={e => setChatList(e.target.value)} rows={4} placeholder="https://t.me/group1&#10;https://t.me/group2&#10;@some_channel"
                className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
          )}

          {(mode === "delete_dialogs" || mode === "read_dialogs") && (
            <div className="mb-3">
              <label className="block text-xs text-muted-foreground mb-1">Recent Dialogs to Affect</label>
              <input type="number" min={1} max={1000} value={dialogCount} onChange={e => setDialogCount(parseInt(e.target.value) || 50)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}

          <button onClick={handleExecute} disabled={executing}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} {executing ? "Running..." : "Execute"}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Mass Subscriptions", href: "/dashboard/modules/mass-subscriptions" },
          { label: "Folder Manager", href: "/dashboard/modules/folder-manager" },
          { label: "Mass Inspection", href: "/dashboard/modules/mass-inspection" },
        ]} />

        <ModuleFooter manualSlug="massovyie-otpiski" />
      </div>
    </div>
  );
}
