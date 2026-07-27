"use client";

import { useState, useEffect } from "react";
import { Edit3, ArrowLeft, Loader2, Trash2, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

const editModes = [
  { id: "edit", label: "Edit Text", icon: Edit3, desc: "Change message content" },
  { id: "delete", label: "Delete", icon: Trash2, desc: "Remove messages from chats" },
];

export default function MessageEditorPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [mode, setMode] = useState("edit");
  const [chatUsername, setChatUsername] = useState("");
  const [messageId, setMessageId] = useState("");
  const [newText, setNewText] = useState("");
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

  async function handleExecute() {
    if (!chatUsername.trim()) { setError("Enter chat/channel username"); return; }
    setExecuting(true); setError(""); setLog([]);
    try {
      addLog(`${mode === "edit" ? "Editing" : "Deleting"} message in @${chatUsername}...`);
      const r = await api.post("/modules/message_editor/execute", {
        params: {
          mode,
          chat: chatUsername.trim(),
          message_id: mode === "delete" && messageId ? messageId : undefined,
          new_text: mode === "edit" ? newText : undefined,
          account_id: accountId || undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
        },
      });
      addLog(`Operation completed`, "success");
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
            <Edit3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Changing Messages</h1>
            <p className="text-xs text-muted-foreground">Edit or delete messages in chats and channels</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {editModes.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                title={m.desc}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Chat Username</label>
                <input type="text" value={chatUsername} onChange={e => setChatUsername(e.target.value)}
                  placeholder="@channel or @group"
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
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
              {mode === "delete" ? (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Message IDs</label>
                  <input type="text" value={messageId} onChange={e => setMessageId(e.target.value)}
                    placeholder="1234, 1235"
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">New Text</label>
                  <input type="text" value={newText} onChange={e => setNewText(e.target.value)}
                    placeholder="Updated message text..."
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}
            </div>

            <button onClick={handleExecute} disabled={executing || !chatUsername.trim()}
              className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : mode === "edit" ? <Edit3 className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
              {executing ? "Processing..." : mode === "edit" ? "Edit" : "Delete"}
            </button>
          </div>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Mass Messaging", href: "/dashboard/modules/mass-messaging" },
          { label: "Autoposting V1", href: "/dashboard/modules/autoposting-v1" },
          { label: "Forwarder", href: "/dashboard/modules/forwarder" },
        ]} />

        <ModuleFooter manualSlug="izmenenie-soobscheniy" />
      </div>
    </div>
  );
}