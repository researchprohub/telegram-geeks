"use client";

import { useState, useEffect } from "react";
import { Shield, ArrowLeft, Play, Loader2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function InviteViaAdminV2Page() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [sourceGroup, setSourceGroup] = useState("");
  const [maxInvites, setMaxInvites] = useState(100);
  const [threadCount, setThreadCount] = useState(3);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(5);
  const [maxDelay, setMaxDelay] = useState(15);
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } }).then(r => setAccounts(r.data?.items || r.data || [])).catch(() => {});
  }, []);

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  async function handleExecute() {
    if (!accountId || !targetGroup || !sourceGroup) { setError("Fill all fields"); return; }
    setExecuting(true); setError("");
    try {
      addLog(`Admin-smart inviting: ${sourceGroup} → ${targetGroup}...`);
      const r = await api.post("/modules/invite_modules/execute", {
        operation: "admin_smart_invite",
        params: { account_id: accountId, source_chat_id: sourceGroup, target_chat_id: targetGroup, max_invites: maxInvites, thread_count: threadCount, proxy_mode: proxyMode, delay_before_action: `${minDelay}-${maxDelay}` },
      });
      const res = r.data?.result || r.data;
      addLog(`Invited ${res.invited || "?"} users via admin smart`, "success");
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Zap className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Invite via Admin V2</h1><p className="text-xs text-muted-foreground">Smart admin invite: collect + invite via admin</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Admin Account</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select account...</option>
                {accounts.map((a: any) => (<option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Max Invites</label>
              <input type="number" min={1} max={500} value={maxInvites} onChange={e => setMaxInvites(parseInt(e.target.value) || 100)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Source (collect from)</label>
              <input type="text" value={sourceGroup} onChange={e => setSourceGroup(e.target.value)} placeholder="https://t.me/source" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Target (invite to)</label>
              <input type="text" value={targetGroup} onChange={e => setTargetGroup(e.target.value)} placeholder="https://t.me/target" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <button onClick={handleExecute} disabled={executing || !accountId || !sourceGroup || !targetGroup}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Inviting..." : "Admin Smart Invite"}
          </button>
        </div>
        <LogPanel entries={log} />
        <CrossLinkFooter links={[{ label: "Invite V1", href: "/dashboard/modules/invite-v1" }, { label: "Invite V2", href: "/dashboard/modules/invite-v2" }]} />
        <ModuleFooter />
      </div>
    </div>
  );
}
