"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { modules, categories, type Module } from "@/data/modules";

const categoryLabels: Record<string, string> = {
  all: "All", accounts: "Accounts", audience: "Audience",
  messaging: "Messaging", invite: "Invitations",
  registration: "Registration", boost: "Growth",
  cloning: "Cloning", tools: "Tools",
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.04, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function ModuleExplorer({ locale = "en" }: { locale?: string }) {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all"
    ? modules
    : modules.filter((m) => m.category === filter);

  const baseCount = filtered.filter((m) => m.plan_required === "starter").length;
  const proCount = filtered.filter((m) => m.plan_required === "pro").length;

  return (
    <section className="py-16 lg:py-20 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            {locale === "ru" ? "49 модулей" : locale === "cn" ? "49个模块" : "49 Modules"}
          </h2>
          <p className="text-muted-foreground">
            {locale === "ru"
              ? "Фильтруйте по категориям, чтобы найти нужный инструмент"
              : locale === "cn"
              ? "按类别筛选以找到您需要的工具"
              : "Filter by category to find the tool you need"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border"
              }`}
            >
              {locale === "ru" ? cat.labelRu : locale === "cn" ? cat.labelCn : cat.label}
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="text-center text-xs text-muted-foreground mb-6"
        >
          {locale === "ru"
            ? `${filtered.length} модулей · ${baseCount} базовых · ${proCount} Pro`
            : locale === "cn"
            ? `${filtered.length} 个模块 · ${baseCount} 个基础 · ${proCount} 个专业版`
            : `${filtered.length} modules · ${baseCount} base · ${proCount} Pro`}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          >
            {filtered.map((mod, i) => (
              <ModuleCard key={mod.id} mod={mod} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filter !== "all" && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <button
              onClick={() => setFilter("all")}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {locale === "ru" ? "← Показать все" : locale === "cn" ? "← 显示全部" : "← Show all"}
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function ModuleCard({ mod, index }: { mod: Module; index: number }) {
  const Icon = mod.icon;
  const isPro = mod.plan_required === "pro";

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`group relative rounded-xl border p-4 transition-colors cursor-default ${
        isPro
          ? "border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-transparent hover:border-amber-500/40 hover:from-amber-500/[0.06]"
          : "border-border bg-card hover:border-primary/20 hover:bg-primary/[0.02]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isPro
              ? "bg-amber-500/10 text-amber-500"
              : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-foreground">{mod.name}</span>
            {isPro && (
              <span className="text-[10px] font-semibold text-amber-500 border border-amber-500/30 rounded px-1 py-0.5 leading-none">
                Pro
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
        </div>
      </div>
    </motion.div>
  );
}
