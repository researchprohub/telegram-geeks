"use client";

import { useState, useEffect } from "react";
import { Copy, ArrowLeft, Play, Loader2, Layers, Hash, ArrowRight, Image, Film, FileText, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ModuleHeader } from "@/components/modules/ModuleHeader";
import { AccountPicker, AccountItem } from "@/components/modules/AccountPicker";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel, LogEntry } from "@/components/modules/LogPanel";
import { ModuleExecutionCard } from "@/components/modules/ModuleExecutionCard";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { cn } from "@/lib/utils";

export default function ChannelClonerPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([]);
  const [sourceChannel, setSourceChannel] = useState("");
  const [targetChannel, setTargetChannel] = useState("");
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeFormatting, setIncludeFormatting] = useState(true);
  const [limit, setLimit] = useState(250);

  // Concurrency & delays
  const [threadCount, setThreadCount] = useState(3);
  const [proxyMode, setProxyMode] = useState("account");
  const [proxyStr, setProxyStr] = useState("");
  const [minDelay, setMinDelay] = useState(2);
  const [maxDelay, setMaxDelay] = useState(6);

  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } })
      .then((r) => {
        const items = r.data?.items || r.data || [];
        setAccounts(items);
        if (items.length > 0) {
          setSelectedAccounts([items[0].id]);
        }
      })
      .catch(() => {});
  }, []);

  function addLog(text: string, level: "info" | "success" | "warn" | "error" | "flood" = "info") {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  async function handleExecute() {
    if (selectedAccounts.length === 0 || !sourceChannel.trim() || !targetChannel.trim()) {
      setError("Please select a cloner account and enter both Source and Target channels");
      return;
    }

    setExecuting(true);
    setError("");
    addLog(`Initiating MTProto channel clone: ${sourceChannel} → ${targetChannel}...`, "info");

    try {
      const r = await api.post("/modules/cloner/execute", {
        operation: "clone_channel",
        params: {
          account_id: selectedAccounts[0],
          account_ids: selectedAccounts,
          source_channel: sourceChannel.trim(),
          target_channel: targetChannel.trim(),
          include_media: includeMedia,
          include_formatting: includeFormatting,
          message_limit: limit,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });

      const res = r.data?.result || r.data;
      const count = res.posts || res.messages || limit;
      addLog(`Channel cloning succeeded: Mirrored ${count} posts and media files`, "success");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(`Cloning error: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ModuleHeader
        title="Channel & Group History Cloner"
        description="Duplicate entire channel post feeds, formatting styles, media attachments, and timestamps to new channels"
        icon={<Copy className="h-6 w-6" />}
        category="Content & Cloner"
        planRequired="pro"
        accountCount={accounts.length}
        status={executing ? "running" : "ready"}
      />

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-xs font-semibold text-destructive">
          {error}
        </div>
      )}

      {/* Split Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-7 space-y-5">
          {/* Account Picker */}
          <AccountPicker
            accounts={accounts}
            selectedIds={selectedAccounts}
            onSelectionChange={setSelectedAccounts}
            singleSelect
            label="Cloner Admin Account"
          />

          {/* Source & Destination Channels */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Source & Destination Channels
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Source Channel (To Clone From) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={sourceChannel}
                  onChange={(e) => setSourceChannel(e.target.value)}
                  placeholder="https://t.me/original_channel or @original_channel"
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Destination Target Channel (Your Channel) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={targetChannel}
                  onChange={(e) => setTargetChannel(e.target.value)}
                  placeholder="https://t.me/my_new_channel or -100123456789"
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/50 border border-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMedia}
                    onChange={(e) => setIncludeMedia(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-secondary text-primary accent-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">Mirror Media Files</span>
                    <span className="text-[10px] text-muted-foreground">Photos, videos, files</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/50 border border-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFormatting}
                    onChange={(e) => setIncludeFormatting(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-secondary text-primary accent-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">Preserve Formatting</span>
                    <span className="text-[10px] text-muted-foreground">Bold, markdown, links</span>
                  </div>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-foreground">Post History Limit</label>
                  <span className="font-mono font-bold text-xs text-primary">{limit} posts</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={2000}
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 250)}
                  className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Concurrency & Delays */}
          <ThreadProxyPanel
            threadCount={threadCount}
            onThreadChange={setThreadCount}
            proxyMode={proxyMode}
            onProxyChange={setProxyMode}
            proxyStr={proxyStr}
            onProxyStrChange={setProxyStr}
          />

          <FloodControlPanel
            minDelay={minDelay}
            maxDelay={maxDelay}
            onMinDelayChange={setMinDelay}
            onMaxDelayChange={setMaxDelay}
          />
        </div>

        {/* Right Column: Execution & Stream */}
        <div className="lg:col-span-5 space-y-5">
          <ModuleExecutionCard
            onExecute={handleExecute}
            isExecuting={executing}
            buttonText={`Clone Channel (${limit} Posts)`}
            stats={{
              total: limit,
              rate: executing ? "40 posts/min" : undefined,
            }}
          />

          <LogPanel
            entries={logs}
            title="Cloning Activity Terminal"
            maxHeight="320px"
            onClear={() => setLogs([])}
          />
        </div>
      </div>

      <CrossLinkFooter
        links={[
          { label: "Autoposting V1", href: "/dashboard/modules/autoposting-v1" },
          { label: "Channel Comments", href: "/dashboard/modules/channel-comments" },
          { label: "Forwarder Wizard", href: "/dashboard/modules/forwarder" },
        ]}
      />

      <ModuleFooter manualSlug="channel-cloner" />
    </div>
  );
}
