"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthProvider, useAuth } from "@/lib/hooks/use-auth";
import { ParticleMeshBackground } from "@/components/marketing/TelegramExpertAnimation";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Homepage Particle Mesh Animation */}
      <div className="fixed inset-0 pointer-events-none opacity-45 z-0">
        <ParticleMeshBackground />
      </div>
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(47,252,212,0.06),transparent)] z-0" />
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen relative z-10">{children}</main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <AuthProvider>
        <DashboardContent>{children}</DashboardContent>
      </AuthProvider>
    </ThemeProvider>
  );
}
