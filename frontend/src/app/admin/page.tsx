"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, DollarSign, Zap, Shield, Search, Ban, Eye, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [banning, setBanning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [overviewRes, usersRes] = await Promise.allSettled([
        api.get("/admin/analytics/overview"),
        api.get("/admin/users"),
      ]);

      if (overviewRes.status === "fulfilled") {
        setStats(overviewRes.value.data);
      }
      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value.data.users || usersRes.value.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  const handleBan = async () => {
    if (!selectedUserId) return;
    setBanning(true);
    try {
      await api.post(`/admin/users/${selectedUserId}/ban`);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUserId ? { ...u, is_active: false } : u))
      );
      setShowBanModal(false);
      setSelectedUserId(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to ban user");
    } finally {
      setBanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Users",
      value: stats?.total_users || users.length || 0,
      icon: Users,
      tint: "from-blue-500/20 to-blue-500/5",
      accent: "text-blue-500",
      change: `${stats?.active_users || users.filter((u: any) => u.is_active)?.length || 0} active`,
    },
    {
      label: "Active Users",
      value: stats?.active_users || users.filter((u: any) => u.is_active)?.length || 0,
      icon: Shield,
      tint: "from-emerald-500/20 to-emerald-500/5",
      accent: "text-emerald-500",
      change: `${(((stats?.active_users || 0) / Math.max(stats?.total_users || users.length || 1, 1)) * 100).toFixed(0)}%`,
    },
    {
      label: "Total Revenue",
      value: `$${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      tint: "from-violet-500/20 to-violet-500/5",
      accent: "text-violet-500",
      change: `${stats?.total_orders || 0} orders`,
    },
    {
      label: "Active Campaigns",
      value: stats?.active_campaigns || 0,
      icon: Zap,
      tint: "from-amber-500/20 to-amber-500/5",
      accent: "text-amber-500",
      change: `${stats?.total_campaigns || 0} total`,
    },
  ];

  const filteredUsers = users.filter((u: any) => {
    if (!search) return true;
    return (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
           ((u.full_name || "")).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Monitor platform health and manage users.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{kpi.value}</p>
                  <p className={`text-xs ${kpi.accent} mt-1`}>{kpi.change}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.tint}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.accent}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-foreground">{user.email}</TableCell>
                  <TableCell className="text-foreground">{user.full_name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "destructive"}>
                      {user.is_active ? "Active" : "Banned"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/users?id=${user.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {user.is_active && (
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedUserId(user.id); setShowBanModal(true); }}>
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ban Modal */}
      <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to ban this user? They will lose access to the platform.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBanModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBan} disabled={banning}>
              {banning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4 mr-1" />}
              {banning ? "Banning..." : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
