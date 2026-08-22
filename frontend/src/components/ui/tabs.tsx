"use client";

import React, { useState, createContext, useContext } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
}

const TabsContext = createContext<{
  active: string;
  setActive: (v: string) => void;
}>({ active: "", setActive: () => {} });

export function Tabs({
  children,
  defaultValue,
  className = "",
}: Props & { defaultValue: string }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "" }: Props) {
  return (
    <div
      className={`flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/30 border border-border/60 overflow-x-auto no-scrollbar max-w-full ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  children,
  value,
  className = "",
}: Props & { value: string }) {
  const { active, setActive } = useContext(TabsContext);
  const isActive = active === value;
  return (
    <button
      type="button"
      className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 select-none ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10 font-bold"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
      } ${className}`}
      onClick={() => setActive(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  children,
  value,
  className = "",
}: Props & { value: string }) {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div className={`pt-2 ${className}`}>{children}</div>;
}
