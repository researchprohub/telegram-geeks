"use client";

import { Timer, ShieldAlert, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloodControlPanelProps {
  minDelay: number;
  maxDelay: number;
  onMinDelayChange: (n: number) => void;
  onMaxDelayChange: (n: number) => void;
  actionDelay?: number;
  onActionDelayChange?: (n: number) => void;
}

export function FloodControlPanel({
  minDelay,
  maxDelay,
  onMinDelayChange,
  onMaxDelayChange,
  actionDelay,
  onActionDelayChange,
}: FloodControlPanelProps) {
  const presets = [
    { label: "Turbo Fast", min: 1, max: 3, desc: "High throughput, higher ban risk", color: "text-destructive" },
    { label: "Standard", min: 3, max: 8, desc: "Optimal balance for aged accounts", color: "text-warning" },
    { label: "Stealth Mode", min: 10, max: 30, desc: "Maximum safety with human-like jitter", color: "text-success" },
  ];

  const applyPreset = (min: number, max: number) => {
    onMinDelayChange(min);
    onMaxDelayChange(max);
    if (onActionDelayChange) onActionDelayChange(min);
  };

  const isPresetActive = (min: number, max: number) => minDelay === min && maxDelay === max;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Timer className="h-4 w-4 text-warning" />
          Anti-FloodWait & Human Delay Randomizer
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Flood Bus Active
        </span>
      </div>

      {/* Safety Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {presets.map((p) => {
          const active = isPresetActive(p.min, p.max);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p.min, p.max)}
              className={cn(
                "p-2.5 rounded-xl border text-left transition-all",
                active
                  ? "bg-primary/10 border-primary shadow-xs"
                  : "bg-secondary/40 border-border hover:bg-secondary"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-bold", active ? "text-primary" : "text-foreground")}>
                  {p.label}
                </span>
                <span className="font-mono text-[11px] font-bold text-muted-foreground">
                  {p.min}-{p.max}s
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{p.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Custom Min / Max Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">
            Minimum Delay (seconds)
          </label>
          <input
            type="number"
            min={0}
            max={maxDelay}
            value={minDelay}
            onChange={(e) => onMinDelayChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">
            Maximum Delay (seconds)
          </label>
          <input
            type="number"
            min={minDelay}
            max={300}
            value={maxDelay}
            onChange={(e) => onMaxDelayChange(Math.max(minDelay, parseInt(e.target.value) || minDelay))}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {onActionDelayChange !== undefined && (
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              Action Interval (seconds)
            </label>
            <input
              type="number"
              min={1}
              value={actionDelay ?? minDelay}
              onChange={(e) => onActionDelayChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        )}
      </div>

      <div className="p-3 rounded-xl bg-secondary/60 border border-border flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Random Gaussian Jitter Window:</span>
        <span className="font-mono font-bold text-primary">
          ~{minDelay}s to {maxDelay}s (avg {((minDelay + maxDelay) / 2).toFixed(1)}s/action)
        </span>
      </div>
    </div>
  );
}
