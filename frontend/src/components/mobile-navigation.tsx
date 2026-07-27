"use client";

import { usePathname } from "next/navigation";
import {
  Home, Users, Blocks, BarChart3, Settings,
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { id: "home", label: "Home", icon: Home, href: "/dashboard" },
  { id: "accounts", label: "Accounts", icon: Users, href: "/dashboard/accounts" },
  { id: "modules", label: "Modules", icon: Blocks, href: "/dashboard/modules" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function MobileNavigation() {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname === "/dashboard" || pathname === "/dashboard/") return "home";
    if (pathname.startsWith("/dashboard/accounts")) return "accounts";
    if (pathname.startsWith("/dashboard/modules")) return "modules";
    if (pathname.startsWith("/dashboard/analytics")) return "analytics";
    if (pathname.startsWith("/dashboard/settings")) return "settings";
    if (pathname.startsWith("/dashboard/")) return "home";
    return "home";
  };

  const activeTab = getActiveTab();

  return (
    <div className="tab-bar fixed bottom-0 left-0 right-0 z-50">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map(item => (
          <Link
            key={item.id}
            href={item.href}
            className={`mobile-nav-item ${
              activeTab === item.id ? "mobile-nav-item-active" : "mobile-nav-item-inactive"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="mt-1 text-[10px]">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
