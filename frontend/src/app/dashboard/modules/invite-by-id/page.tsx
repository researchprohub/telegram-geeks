"use client";

import { useState, useEffect } from "react";
import { Hash, ArrowLeft, Play, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function InviteByIdPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [userIds, setUserIds] = useState("");
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(10);
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } }).then(r => setAccounts(r.data?.items || r.data || [])).catch(() => {});
  }, []);

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  async function handleExecute() {
    if (!accountId || !targetGroup || !userIds.trim()) { setError("Fill all fields"); return; }
    setExecuting(true); setError("");
    try {
      const ids = userIds.split("\n").map(s => s.trim()).filter(Boolean);
      addLog(`Inviting ${ids.length} users by ID to ${targetGroup}...`);
      const r = await api.post("/modules/invite_modules/execute", {
        operation: "invite_by_ids",
        params: { account_id: accountId, chat_id: targetGroup, user_ids: ids.map(Number), thread_count: threadCount, proxy_mode: proxyMode, delay_before_action: `${minDelay}-${maxDelay}` },
      });
      const res = r.data?.result || r.data;
      addLog(`Invited ${res.invited || "?"} users`, "success");
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Hash className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Invite by ID</h1><p className="text-xs text-muted-foreground">Invite users by their Telegram user IDs</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Account</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select account...</option>
                {accounts.map((a: any) => (<option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Target Group</label>
              <input type="text" value={targetGroup} onChange={e => setTargetGroup(e.target.value)} placeholder="https://t.me/group" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">User IDs (one per line)</label>
            <textarea value={userIds} onChange={e => setUserIds(e.target.value)} rows={4} placeholder="123456789&#10;987654321" className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
          </div>
          <button onClick={handleExecute} disabled={executing || !accountId || !targetGroup || !userIds.trim()}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Inviting..." : "Invite by ID"}
          </button>
        </div>
        <LogPanel entries={log} />
        <CrossLinkFooter links={[{ label: "Invite V1", href: "/dashboard/modules/invite-v1" }, { label: "Invite V2", href: "/dashboard/modules/invite-v2" }]} />
        <ModuleFooter />
      </div>
    </div>
  );
}
