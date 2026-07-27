"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Props {
  text?: string;
  buttonText?: string;
  href?: string;
}

export function RecurringCTA({ text = "Want more? Upgrade your plan to unlock all modules.", buttonText = "Upgrade Plan", href = "/dashboard/settings" }: Props) {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary shrink-0" />
        <p className="text-xs text-foreground">{text}</p>
      </div>
      <Link href={href} className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-1">
        {buttonText} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
