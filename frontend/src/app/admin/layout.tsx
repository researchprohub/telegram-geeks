"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AuthProvider, useAuth } from "@/lib/hooks/use-auth";
import {
  Menu,
  Shield,
  Bell,
  Search,
  ExternalLink,
  ChevronRight,
  User,
  Radio,
  Cpu,
  Loader2,
} from "lucide-react";
import Link from "next/link";

function AdminHeader({ onOpenMobile }: { onOpenMobile: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const getPageTitle = (path: string) => {
    if (path === "/admin") return "Executive Command Center";
    if (path.startsWith("/admin/analytics")) return "Analytics & Intelligence";
    if (path.startsWith("/admin/users")) return "User & Operator Management";
    if (path.startsWith("/admin/licenses")) return "Desktop License Generator";
    if (path.startsWith("/admin/orders")) return "Customer Orders & Billing";
    if (path.startsWith("/admin/deposits")) return "Cryptocurrency Deposits";
    if (path.startsWith("/admin/partners")) return "Affiliate & Partner Network";
    if (path.startsWith("/admin/settings")) return "Global System Settings";
    return "Admin Command";
  };

  const getPageSection = (path: string) => {
    if (path === "/admin" || path.startsWith("/admin/analytics")) return "Overview";
    if (path.startsWith("/admin/settings")) return "System";
    return "Management";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 sm:px-6 backdrop-blur-xl">
      {/* Left: Mobile Menu Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl border border-border/60 bg-secondary/30 text-foreground hover:bg-secondary/60 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline font-semibold text-muted-foreground">
            {getPageSection(pathname)}
          </span>
          <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="font-bold text-foreground truncate max-w-[200px] sm:max-w-none">
            {getPageTitle(pathname)}
          </span>
        </div>
      </div>

      {/* Right: Telemetry & Admin Badge */}
      <div className="flex items-center gap-3">
        {/* Live Cluster Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[11px] font-semibold text-teal-400">
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Production Node</span>
        </div>

        {/* View Main Site */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-secondary/30 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
        >
          <span>Live Site</span>
          <ExternalLink className="h-3 w-3" />
        </Link>

        {/* Admin Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/60">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-rose-500/20">
            {user?.email?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-foreground leading-tight truncate max-w-[130px]">
              {user?.email || "Admin"}
            </div>
            <div className="text-[10px] font-mono text-rose-400 font-semibold leading-none">
              Super Admin
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login");
      else if (user.role !== "admin") router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-mono">Authenticating administrative session...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-200 min-w-0">
        <AdminHeader onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminContent>{children}</AdminContent>
    </AuthProvider>
  );
}
