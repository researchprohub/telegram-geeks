"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface LinkItem {
  label: string;
  href: string;
}

interface Props {
  title?: string;
  links: LinkItem[];
}

export function CrossLinkFooter({ title = "See also", links }: Props) {
  const router = useRouter();

  if (links.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <button key={link.href} onClick={() => router.push(link.href)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            {link.label} <ArrowRight className="h-3 w-3" />
          </button>
        ))}
      </div>
    </div>
  );
}
