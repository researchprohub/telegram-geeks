"use client";

import { useState, useMemo } from "react";
import { Filter, Globe, Monitor, Smartphone, Search, ExternalLink, Sparkles } from "lucide-react";
import { Partner } from "@/data/default-partners";

interface PartnerGridInteractiveProps {
  initialPartners: Partner[];
  locale?: "en" | "ru" | "cn";
}

export function PartnerGridInteractive({ initialPartners, locale = "en" }: PartnerGridInteractiveProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const categories = [
    { id: "all", label: locale === "ru" ? "Все" : locale === "cn" ? "全部" : "All", icon: Filter },
    { id: "proxies", label: locale === "ru" ? "Прокси" : locale === "cn" ? "代理服务" : "Proxies", icon: Globe },
    { id: "browsers", label: locale === "ru" ? "Браузеры" : locale === "cn" ? "指纹浏览器" : "Browsers", icon: Monitor },
    { id: "sms", label: locale === "ru" ? "SMS-сервисы" : locale === "cn" ? "接码平台" : "SMS services", icon: Smartphone },
  ];

  const filteredPartners = useMemo(() => {
    return initialPartners.filter((partner) => {
      const matchesCategory =
        selectedCategory === "all" ||
        partner.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [initialPartners, selectedCategory, searchQuery]);

  const handleImageError = (name: string) => {
    setImageErrors((prev) => ({ ...prev, [name]: true }));
  };

  return (
    <section className="py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ── Filters & Search Toolbar ── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[hsl(var(--primary))] text-black shadow-lg shadow-[hsl(var(--primary))]/20"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px] sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder={
                locale === "ru"
                  ? "Поиск партнеров..."
                  : locale === "cn"
                  ? "搜索合作伙伴..."
                  : "Search 120+ partners..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[hsl(var(--primary))] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center justify-between text-xs text-white/50 px-1 font-mono">
          <span>
            {locale === "ru"
              ? `Найдено: ${filteredPartners.length} партнеров`
              : locale === "cn"
              ? `显示: ${filteredPartners.length} 个合作伙伴`
              : `Showing ${filteredPartners.length} verified partners`}
          </span>
          <span className="flex items-center gap-1 text-[hsl(var(--primary))]">
            <Sparkles className="w-3.5 h-3.5" /> Verified Ecosystem
          </span>
        </div>

        {/* ── Partner Grid (124 Logos) ── */}
        {filteredPartners.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/10 bg-black/20">
            <p className="text-white/60 text-sm">
              {locale === "ru"
                ? "Партнеры не найдены. Попробуйте изменить параметры поиска."
                : locale === "cn"
                ? "未找到相关合作伙伴，请尝试其他关键词。"
                : "No partners found matching your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredPartners.map((partner, index) => {
              const isInvalidLink = !partner.href || partner.href === "/contacts";
              const href = isInvalidLink ? "/contacts" : partner.href;
              const hasImgError = imageErrors[partner.name];

              return (
                <a
                  key={`${partner.name}-${index}`}
                  href={href}
                  target={isInvalidLink ? "_self" : "_blank"}
                  rel={isInvalidLink ? undefined : "noopener noreferrer"}
                  className="group relative rounded-xl border border-white/10 bg-[#0B0F17] p-4 flex flex-col items-center justify-center aspect-[5/3] hover:border-[hsl(var(--primary))]/50 hover:bg-white/[0.04] transition-all overflow-hidden shadow-sm hover:shadow-lg hover:shadow-[hsl(var(--primary))]/10"
                >
                  {partner.img && !hasImgError ? (
                    <img
                      src={partner.img}
                      alt={partner.name}
                      onError={() => handleImageError(partner.name)}
                      className="max-w-full max-h-full object-contain filter drop-shadow-sm opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <span className="font-bold text-xs sm:text-sm text-white group-hover:text-[hsl(var(--primary))] transition-colors line-clamp-1">
                        {partner.name}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-white/40 mt-1 px-1.5 py-0.5 rounded bg-white/5">
                        {partner.category}
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 backdrop-blur-[2px] p-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-semibold text-xs text-white line-clamp-1">{partner.name}</span>
                      <div className="flex items-center gap-1 text-[11px] text-[hsl(var(--primary))] font-mono font-medium">
                        <span>{locale === "ru" ? "Перейти" : locale === "cn" ? "访问" : "Visit"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
