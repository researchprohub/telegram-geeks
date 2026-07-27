"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthProvider, useAuth } from "@/lib/hooks/use-auth";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 0% -10%, hsl(187 100% 50% / 0.07), transparent),
          radial-gradient(ellipse 50% 40% at 100% 0%, hsl(280 70% 60% / 0.05), transparent),
          radial-gradient(ellipse 60% 30% at 50% 100%, hsl(187 100% 50% / 0.03), transparent)
        `
      }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(600px circle at 0% 20%, hsl(187 100% 50% / 0.04), transparent 50%),
          radial-gradient(400px circle at 100% 40%, hsl(280 70% 60% / 0.03), transparent 50%),
          radial-gradient(300px circle at 30% 80%, hsl(187 100% 50% / 0.02), transparent 50%)
        `,
        filter: 'blur(60px)'
      }} />
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
