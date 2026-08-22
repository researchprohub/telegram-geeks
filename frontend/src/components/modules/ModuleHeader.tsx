"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Shield, Layers, Globe, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleHeaderProps {
  title: string;
  description: string;
  icon: ReactNode;
  category?: string;
  planRequired?: "starter" | "pro" | "enterprise";
  accountCount?: number;
  proxyCount?: number;
  status?: "idle" | "running" | "ready" | "error";
  children?: ReactNode;
}

export function ModuleHeader({
  title,
  description,
  icon,
  category = "Operation",
  planRequired = "starter",
  accountCount,
  proxyCount,
  status = "ready",
  children,
}: ModuleHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-card border-b border-border px-6 py-4 rounded-2xl shadow-sm space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/modules")}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground hover:text-primary transition-all flex items-center justify-center shrink-0"
            title="Back to Modules Catalog"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shadow-primary/10">
              {icon}
            </div>
            <span
              className={cn(
                "absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-card",
                status === "running"
                  ? "bg-warning animate-pulse"
                  : status === "error"
                  ? "bg-destructive"
                  : "bg-success"
              )}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-foreground tracking-tight">{title}</h1>
              <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-bold uppercase tracking-wider border border-border">
                {category}
              </span>
              {planRequired === "pro" && (
                <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/30 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> PRO
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>

        {/* Live System Status Badges */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {accountCount !== undefined && (
            <div className="px-3 py-1.5 rounded-xl bg-secondary/70 border border-border flex items-center gap-2 text-xs">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Accounts:</span>
              <span className="font-bold text-foreground">{accountCount}</span>
            </div>
          )}

          {proxyCount !== undefined && (
            <div className="px-3 py-1.5 rounded-xl bg-secondary/70 border border-border flex items-center gap-2 text-xs">
              <Globe className="h-3.5 w-3.5 text-warning" />
              <span className="text-muted-foreground">Proxies:</span>
              <span className="font-bold text-foreground">{proxyCount}</span>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-secondary/70 border border-border flex items-center gap-2 text-xs">
            <Radio className={cn("h-3.5 w-3.5", status === "running" ? "text-warning animate-pulse" : "text-success")} />
            <span className="text-muted-foreground">Engine:</span>
            <span
              className={cn(
                "font-bold uppercase text-[10px] tracking-wider",
                status === "running" ? "text-warning" : "text-success"
              )}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      {children && <div className="pt-2 border-t border-border/60">{children}</div>}
    </div>
  );
}
