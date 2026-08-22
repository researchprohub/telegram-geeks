import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { modulesApi, detail } from "../lib/api";
import type { ModuleRecord } from "../types";
import {
  Boxes,
  Search,
  Sparkles,
  Lock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Filter,
  CheckCircle2,
} from "lucide-react";

export default function ModulesGrid() {
  const [categories, setCategories] = useState<string[]>([]);
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await modulesApi.list();
        if (!cancelled) {
          setCategories(r.data.categories || []);
          setModules(r.data.modules || []);
        }
      } catch (err) {
        setError(detail(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredModules = modules.filter((m) => {
    const matchCat = selectedCat === "all" || m.category === selectedCat;
    const matchSearch =
      !search.trim() ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Boxes className="h-6 w-6 text-primary" />
            Automation Modules Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Access all 77+ Telegram automation tools, MTProto protocol scripts, converters, and scrapers.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search 77+ modules…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card/60 pl-9 pr-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setSelectedCat("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedCat === "all"
              ? "bg-primary text-black font-bold shadow-sm"
              : "bg-card/40 border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All Modules ({modules.length})
        </button>
        {categories.map((cat) => {
          const count = modules.filter((m) => m.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                selectedCat === cat
                  ? "bg-primary text-black font-bold shadow-sm"
                  : "bg-card/40 border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.replace("_", " ")} ({count})
            </button>
          );
        })}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredModules.map((m) => (
          <Link
            key={m.id}
            to={`/modules/${m.id}`}
            className="group rounded-2xl border border-border bg-card/40 hover:bg-card/80 p-5 backdrop-blur-md transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-background/80 border border-border/50">
                  {m.category?.replace("_", " ") || "Tool"}
                </span>
                {m.tier === "pro" ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    PRO
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    BASE
                  </span>
                )}
              </div>

              <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors mb-1.5">
                {m.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                {m.description || "Automated module task runner for Telegram operations."}
              </p>
            </div>

            <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-primary font-medium group-hover:translate-x-0.5 transition-transform">
              <span>Launch Studio</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        ))}

        {filteredModules.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground text-xs">
            No modules found matching your search query.
          </div>
        )}
      </div>
    </div>
  );
}