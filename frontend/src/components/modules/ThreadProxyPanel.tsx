"use client";

import { useState, useEffect } from "react";
import { Layers, Globe, RotateCcw } from "lucide-react";

interface Props {
  threadCount: number;
  onThreadChange: (n: number) => void;
  proxyMode: string;
  onProxyChange: (s: string) => void;
  proxyStr?: string;
  onProxyStrChange?: (s: string) => void;
}

export function ThreadProxyPanel({ threadCount, onThreadChange, proxyMode, onProxyChange, proxyStr, onProxyStrChange }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <Layers className="h-3.5 w-3.5" /> Threads
          </label>
          <input type="number" min={1} max={50} value={threadCount} onChange={e => onThreadChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <Globe className="h-3.5 w-3.5" /> Proxy
          </label>
          <select value={proxyMode} onChange={e => onProxyChange(e.target.value)}
            className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
            <option value="account">From Account</option>
            <option value="custom">Custom</option>
            <option value="none">No Proxy</option>
          </select>
          {proxyMode === "custom" && onProxyStrChange && (
            <input type="text" value={proxyStr || ""} onChange={e => onProxyStrChange(e.target.value)} placeholder="socks5://user:pass@ip:port"
              className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary mt-2" />
          )}
        </div>
      </div>
    </div>
  );
}
