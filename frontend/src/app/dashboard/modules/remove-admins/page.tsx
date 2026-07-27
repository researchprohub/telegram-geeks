"use client";

import { useState, useEffect } from "react";
import { UserMinus, ArrowLeft, Loader2, Users, ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function RemoveAdminsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [chatUsername, setChatUsername] = useState("");
  const [adminIds, setAdminIds] = useState("");
  const [threadCount, setThreadCount] = useState(5);
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
    if (!chatUsername.trim()) { setError("Enter chat/channel username"); return; }
    setExecuting(true); setError(""); setLog([]);
    try {
      addLog(`Removing administrators from @${chatUsername}...`);
      const r = await api.post("/modules/remove_admins/execute", {
        params: {
          chat: chatUsername.trim(),
          admin_ids: adminIds ? adminIds.split(",").map(s => s.trim()).filter(Boolean) : undefined,
          account_id: accountId || undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
        },
      });
      addLog("Administrators removed", "success");
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
            <ShieldX className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Delete Administrators</h1>
            <p className="text-xs text-muted-foreground">Remove admin privileges from users in chats and channels</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Chat / Channel</label>
                <input type="text" value={chatUsername} onChange={e => setChatUsername(e.target.value)}
                  placeholder="@channel or @group"
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Account (with admin rights)</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)}
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select account...</option>
                  {accounts.map((a: any) => (
                    <option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Admin IDs (comma-separated, leave empty to remove all)</label>
              <input type="text" value={adminIds} onChange={e => setAdminIds(e.target.value)}
                placeholder="123456789, 987654321"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <button onClick={handleExecute} disabled={executing || !chatUsername.trim()}
              className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
              {executing ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Add Administrators", href: "/dashboard/modules/add-admins" },
          { label: "Admin Search", href: "/dashboard/modules/admin-search" },
          { label: "Collect Audience", href: "/dashboard/modules/sbor-auditorii" },
        ]} />

        <ModuleFooter manualSlug="udalit-administratorov" />
      </div>
    </div>
  );
}