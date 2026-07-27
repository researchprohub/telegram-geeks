"use client";

import { Timer } from "lucide-react";

interface Props {
  minDelay: number;
  maxDelay: number;
  onMinDelayChange: (n: number) => void;
  onMaxDelayChange: (n: number) => void;
  actionDelay?: number;
  onActionDelayChange?: (n: number) => void;
}

export function FloodControlPanel({ minDelay, maxDelay, onMinDelayChange, onMaxDelayChange, actionDelay, onActionDelayChange }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
        <Timer className="h-3.5 w-3.5" /> Flood Control
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Min Delay (s)</label>
          <input type="number" min={1} value={minDelay} onChange={e => onMinDelayChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Max Delay (s)</label>
          <input type="number" min={1} value={maxDelay} onChange={e => onMaxDelayChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
        </div>
        {onActionDelayChange !== undefined && (
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Action Delay (s)</label>
            <input type="number" min={1} value={actionDelay ?? minDelay} onChange={e => onActionDelayChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
