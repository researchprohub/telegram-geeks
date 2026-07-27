"use client";

import { useState } from "react";

interface Props { children: React.ReactNode; className?: string }
export function Tabs({ children, defaultValue }: Props & { defaultValue: string }) {
  const [active, setActive] = useState(defaultValue);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

import { createContext, useContext } from "react";
const TabsContext = createContext<{ active: string; setActive: (v: string) => void }>({ active: "", setActive: () => {} });

export function TabsList({ children, className = "" }: Props) {
  return <div className={`flex gap-1 mb-4 ${className}`}>{children}</div>;
}

export function TabsTrigger({ children, value, className = "" }: Props & { value: string }) {
  const { active, setActive } = useContext(TabsContext);
  const isActive = active === value;
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"} ${className}`}
      onClick={() => setActive(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, className = "" }: Props & { value: string }) {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div className={className}>{children}</div>;
}
