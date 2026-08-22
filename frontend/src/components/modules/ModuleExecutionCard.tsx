"use client";

import { Play, Square, Loader2, Download, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleExecutionCardProps {
  onExecute: () => void;
  onStop?: () => void;
  isExecuting: boolean;
  canExecute?: boolean;
  buttonText?: string;
  progressPct?: number;
  stats?: {
    total?: number;
    success?: number;
    failed?: number;
    rate?: string;
  };
  onExportCsv?: () => void;
  onExportJson?: () => void;
  hasResults?: boolean;
}

export function ModuleExecutionCard({
  onExecute,
  onStop,
  isExecuting,
  canExecute = true,
  buttonText = "Launch Task Execution",
  progressPct,
  stats,
  onExportCsv,
  onExportJson,
  hasResults = false,
}: ModuleExecutionCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Task Execution Control
          </h3>
          <p className="text-xs text-foreground font-semibold mt-0.5">
            {isExecuting ? "Executing task loop via MTProto workers..." : "Configured and ready to start"}
          </p>
        </div>

        {/* Export Buttons */}
        {hasResults && (
          <div className="flex items-center gap-2">
            {onExportCsv && (
              <button
                type="button"
                onClick={onExportCsv}
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-primary" /> Export CSV
              </button>
            )}
            {onExportJson && (
              <button
                type="button"
                onClick={onExportJson}
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-warning" /> Export JSON
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar & Live Stats */}
      {(isExecuting || stats) && (
        <div className="space-y-2 pt-1">
          {progressPct !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-primary">{progressPct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden border border-border/40">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(2, progressPct))}%` }}
                />
              </div>
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
              {stats.total !== undefined && (
                <div className="p-2 rounded-xl bg-secondary/50 border border-border text-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total</span>
                  <span className="text-sm font-black font-mono text-foreground">{stats.total}</span>
                </div>
              )}
              {stats.success !== undefined && (
                <div className="p-2 rounded-xl bg-success/10 border border-success/20 text-center">
                  <span className="text-[10px] text-success uppercase font-bold block">Success</span>
                  <span className="text-sm font-black font-mono text-success">{stats.success}</span>
                </div>
              )}
              {stats.failed !== undefined && (
                <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                  <span className="text-[10px] text-destructive uppercase font-bold block">Failed</span>
                  <span className="text-sm font-black font-mono text-destructive">{stats.failed}</span>
                </div>
              )}
              {stats.rate && (
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-center">
                  <span className="text-[10px] text-primary uppercase font-bold block">Speed</span>
                  <span className="text-sm font-black font-mono text-primary">{stats.rate}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Execution CTA */}
      <div className="flex items-center gap-3">
        {isExecuting ? (
          <button
            type="button"
            onClick={onStop}
            className="flex-1 py-3 px-4 rounded-xl bg-destructive text-destructive-foreground font-black text-sm hover:bg-destructive/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-destructive/20"
          >
            <Square className="h-4 w-4 fill-current" /> Stop Operation
          </button>
        ) : (
          <button
            type="button"
            onClick={onExecute}
            disabled={!canExecute}
            className="flex-1 py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-black text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-4 w-4 fill-current" /> {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
