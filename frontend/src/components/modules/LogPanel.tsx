"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, Copy, Trash2, ArrowDown, Download, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogEntry {
  time: string;
  text: string;
  level?: "info" | "success" | "error" | "warn" | "flood";
}

interface LogPanelProps {
  entries: LogEntry[];
  title?: string;
  maxHeight?: string;
  onClear?: () => void;
}

export function LogPanel({
  entries,
  title = "Real-Time Execution Terminal",
  maxHeight = "360px",
  onClear,
}: LogPanelProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries, autoScroll]);

  const handleCopy = () => {
    const text = entries.map((e) => `[${e.time}] [${(e.level || "info").toUpperCase()}] ${e.text}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = entries.map((e) => `[${e.time}] [${(e.level || "info").toUpperCase()}] ${e.text}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `execution-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = entries.filter((e) =>
    filter === "" || e.text.toLowerCase().includes(filter.toLowerCase()) || (e.level || "").includes(filter.toLowerCase())
  );

  const levelStyles: Record<string, { badge: string; text: string }> = {
    info: { badge: "bg-primary/20 text-primary border-primary/30", text: "text-foreground" },
    success: { badge: "bg-success/20 text-success border-success/30", text: "text-success" },
    warn: { badge: "bg-warning/20 text-warning border-warning/30", text: "text-warning" },
    flood: { badge: "bg-warning/30 text-warning border-warning/40", text: "text-warning" },
    error: { badge: "bg-destructive/20 text-destructive border-destructive/30", text: "text-destructive" },
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
      {/* Terminal Titlebar */}
      <div className="bg-secondary/70 border-b border-border px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
          </div>
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-xs font-black uppercase tracking-wider text-foreground">{title}</span>
          <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-mono font-bold">
            {entries.length} lines
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter log..."
              className="bg-card border border-border rounded-lg pl-7 pr-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary w-28 sm:w-36"
            />
          </div>

          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              "px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all",
              autoScroll
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            )}
            title="Toggle Auto-Scroll"
          >
            <ArrowDown className="h-3 w-3" /> Auto
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={entries.length === 0}
            className="p-1.5 rounded-lg bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
            title="Copy Logs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={entries.length === 0}
            className="p-1.5 rounded-lg bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
            title="Download Log File"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={entries.length === 0}
              className="p-1.5 rounded-lg bg-card border border-border hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all disabled:opacity-40"
              title="Clear Logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Output Body */}
      <div
        className="p-3.5 font-mono text-xs overflow-y-auto space-y-1.5 bg-background/95 select-text"
        style={{ maxHeight, minHeight: "220px" }}
      >
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs italic">
            {entries.length === 0 ? "Terminal standing by. Ready to execute task." : "No logs match the filter."}
          </div>
        ) : (
          filtered.map((e, i) => {
            const lvl = e.level || "info";
            const style = levelStyles[lvl] || levelStyles.info;
            return (
              <div key={i} className="flex items-start gap-2 leading-relaxed hover:bg-secondary/40 px-1.5 py-0.5 rounded transition-colors">
                <span className="text-muted-foreground text-[10px] font-semibold shrink-0 pt-0.5">
                  [{e.time}]
                </span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded uppercase text-[9px] font-black tracking-wider border shrink-0",
                    style.badge
                  )}
                >
                  {lvl}
                </span>
                <span className={cn("break-all text-xs", style.text)}>
                  {e.text}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
