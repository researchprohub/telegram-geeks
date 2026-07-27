"use client";

import { useState, useEffect } from "react";
import { MousePointerClick, ArrowLeft, Loader2, Send, Search, Users, UserPlus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

const actions = [
  { id: "send", label: "Send Message", icon: Send },
  { id: "invite", label: "Invite to Chat", icon: UserPlus },
  { id: "inspect", label: "Inspect Health", icon: Search },
  { id: "spamblock", label: "Check SpamBlock", icon: Settings },
];

const targetTypes = [
  { id: "user", label: "User", icon: Users },
  { id: "group", label: "Group", icon: Users },
];

export default function AccountSelectorPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [action, setAction] = useState("send");
  const [target, setTarget] = useState("");
  const [targetMode, setTargetMode] = useState("user");
  const [threadCount, setThreadCount] = useState(1);
  const [proxyMode, setProxyMode] = useState("account");
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } })
      .then(r => setAccounts(r.data?.items || r.data || []))
      .catch(() => {});
  }, []);

  function addLog(text: string, level = "info") {
    setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  async function handleExecute() {
    if (!target.trim()) { setError("Enter a target"); return; }
    setExecuting(true); setError(""); setLog([]);
    try {
      addLog(`Executing "${action}" on selected account...`);
      const r = await api.post("/modules/account_selector/execute", {
        params: {
          action,
          target: target.trim(),
          target_type: targetMode,
          account_id: accountId || undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
        },
      });
      addLog(`Action completed: ${action}`, "success");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(msg, "error");
    } finally { setExecuting(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MousePointerClick className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Select Action with Account</h1>
            <p className="text-xs text-muted-foreground">Run targeted actions from a single account</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {actions.map(a => (
              <button key={a.id} onClick={() => setAction(a.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${action === a.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <a.icon className="h-3.5 w-3.5" /> {a.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Account</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)}
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select account...</option>
                  {accounts.map((a: any) => (
                    <option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Target Type</label>
                <div className="flex items-center gap-2">
                  {targetTypes.map(t => (
                    <button key={t.id} onClick={() => setTargetMode(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-1 ${targetMode === t.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                      <t.icon className="h-3.5 w-3.5" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Target {targetMode === "user" ? "Username / Link" : "Group Username / Link"}
              </label>
              <input type="text" value={target} onChange={e => setTarget(e.target.value)}
                placeholder={targetMode === "user" ? "@username or t.me/username" : "@groupname or t.me/group"}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <button onClick={handleExecute} disabled={executing || !target.trim()}
              className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MousePointerClick className="h-3.5 w-3.5" />}
              {executing ? "Running..." : "Execute"}
            </button>
          </div>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Mass Inspection", href: "/dashboard/modules/mass-inspection" },
          { label: "Mass Messaging", href: "/dashboard/modules/mass-messaging" },
          { label: "Account Cleanup", href: "/dashboard/modules/account-cleanup" },
        ]} />

        <ModuleFooter manualSlug="vyibrat-deystvie-s-akkauntom" />
      </div>
    </div>
  );
}