"use client";

import { useState, useEffect } from "react";
import { Send, ArrowLeft, Play, Loader2, Bot, Image, Calendar, Link, Grid3X3 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function PostbotPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [botToken, setBotToken] = useState("");
  const [postText, setPostText] = useState("");
  const [mediaLink, setMediaLink] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [channelLink, setChannelLink] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } }).then(r => setAccounts(r.data?.items || r.data || [])).catch(() => {});
  }, []);

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  async function handleExecute() {
    if (!botToken || !postText.trim() || !channelLink.trim()) { setError("Fill bot token, post text and channel link"); return; }
    setExecuting(true); setError("");
    try {
      addLog("Creating post...");
      const buttons = buttonText && buttonUrl ? [{ text: buttonText, url: buttonUrl }] : [];
      const r = await api.post("/modules/postbot/execute", {
        operation: "create_post",
        params: {
          bot_token: botToken, text: postText, media_url: mediaLink,
          schedule_at: scheduleTime || null, channel: channelLink,
          inline_buttons: buttons, account_id: accountId || undefined,
        },
      });
      const res = r.data?.result || r.data;
      addLog(`Post created: ${res.message_id || "ok"}`, "success");
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Send className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Postbot Creator</h1><p className="text-xs text-muted-foreground">Create and schedule posts via @postbot</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Account</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Optional — select account...</option>
                {accounts.map((a: any) => (<option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Bot Token</label>
              <input type="text" value={botToken} onChange={e => setBotToken(e.target.value)} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">Post Text (supports spintax)</label>
            <textarea value={postText} onChange={e => setPostText(e.target.value)} rows={5} placeholder="Hello! This is my {first|second|third} post with spintax support."
              className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Media File/Link</label>
              <input type="text" value={mediaLink} onChange={e => setMediaLink(e.target.value)} placeholder="https://example.com/image.jpg"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Schedule Time</label>
              <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">Channel/Chat Link</label>
            <input type="text" value={channelLink} onChange={e => setChannelLink(e.target.value)} placeholder="https://t.me/my_channel"
              className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">Inline Button (optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="Button text"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              <input type="text" value={buttonUrl} onChange={e => setButtonUrl(e.target.value)} placeholder="https://example.com"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <button onClick={handleExecute} disabled={executing || !botToken || !postText.trim() || !channelLink.trim()}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} {executing ? "Creating..." : "Create Post"}
          </button>
        </div>

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Bot Creator", href: "/dashboard/modules/bot-creator" },
          { label: "Autoposting V2", href: "/dashboard/modules/autoposting-v2" },
          { label: "Channel Comments", href: "/dashboard/modules/channel-comments" },
        ]} />

        <ModuleFooter manualSlug="sozdanie-postov-postbot" />
      </div>
    </div>
  );
}
