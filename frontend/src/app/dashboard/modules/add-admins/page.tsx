"use client";

import { useState, useEffect } from "react";
import { UserPlus, ArrowLeft, Loader2, Shield, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

const adminRights = [
  { id: "change_info", label: "Change Info" },
  { id: "post_messages", label: "Post Messages" },
  { id: "edit_messages", label: "Edit Messages" },
  { id: "delete_messages", label: "Delete Messages" },
  { id: "ban_users", label: "Ban Users" },
  { id: "invite_users", label: "Invite Users" },
  { id: "pin_messages", label: "Pin Messages" },
  { id: "add_admins", label: "Add Admins" },
  { id: "anonymous", label: "Anonymous" },
  { id: "manage_call", label: "Manage Calls" },
  { id: "manage_topics", label: "Manage Topics" },
  { id: "post_stories", label: "Post Stories" },
  { id: "edit_stories", label: "Edit Stories" },
  { id: "delete_stories", label: "Delete Stories" },
];

export default function AddAdminsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [chatUsername, setChatUsername] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [selectedRights, setSelectedRights] = useState<string[]>(["change_info", "post_messages", "invite_users"]);
  const [threadCount, setThreadCount] = useState(3);
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

  function toggleRight(id: string) {
    setSelectedRights(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  }

  async function handleExecute() {
    if (!chatUsername.trim()) { setError("Enter chat/channel username"); return; }
    if (!targetUsername.trim()) { setError("Enter target username"); return; }
    setExecuting(true); setError(""); setLog([]);
    try {
      addLog(`Adding @${targetUsername} as admin to @${chatUsername}...`);
      const r = await api.post("/modules/add_admins/execute", {
        params: {
          chat: chatUsername.trim(),
          target: targetUsername.trim(),
          rights: selectedRights,
          account_id: accountId || undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
        },
      });
      addLog("Administrator added", "success");
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
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Add Administrators</h1>
            <p className="text-xs text-muted-foreground">Grant admin rights to users in your chats and channels</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Chat / Channel</label>
              <input type="text" value={chatUsername} onChange={e => setChatUsername(e.target.value)}
                placeholder="@channel or @group"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Target User</label>
              <input type="text" value={targetUsername} onChange={e => setTargetUsername(e.target.value)}
                placeholder="@username"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-muted-foreground mb-1">Account (with admin rights)</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
              <option value="">Select account...</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-muted-foreground mb-1">Admin Rights ({selectedRights.length} selected)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {adminRights.map(right => (
                <button key={right.id} onClick={() => toggleRight(right.id)}
                  className={`text-[10px] font-medium px-2 py-1.5 rounded-md transition-colors text-left ${selectedRights.includes(right.id) ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                  {right.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleExecute} disabled={executing || !chatUsername.trim() || !targetUsername.trim()}
            className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            {executing ? "Adding..." : "Add Admin"}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Remove Administrators", href: "/dashboard/modules/remove-admins" },
          { label: "Admin Search", href: "/dashboard/modules/admin-search" },
          { label: "Invite via Admin", href: "/dashboard/modules/invite-via-admin-v1" },
        ]} />

        <ModuleFooter manualSlug="dobavit-administratorov" />
      </div>
    </div>
  );
}