"use client";

import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  showBadge?: boolean;
  href?: string;
  className?: string;
}

export function BrandLogo({
  size = "md",
  showTagline = false,
  showBadge = true,
  href = "/",
  className = "",
}: BrandLogoProps) {
  const iconDimensions = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const titleSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };

  const content = (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Glow + Icon Container */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-primary/30 rounded-xl blur-md opacity-40 group-hover:opacity-80 transition-opacity duration-300" />
        <div className={`relative ${iconDimensions[size]} rounded-xl overflow-hidden shadow-lg shadow-black/40 border border-primary/25 bg-[#080c14] flex items-center justify-center`}>
          <Image
            src="/assets/brand/logo-icon.svg"
            alt="TelegramGeeks Logo"
            width={56}
            height={56}
            className="w-full h-full object-contain p-0.5"
            priority
          />
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold tracking-tight text-foreground ${titleSizes[size]}`}>
            Telegram<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-sky-400">Geeks</span>
          </span>
          {showBadge && (
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30 shadow-xs font-mono">
              PRO
            </span>
          )}
        </div>
        {showTagline && (
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Automation OS
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
