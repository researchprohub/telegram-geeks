"use client";

import { useState, useEffect } from "react";
import { PlusCircle, ArrowLeft, Loader2, Hash, Users, Radio, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

const chatTypes = [
  { id: "group", label: "Group", icon: Users, desc: "Create a new Telegram group chat" },
  { id: "channel", label: "Channel", icon: Radio, desc: "Create a new Telegram channel" },
  { id: "supergroup", label: "Supergroup", icon: Hash, desc: "Create a supergroup with advanced features" },
];

export default function ChatCreatorPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [chatName, setChatName] = useState("");
  const [chatType, setChatType] = useState("group");
  const [description, setDescription] = useState("");
  const [threadCount, setThreadCount] = useState(1);
  const [proxyMode, setProxyMode] = useState("account");
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [results, setResults] = useState<any[] | null>(null);
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
    if (!chatName.trim()) { setError("Enter a chat name"); return; }
    setExecuting(true); setError(""); setLog([]); setResults(null);
    try {
      addLog(`Creating ${chatType} "${chatName}"...`);
      const r = await api.post("/modules/chat_creator/execute", {
        params: {
          name: chatName.trim(),
          chat_type: chatType,
          description: description.trim(),
          account_id: accountId || undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
        },
      });
      const created = r.data?.result || r.data;
      const items = created.chats || created.result || [created];
      setResults(Array.isArray(items) ? items : [items]);
      const count = Array.isArray(items) ? items.length : 1;
      addLog(`Created ${count} ${chatType}(s)`, count > 0 ? "success" : "warn");
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
            <PlusCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Chat Creator</h1>
            <p className="text-xs text-muted-foreground">Create new Telegram chats, groups, and channels</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {chatTypes.map(t => (
              <button key={t.id} onClick={() => setChatType(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${chatType === t.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                title={t.desc}>
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Name</label>
                <input type="text" value={chatName} onChange={e => setChatName(e.target.value)}
                  placeholder={`New ${chatType} name...`}
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
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Description (optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Chat description..."
                rows={2}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>

            <button onClick={handleExecute} disabled={executing || !chatName.trim()}
              className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlusCircle className="h-3.5 w-3.5" />}
              {executing ? "Creating..." : `Create ${chatType}`}
            </button>
          </div>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />

        {results && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Created ({results.length})</h3>
            <div className="space-y-1">
              {results.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {item.type === "channel" || chatType === "channel" ? <Radio className="h-3.5 w-3.5 text-primary" /> :
                       item.type === "supergroup" || chatType === "supergroup" ? <Hash className="h-3.5 w-3.5 text-primary" /> :
                       <Users className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.title || item.name || chatName}</p>
                      {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline">{item.link}</a>}
                    </div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    chatType === "channel" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                    chatType === "supergroup" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" :
                    "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  }`}>{chatType}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Bot Creator", href: "/dashboard/modules/bot-creator" },
          { label: "Channel Cloner", href: "/dashboard/modules/channel-cloner" },
          { label: "Invite V1", href: "/dashboard/modules/invite-v1" },
        ]} />

        <ModuleFooter manualSlug="chat-creator" />
      </div>
    </div>
  );
}