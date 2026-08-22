"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Key,
  ShoppingCart,
  Wallet,
  Shield,
  Activity,
  Zap,
  TrendingUp,
  DollarSign,
  UserPlus,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Loader2,
  Server,
  Layers,
  Sparkles,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    setError("");
    try {
      const [overviewRes, usersRes, ordersRes] = await Promise.allSettled([
        api.get("/admin/analytics/overview"),
        api.get("/admin/users?page=1&page_size=6"),
        api.get("/admin/orders?page=1&page_size=6"),
      ]);

      if (overviewRes.status === "fulfilled") {
        setStats(overviewRes.value.data);
      }
      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value.data?.users || usersRes.value.data || []);
      }
      if (ordersRes.status === "fulfilled") {
        setOrders(ordersRes.value.data?.orders || ordersRes.value.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  const getTierBadge = (tier: string | null) => {
    switch (tier?.toLowerCase()) {
      case "agency":
        return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-mono text-[10px]">Agency</Badge>;
      case "pro":
        return <Badge className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px]">Pro</Badge>;
      case "starter":
        return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-mono text-[10px]">Starter</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground text-[10px]">Free</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "confirmed":
        return <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[10px]">Paid</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Executive Command Hero */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-gradient-to-r from-card via-card to-primary/[0.04] p-6 sm:p-8 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 shadow-sm">
              <Shield className="h-3.5 w-3.5" />
              <span>Root Administrative Command Node</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              TelegramGeeks Control Center
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Real-time governance, cryptographic payment verification, desktop activation licensing, and platform metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
              className="border-border/60 hover:bg-secondary/40 font-semibold"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/admin/users")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md shadow-primary/10"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Manage Users
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="hover:opacity-70">✕</button>
        </div>
      )}

      {/* Primary KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Users */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-primary/[0.02] backdrop-blur-md">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Users className="h-16 w-16 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">
              Total Platform Users
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-foreground">
              {stats?.total_users || users.length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="text-teal-400 font-semibold">{stats?.active_users || 0} Active</span>
              <Link href="/admin/users" className="hover:text-primary flex items-center gap-1 font-semibold">
                <span>View</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Paid Revenue */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-purple-500/[0.02] backdrop-blur-md">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <DollarSign className="h-16 w-16 text-purple-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">
              Gross Platform Revenue
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-purple-400">
              ${(stats?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{stats?.total_orders || 0} Total Orders</span>
              <Link href="/admin/orders" className="hover:text-purple-400 flex items-center gap-1 font-semibold">
                <span>Orders</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Sessions */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-cyan-500/[0.02] backdrop-blur-md">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Zap className="h-16 w-16 text-cyan-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">
              Telegram Accounts
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-cyan-400">
              {stats?.total_accounts || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{stats?.total_personas || 0} AI Personas</span>
              <span className="text-teal-400 font-mono text-[10px]">MTProto 2.0</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-teal-500/[0.02] backdrop-blur-md">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Activity className="h-16 w-16 text-teal-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">
              Running Campaigns
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-teal-400">
              {stats?.active_campaigns || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{stats?.total_campaigns || 0} Total</span>
              <Link href="/admin/analytics" className="hover:text-teal-400 flex items-center gap-1 font-semibold">
                <span>Analytics</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Administrative Action Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/admin/users"
          className="p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-secondary/40 hover:border-primary/40 transition-all group"
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <UserPlus className="h-4 w-4" />
          </div>
          <div className="text-xs font-bold text-foreground">User Roster</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Manage accounts & roles</div>
        </Link>

        <Link
          href="/admin/licenses"
          className="p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-secondary/40 hover:border-purple-500/40 transition-all group"
        >
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Key className="h-4 w-4" />
          </div>
          <div className="text-xs font-bold text-foreground">Issue Licenses</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Generate desktop keys</div>
        </Link>

        <Link
          href="/admin/deposits"
          className="p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-secondary/40 hover:border-amber-500/40 transition-all group"
        >
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="text-xs font-bold text-foreground">Crypto Deposits</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Verify blockchain TXs</div>
        </Link>

        <Link
          href="/admin/settings"
          className="p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-secondary/40 hover:border-teal-500/40 transition-all group"
        >
          <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-xs font-bold text-foreground">System Settings</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Wallets, SMTP & AI</div>
        </Link>
      </div>

      {/* Recent Roster Grids (Responsive Table/Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Users */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Recent User Registrations
              </CardTitle>
              <CardDescription className="text-xs">Latest operators accessing the system</CardDescription>
            </div>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No users found.</div>
            ) : (
              <div className="divide-y divide-border/40">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="p-3.5 sm:px-6 flex items-center justify-between hover:bg-secondary/20 transition-colors text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{user.email}</p>
                        <p className="text-[11px] text-muted-foreground">{user.full_name || "Operator"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getTierBadge(user.license_tier)}
                      <span className="font-mono text-[10px] text-muted-foreground hidden sm:inline">
                        #{user.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payment Orders */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-purple-400" />
                Recent Payment Orders
              </CardTitle>
              <CardDescription className="text-xs">Subscription billing and crypto checkouts</CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="text-xs text-purple-400 hover:bg-purple-500/10">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No recent orders.</div>
            ) : (
              <div className="divide-y divide-border/40">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-3.5 sm:px-6 flex items-center justify-between hover:bg-secondary/20 transition-colors text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {order.crypto_currency || "$"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground font-mono">
                          ${Number(order.amount || 0).toFixed(2)} USD
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate font-mono">
                          {order.order_id?.slice(0, 16)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getOrderStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
