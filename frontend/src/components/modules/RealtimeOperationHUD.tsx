"use client";

import { useState, useEffect } from "react";
import {
  Play, Pause, Square, CheckCircle2, AlertTriangle, Shield,
  Clock, Activity, Zap, Terminal, ArrowRight, RefreshCw,
  Download, Sparkles, Filter, ChevronRight
} from "lucide-react";

export interface OperationPhase {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "error" | "paused";
}

export interface OperationLogEntry {
  time: string;
  level: "info" | "success" | "warn" | "error" | "flood";
  message: string;
  account?: string;
  target?: string;
}

export interface RealtimeOperationHUDProps {
  moduleName: string;
  moduleCategory?: string;
  isRunning: boolean;
  isPaused?: boolean;
  phases: OperationPhase[];
  currentPhaseIndex: number;
  stats: {
    total: number;
    completed: number;
    success: number;
    failed: number;
    skipped: number;
    speedPerMin?: number;
    floodWaitSeconds?: number;
    estimatedTimeRemaining?: string;
  };
  logs: OperationLogEntry[];
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
}

export function RealtimeOperationHUD({
  moduleName,
  moduleCategory = "MTProto Execution",
  isRunning,
  isPaused = false,
  phases,
  currentPhaseIndex,
  stats,
  logs,
  onPause,
  onResume,
  onStop,
  onRestart,
}: RealtimeOperationHUDProps) {
  const [logFilter, setLogFilter] = useState<string>("all");
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const percentComplete =
    stats.total > 0 ? Math.min(100, Math.round((stats.completed / stats.total) * 100)) : isRunning ? 45 : 0;

  const filteredLogs = logs.filter((l) => {
    if (logFilter === "all") return true;
    return l.level === logFilter;
  });

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden space-y-0 animate-in fade-in duration-200">
      {/* Top HUD Control Bar */}
      <div className="p-4 bg-background/60 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
                isRunning
                  ? isPaused
                    ? "bg-amber-500"
                    : "bg-primary"
                  : stats.completed > 0
                  ? "bg-emerald-600"
                  : "bg-muted"
              }`}
            >
              {isRunning ? (
                isPaused ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Activity className="h-5 w-5 animate-pulse" />
                )
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            {isRunning && !isPaused && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success border-2 border-card animate-ping" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                {moduleName} — Real-Time Process Monitor
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isRunning
                    ? isPaused
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                      : "bg-success/10 border-success/30 text-success"
                    : "bg-secondary border-border text-muted-foreground"
                }`}
              >
                {isRunning ? (isPaused ? "PAUSED" : "ACTIVE RUNNING") : "IDLE / READY"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {moduleCategory} · Real-time MTProto rate monitoring & safety shield
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2">
          {isRunning && (
            <>
              {isPaused ? (
                <button
                  type="button"
                  onClick={onResume}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs"
                >
                  <Play className="h-3.5 w-3.5" />
                  Resume Operation
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPause}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-500 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </button>
              )}
              <button
                type="button"
                onClick={onStop}
                className="px-3.5 py-1.5 rounded-xl bg-destructive/15 hover:bg-destructive/25 border border-destructive/30 text-destructive text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                Abort / Stop
              </button>
            </>
          )}

          {!isRunning && stats.completed > 0 && onRestart && (
            <button
              type="button"
              onClick={onRestart}
              className="px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              New Run
            </button>
          )}
        </div>
      </div>

      {/* Progress & Speed Metrics Strip */}
      <div className="p-4 bg-card grid grid-cols-2 sm:grid-cols-5 gap-3 border-b border-border/80">
        <div className="p-3 bg-secondary/30 rounded-xl border border-border/60">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Progress</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-mono font-bold text-foreground">{percentComplete}%</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              ({stats.completed}/{stats.total || "—"})
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        <div className="p-3 bg-secondary/30 rounded-xl border border-border/60">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Successful</p>
          <div className="text-xl font-mono font-bold text-success mt-0.5">{stats.success}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Confirmed delivered</p>
        </div>

        <div className="p-3 bg-secondary/30 rounded-xl border border-border/60">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Failed / Skipped</p>
          <div className="text-xl font-mono font-bold text-destructive mt-0.5">
            {stats.failed}{" "}
            <span className="text-xs text-muted-foreground font-normal">/ {stats.skipped}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Filtered by safety shield</p>
        </div>

        <div className="p-3 bg-secondary/30 rounded-xl border border-border/60">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Throughput Speed</p>
          <div className="text-xl font-mono font-bold text-primary mt-0.5">
            {stats.speedPerMin || (isRunning ? 18 : 0)}{" "}
            <span className="text-xs text-muted-foreground font-normal">ops/min</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Rate-limited safe speed</p>
        </div>

        <div className="p-3 bg-secondary/30 rounded-xl border border-border/60 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Flood Wait Status</p>
          {stats.floodWaitSeconds && stats.floodWaitSeconds > 0 ? (
            <div className="text-sm font-mono font-bold text-amber-500 mt-0.5 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 animate-spin" />
              {stats.floodWaitSeconds}s cooldown
            </div>
          ) : (
            <div className="text-sm font-mono font-bold text-success mt-0.5 flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              0s · Normal
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">
            {stats.estimatedTimeRemaining ? `ETA: ${stats.estimatedTimeRemaining}` : "Safety intact"}
          </p>
        </div>
      </div>

      {/* Multi-Phase Interactive Visual Pipeline */}
      <div className="p-4 bg-background/30 border-b border-border">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" />
          Process Execution Phases
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {phases.map((phase, idx) => {
            const isCurrent = currentPhaseIndex === idx && isRunning;
            const isPassed = currentPhaseIndex > idx || (!isRunning && stats.completed > 0);
            const isWaiting = currentPhaseIndex < idx && isRunning;

            return (
              <div
                key={phase.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                    : isPassed
                    ? "bg-success/5 border-success/30 text-muted-foreground"
                    : "bg-secondary/20 border-border/60 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                    Step {idx + 1}
                  </span>
                  {isPassed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  ) : isCurrent ? (
                    <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-border shrink-0" />
                  )}
                </div>
                <p className={`text-xs font-bold truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                  {phase.name}
                </p>
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                  {phase.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Terminal / Action Stream */}
      <div className="p-4 bg-card flex flex-col space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Live Execution Console</span>
            <span className="px-2 py-0.2 rounded bg-secondary text-[10px] font-mono text-muted-foreground">
              {filteredLogs.length} events
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-[10px]">
              {["all", "info", "success", "warn", "error"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLogFilter(lvl)}
                  className={`px-2 py-0.5 rounded capitalize font-medium transition-colors ${
                    logFilter === lvl
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Console Box */}
        <div className="bg-background rounded-xl border border-border p-3 h-52 overflow-y-auto font-mono text-xs space-y-1.5 select-text">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
              {isRunning
                ? "Awaiting operational events..."
                : "Console ready. Launch the module above to monitor real-time MTProto logs."}
            </div>
          ) : (
            filteredLogs.map((entry, idx) => {
              const colorClass =
                entry.level === "success"
                  ? "text-success"
                  : entry.level === "error"
                  ? "text-destructive"
                  : entry.level === "warn" || entry.level === "flood"
                  ? "text-amber-500"
                  : "text-foreground";

              return (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-[10px] text-muted-foreground shrink-0">{entry.time}</span>
                  <span
                    className={`text-[9px] uppercase px-1 py-0.2 rounded shrink-0 font-bold ${
                      entry.level === "success"
                        ? "bg-success/15 text-success"
                        : entry.level === "error"
                        ? "bg-destructive/15 text-destructive"
                        : entry.level === "warn"
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {entry.level}
                  </span>
                  <span className={`break-words ${colorClass}`}>{entry.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
