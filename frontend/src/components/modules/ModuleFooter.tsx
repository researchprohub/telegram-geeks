"use client";

import { ArrowLeft, BookOpen, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  backHref?: string;
  manualSlug?: string;
}

export function ModuleFooter({ backHref = "/dashboard/modules", manualSlug }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-border mt-6">
      <button onClick={() => router.push(backHref)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Modules
      </button>
      <div className="flex items-center gap-3">
        {manualSlug && (
          <button onClick={() => router.push(`/manuals/${manualSlug}`)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <BookOpen className="h-3.5 w-3.5" /> Manual
          </button>
        )}
        <button onClick={() => router.push("/questions")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="h-3.5 w-3.5" /> FAQ
        </button>
      </div>
    </div>
  );
}
