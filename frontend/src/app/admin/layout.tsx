"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AuthProvider, useAuth } from "@/lib/hooks/use-auth";

function AdminContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login");
      else if (user.role !== "admin") router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-6 animate-fade-in">{children}</div>
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
