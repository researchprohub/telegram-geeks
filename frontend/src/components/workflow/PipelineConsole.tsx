"use client";

import { useEffect, useRef } from "react";
import { PipelineRun } from "@/lib/api/workflow";
import { cn } from "@/lib/utils";
import { Terminal, Play, Pause, XCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface PipelineConsoleProps {
  run: PipelineRun | null;
  loading: boolean;
  onCancel: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function PipelineConsole({
  run,
  loading,
  onCancel,
  onPause,
  onResume,
}: PipelineConsoleProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [run?.logs?.length]);

  if (!run && !loading) return null;

  const statusBadge = (status: string) => {
    switch (status) {
      case "running":
        return "bg-primary/20 text-primary border border-primary/30 shadow-sm";
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "failed":
        return "bg-destructive/20 text-destructive border border-destructive/30";
      case "paused":
        return "bg-warning/20 text-warning border border-warning/30";
      default:
        return "bg-secondary text-muted-foreground border border-border";
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-card overflow-hidden shadow-xl shadow-primary/5 space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">PIPELINE RUNNER</span>
          </div>
          {run && (
            <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-bold uppercase", statusBadge(run.status))}>
              {run.status}
            </span>
          )}
          {run?.current_step && (
            <span className="font-mono text-xs text-foreground/80 hidden sm:inline">
              → {run.current_step}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {run?.status === "running" && (
            <button
              onClick={onPause}
              className="text-xs px-3 py-1.5 rounded-lg border border-warning/40 text-warning hover:bg-warning/10 transition flex items-center gap-1.5 font-bold"
            >
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
          )}
          {run?.status === "paused" && (
            <button
              onClick={onResume}
              className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition flex items-center gap-1.5 font-bold"
            >
              <Play className="h-3.5 w-3.5" /> Resume
            </button>
          )}
          {(run?.status === "running" || run?.status === "paused") && (
            <button
              onClick={onCancel}
              className="text-xs px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition flex items-center gap-1.5 font-bold"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Execution Progress</span>
          <span className="text-xs font-mono font-extrabold text-primary">
            {run?.progress ?? 0}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${run?.progress ?? 0}%` }}
          />
        </div>
      </div>

      {/* Log Console */}
      <div
        ref={logRef}
        className="h-48 overflow-y-auto font-mono text-xs p-5 space-y-1.5 bg-secondary/50"
      >
        {loading && !run && (
          <p className="text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            Initializing pipeline runner...
          </p>
        )}
        {run?.logs?.map((log, i) => (
          <div key={i} className="flex gap-3 leading-relaxed">
            <span className="text-muted-foreground/70 shrink-0 font-mono">
              {new Date(log.ts).toLocaleTimeString()}
            </span>
            <span
              className={cn(
                "break-all",
                log.msg.includes("ERROR") || log.msg.includes("failed")
                  ? "text-destructive font-semibold"
                  : log.msg.includes("completed") || log.msg.includes("success")
                  ? "text-primary font-semibold"
                  : log.msg.includes("FloodWait")
                  ? "text-warning font-semibold"
                  : "text-foreground/90"
              )}
            >
              {log.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
