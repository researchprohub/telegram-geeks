"use client";

import { Layers, Globe, Shield, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreadProxyPanelProps {
  threadCount: number;
  onThreadChange: (n: number) => void;
  proxyMode: string;
  onProxyChange: (s: string) => void;
  proxyStr?: string;
  onProxyStrChange?: (s: string) => void;
  maxThreads?: number;
}

export function ThreadProxyPanel({
  threadCount,
  onThreadChange,
  proxyMode,
  onProxyChange,
  proxyStr,
  onProxyStrChange,
  maxThreads = 50,
}: ThreadProxyPanelProps) {
  const quickThreads = [1, 5, 10, 20, 30, 50].filter((n) => n <= maxThreads);

  const proxyOptions = [
    { id: "account", label: "Account Bound", desc: "Uses proxy tied to selected account" },
    { id: "pool", label: "Alive Proxy Pool", desc: "Rotates through verified alive proxies" },
    { id: "custom", label: "Custom Proxy", desc: "SOCKS5 / HTTP dedicated endpoint" },
    { id: "none", label: "Direct Connection", desc: "Direct IP without proxy (High Risk)" },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Concurrency & Network Routing Engine
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
          Multi-Threaded
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Concurrency Threads */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              Parallel Execution Threads
            </label>
            <span className="font-mono font-black text-sm text-primary px-2.5 py-0.5 rounded-lg bg-secondary border border-border">
              {threadCount} {threadCount === 1 ? "Thread" : "Threads"}
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={maxThreads}
            value={threadCount}
            onChange={(e) => onThreadChange(parseInt(e.target.value) || 1)}
            className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-1.5 flex-wrap">
            {quickThreads.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onThreadChange(n)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all",
                  threadCount === n
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                )}
              >
                {n}x
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Number of simultaneous MTProto socket workers executing tasks.
          </p>
        </div>

        {/* Proxy Routing */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-warning" />
            Proxy Routing Policy
          </label>

          <div className="grid grid-cols-2 gap-2">
            {proxyOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onProxyChange(opt.id)}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all",
                  proxyMode === opt.id
                    ? "bg-primary/10 border-primary shadow-xs"
                    : "bg-secondary/40 border-border hover:bg-secondary"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-bold block truncate",
                    proxyMode === opt.id ? "text-primary" : "text-foreground"
                  )}
                >
                  {opt.label}
                </span>
                <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>

          {proxyMode === "custom" && onProxyStrChange && (
            <div className="pt-1">
              <input
                type="text"
                value={proxyStr || ""}
                onChange={(e) => onProxyStrChange(e.target.value)}
                placeholder="socks5://user:pass@127.0.0.1:1080 or ip:port"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
