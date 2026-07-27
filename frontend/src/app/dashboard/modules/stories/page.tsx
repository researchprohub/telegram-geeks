"use client";

import { useState, useEffect } from "react";
import { BookOpen, ArrowLeft, Play, Loader2, Send, Trash2, Download, MessageCircle, File } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function StoriesPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [chatLink, setChatLink] = useState("");
  const [mode, setMode] = useState<"publish" | "delete" | "export" | "comment">("publish");
  const [storyText, setStoryText] = useState("");
  const [deleteCount, setDeleteCount] = useState(5);
  const [commentText, setCommentText] = useState("");
  const [storyLink, setStoryLink] = useState("");
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(5);
  const [maxDelay, setMaxDelay] = useState(15);
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
    const required = mode === "publish" ? accountId && chatLink && storyText : mode === "delete" ? accountId && chatLink : mode === "export" ? accountId && chatLink : mode === "comment" ? accountId && storyLink && commentText : false;
    if (!required) { setError("Fill required fields"); return; }
    setExecuting(true); setError("");
    try {
      addLog(`Running ${mode} on stories...`);
      const r = await api.post("/modules/stories/execute", {
        operation: mode === "publish" ? "publish_story" : mode === "delete" ? "delete_stories" : mode === "export" ? "export_stories" : "comment_story",
        params: {
          account_id: accountId,
          chat_link: chatLink || undefined,
          text: storyText || undefined,
          delete_count: mode === "delete" ? deleteCount : undefined,
          story_link: storyLink || undefined,
          comment_text: commentText || undefined,
          thread_count: threadCount,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });
      const res = r.data?.result || r.data;
      addLog(res.message || `${mode} completed`, "success");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg); addLog(msg, "error");
    } finally { setExecuting(false); }
  }

  const MODES = [
    { id: "publish", label: "Publish", icon: Send },
    { id: "delete", label: "Delete", icon: Trash2 },
    { id: "export", label: "Export", icon: Download },
    { id: "comment", label: "Comment", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Stories</h1>
            <p className="text-xs text-muted-foreground">Manage Telegram stories</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>

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
              <label className="block text-xs text-muted-foreground mb-1">Chat Link</label>
              <input type="text" value={chatLink} onChange={e => setChatLink(e.target.value)} placeholder="https://t.me/username or -100..."
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {mode === "publish" && (
            <>
              <div className="mt-3">
                <label className="block text-xs text-muted-foreground mb-1">Story Content</label>
                <textarea value={storyText} onChange={e => setStoryText(e.target.value)} rows={4}
                  placeholder="Write your story content here..."
                  className="w-full bg-secondary border-0 rounded-lg p-3 text-sm text-foreground resize-y outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="mt-3">
                <label className="block text-xs text-muted-foreground mb-1">Attachment (optional)</label>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border bg-secondary/30">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload image or file</span>
                  <input type="file" className="hidden" />
                </div>
              </div>
            </>
          )}

          {mode === "delete" && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">Stories to Delete</label>
              <input type="number" min={1} max={50} value={deleteCount} onChange={e => setDeleteCount(parseInt(e.target.value) || 5)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}

          {mode === "comment" && (
            <>
              <div className="mt-3">
                <label className="block text-xs text-muted-foreground mb-1">Story Link / ID</label>
                <input type="text" value={storyLink} onChange={e => setStoryLink(e.target.value)} placeholder="https://t.me/username/123 or story ID"
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="mt-3">
                <label className="block text-xs text-muted-foreground mb-1">Comment Text</label>
                <textarea value={commentText} onChange={e => setCommentText(e.target.value)} rows={3}
                  placeholder="Write your comment..."
                  className="w-full bg-secondary border-0 rounded-lg p-3 text-sm text-foreground resize-y outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </>
          )}

          <button onClick={handleExecute} disabled={executing}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Executing..." : `Execute ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Mass Messaging", href: "/modules/mass-messaging" },
          { label: "Channel Comments", href: "/modules/channel-comments" },
          { label: "Views Booster", href: "/modules/views-booster" },
        ]} />

        <ModuleFooter manualSlug="stories" />
      </div>
    </div>
  );
}
