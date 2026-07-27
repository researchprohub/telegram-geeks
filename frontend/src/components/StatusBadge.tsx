"use client";

type StatusVariant = "active" | "spamblock_temp" | "spamblock_perm" | "frozen" | "archived" | "banned" | "suspended" | "warming" | "deleted";

const statusConfig: Record<string, { label: string; classes: string }> = {
  active:         { label: "Active",        classes: "bg-success/15 text-success border-success/20" },
  spamblock_temp: { label: "Temp Block",    classes: "bg-warning/15 text-warning border-warning/20" },
  spamblock_perm: { label: "Perm Block",    classes: "bg-error/15 text-error border-error/20" },
  frozen:         { label: "Frozen",        classes: "bg-info/10 text-info/70 border-info/20" },
  archived:       { label: "Archived",      classes: "bg-muted/10 text-muted border-muted/20" },
  banned:         { label: "Banned",        classes: "bg-error/20 text-error border-error/30" },
  suspended:      { label: "Suspended",     classes: "bg-warning/10 text-warning border-warning/20" },
  warming:        { label: "Warming",       classes: "bg-blue-100/15 text-blue-400 border-blue-400/20" },
  deleted:        { label: "Deleted",       classes: "bg-muted/5 text-muted/60 border-muted/10" },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { label: status, classes: "bg-muted/10 text-muted border-muted/20" };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
