"use client";

export default function HealthBar({ score, className = "" }: { score?: number | null; className?: string }) {
  const s = score ?? 0;
  const pct = Math.max(0, Math.min(100, s));
  const color =
    pct >= 67 ? "bg-success" : pct >= 34 ? "bg-warning" : "bg-error";

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="h-1.5 w-16 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}
