"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";

interface LogEntry {
  time: string;
  text: string;
  level?: "info" | "success" | "error" | "warn";
}

interface Props {
  entries: LogEntry[];
  title?: string;
  maxHeight?: string;
}

const levelColor: Record<string, string> = {
  info: "text-blue-400",
  success: "text-green-400",
  error: "text-red-400",
  warn: "text-yellow-400",
};

export function LogPanel({ entries, title = "Log", maxHeight = "300px" }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Terminal className="h-3.5 w-3.5" /> {title}
      </div>
      <div className="bg-black/90 dark:bg-black rounded-lg p-3 font-mono text-xs overflow-y-auto" style={{ maxHeight }}>
        {entries.length === 0 ? (
          <div className="text-gray-500 italic">No output yet</div>
        ) : (
          entries.map((e, i) => (
            <div key={i} className="leading-5">
              <span className="text-gray-500">{e.time}</span>{" "}
              <span className={levelColor[e.level || "info"] || "text-gray-300"}>{e.text}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
