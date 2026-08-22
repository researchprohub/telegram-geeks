import React from "react";
import { Link } from "react-router-dom";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  showBadge?: boolean;
  to?: string;
  className?: string;
}

export function BrandLogo({
  size = "md",
  showTagline = false,
  showBadge = true,
  to = "/",
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
        <div className={`relative ${iconDimensions[size]} rounded-xl overflow-hidden shadow-lg shadow-black/40 border border-primary/25 bg-[#080c14] flex items-center justify-center p-1.5`}>
          <svg viewBox="0 0 128 128" fill="none" className="w-full h-full">
            <defs>
              <linearGradient id="dFavBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0a1220"/>
                <stop offset="100%" stopColor="#04070d"/>
              </linearGradient>
              <linearGradient id="dFavCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2ffcd4"/>
                <stop offset="100%" stopColor="#00c6ff"/>
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="120" height="120" rx="30" fill="url(#dFavBg)"/>
            <path d="M28 62 L98 32 L72 70 L54 84 Z" fill="url(#dFavCyan)"/>
            <path d="M98 32 L58 68 L72 70 L48 96 L58 76 L42 78 Z" fill="#ffffff"/>
            <circle cx="98" cy="32" r="3.5" fill="#ffffff"/>
            <circle cx="98" cy="32" r="7" fill="#2ffcd4" opacity="0.5"/>
          </svg>
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold tracking-tight text-foreground ${titleSizes[size]}`}>
            Telegram<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-sky-400">Geeks</span>
          </span>
          {showBadge && (
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30 font-mono">
              PRO
            </span>
          )}
        </div>
        {showTagline && (
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Desktop OS
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
