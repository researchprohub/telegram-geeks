"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Key,
  Lock,
  Edit3,
  Ban,
  CheckCircle2,
  Trash2,
  Eye,
  Layers,
  Sparkles,
  Zap,
  Activity,
  Calendar,
  Clock,
  Cpu,
  Mail,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  HardDrive,
  Laptop,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "@/lib/api";

interface UserItem {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  campaigns_count: number;
  accounts_count: number;
  groups_count: number;
  personas_count: number;
  license_key: string | null;
  license_tier: string | null;
  license_status: string | null;
  license_expires_at: string | null;
  license_hwid: string | null;
}

interface StatsSummary {
  total_users: number;
  active_users: number;
  banned_users: number;
  admin_users: number;
  operator_users: number;
  paid_subscribers: number;
  tier_distribution: {
    starter: number;
    pro: number;
    agency: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "operator",
    subscription_tier: "free",
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "operator",
    subscription_tier: "free",
    is_active: true,
  });

  const [newPassword, setNewPassword] = useState("");

  const [licenseForm, setLicenseForm] = useState({
    action: "generate",
    plan_tier: "pro",
    duration_days: 30,
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [page, roleFilter, statusFilter, tierFilter]);

  async function fetchStats() {
    try {
      const res = await api.get("/admin/users/stats/summary");
      setStats(res.data);
    } catch (e) {
      console.error("Failed to load user stats", e);
    }
  }

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = { page, page_size: 25 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (tierFilter !== "all") params.plan_tier = tierFilter;

      const res = await api.get("/admin/users", { params });
      if (res.data?.users) {
        setUsers(res.data.users);
        setTotalPages(res.data.total_pages || 1);
      } else if (Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load users list.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  async function openDetailModal(user: UserItem) {
    setSelectedUser(user);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/users/${user.id}/detail`);
      setUserDetail(res.data);
    } catch (e) {
      console.error("Failed to load user detail", e);
    } finally {
      setDetailLoading(false);
    }
  }

  function openEditModal(user: UserItem) {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || "",
      role: user.role || "operator",
      subscription_tier: user.license_tier || "free",
      is_active: user.is_active,
    });
    setShowEditModal(true);
  }

  function openPasswordModal(user: UserItem) {
    setSelectedUser(user);
    setNewPassword("");
    setShowPasswordModal(true);
  }

  function openLicenseModal(user: UserItem) {
    setSelectedUser(user);
    setLicenseForm({
      action: user.license_key ? "upgrade" : "generate",
      plan_tier: user.license_tier && user.license_tier !== "free" ? user.license_tier : "pro",
      duration_days: 30,
    });
    setShowLicenseModal(true);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await api.post("/admin/users", createForm);
      setSuccess(`User ${createForm.email} registered successfully!`);
      setShowCreateModal(false);
      setCreateForm({
        email: "",
        password: "",
        full_name: "",
        role: "operator",
        subscription_tier: "free",
      });
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create user");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}`, editForm);
      setSuccess(`User #${selectedUser.id} updated!`);
      setShowEditModal(false);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleStatus(user: UserItem) {
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${user.id}/status`, {
        is_active: !user.is_active,
      });
      setSuccess(`User #${user.id} ${user.is_active ? "suspended" : "activated"}!`);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to toggle status");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${selectedUser.id}/reset-password`, {
        new_password: newPassword,
      });
      setSuccess(`Password for ${selectedUser.email} reset successfully!`);
      setShowPasswordModal(false);
      setNewPassword("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLicenseAction(action: string) {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/users/${selectedUser.id}/license`, {
        action,
        plan_tier: licenseForm.plan_tier,
        duration_days: licenseForm.duration_days,
      });
      setSuccess(res.data?.message || "License action completed successfully!");
      setShowLicenseModal(false);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || "License action failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setSuccess(`User #${selectedUser.id} deleted!`);
      setShowDeleteModal(false);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getTierBadge = (tier: string | null) => {
    switch (tier?.toLowerCase()) {
      case "agency":
        return (
          <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
            👑 Agency
          </Badge>
        );
      case "pro":
        return (
          <Badge className="bg-primary/10 text-primary border border-primary/20 font-semibold">
            ⚡ Pro Tier
          </Badge>
        );
      case "starter":
        return (
          <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
            🚀 Starter
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground border-border/60">
            Free User
          </Badge>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return (
          <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
            🛡️ Admin
          </Badge>
        );
      case "operator":
        return (
          <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono">
            ⚙️ Operator
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground font-mono">
            Viewer
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2 shadow-sm shadow-primary/10">
            <Users className="h-3.5 w-3.5" />
            <span>Platform Governance & Access Control</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            User Management Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage operators, subscription tiers, hardware machine locks, and security privileges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchUsers();
              fetchStats();
            }}
            className="border-border/60 hover:bg-secondary/40"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md shadow-primary/10"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-between text-destructive text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="hover:opacity-70">✕</button>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between text-teal-400 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess("")} className="hover:opacity-70">✕</button>
        </div>
      )}

      {/* Bento Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/60 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Users className="h-16 w-16 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                Total Registered Users
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold text-foreground">
                {stats.total_users}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-teal-400 font-semibold">{stats.active_users} Active</span>
                <span>•</span>
                <span className="text-red-400">{stats.banned_users} Suspended</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Key className="h-16 w-16 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                Paid Desktop Licenses
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold text-primary">
                {stats.paid_subscribers}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{stats.tier_distribution.agency} Agency</span>
                <span>•</span>
                <span>{stats.tier_distribution.pro} Pro</span>
                <span>•</span>
                <span>{stats.tier_distribution.starter} Starter</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                System Operators
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold text-foreground">
                {stats.operator_users}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-cyan-400 font-semibold">{stats.admin_users} Super Admins</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Activity className="h-16 w-16 text-teal-400" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                Account Health Rate
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold text-teal-400">
                {stats.total_users > 0
                  ? Math.round((stats.active_users / stats.total_users) * 100)
                  : 100}
                %
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span>Enforcing 1-License Quota</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or user ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary/30 border-border/60 text-sm focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="operator">Operators</option>
                <option value="viewer">Viewers</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="banned">Suspended / Banned</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
              >
                <option value="all">All License Plans</option>
                <option value="agency">Agency Plan</option>
                <option value="pro">Pro Plan</option>
                <option value="starter">Starter Plan</option>
                <option value="free">Free / No Key</option>
              </select>

              <Button type="submit" size="sm" variant="secondary" className="font-semibold">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Users Table */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading platform users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="min-h-[250px] flex flex-col items-center justify-center gap-2 text-muted-foreground p-6 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-base font-semibold text-foreground">No Users Found</p>
              <p className="text-xs max-w-sm">
                No user records matched your search query or filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>User Profile</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>License Tier</TableHead>
                    <TableHead>Connected Assets</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-border/40 hover:bg-secondary/20 transition-colors"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{user.id}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {user.full_name
                              ? user.full_name.charAt(0).toUpperCase()
                              : user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                              <span>{user.email}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.full_name || "No name set"}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{getRoleBadge(user.role)}</TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {getTierBadge(user.license_tier)}
                          {user.license_key && (
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                              <span className="truncate max-w-[110px]">
                                {user.license_key.slice(0, 14)}...
                              </span>
                              <button
                                onClick={() => copyToClipboard(user.license_key!)}
                                className="hover:text-primary transition-colors"
                                title="Copy Key"
                              >
                                {copiedKey === user.license_key ? (
                                  <Check className="h-3 w-3 text-teal-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span title="Telegram Accounts">
                            📱 <strong className="text-foreground">{user.accounts_count}</strong>
                          </span>
                          <span title="Active Campaigns">
                            🎯 <strong className="text-foreground">{user.campaigns_count}</strong>
                          </span>
                          <span title="AI Personas">
                            🤖 <strong className="text-foreground">{user.personas_count}</strong>
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400">
                            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive">
                            <span className="h-2 w-2 rounded-full bg-destructive" />
                            Suspended
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailModal(user)}
                            title="Inspect User Details & Telemetry"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            title="Edit Role & Plan"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openLicenseModal(user)}
                            title="Manage Desktop License Key"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Key className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPasswordModal(user)}
                            title="Reset User Password"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <Lock className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                            title={user.is_active ? "Suspend User" : "Activate User"}
                            className={`h-8 w-8 p-0 ${
                              user.is_active
                                ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                : "text-muted-foreground hover:text-teal-400 hover:bg-teal-500/10"
                            }`}
                          >
                            {user.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            title="Delete User"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE USER MODAL
      ========================================================================= */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Platform User
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manually register an account with specific operator privileges and optional desktop license.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Address *</label>
              <Input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="operator@company.com"
                className="bg-secondary/30 border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Temporary Password *</label>
              <Input
                type="text"
                required
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Must be 12+ chars with mixed case, digits & symbols"
                className="bg-secondary/30 border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Full Name / Label</label>
              <Input
                type="text"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                placeholder="Alex Mercer"
                className="bg-secondary/30 border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="operator">Operator</option>
                  <option value="admin">Super Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Subscription Tier</label>
                <select
                  value={createForm.subscription_tier}
                  onChange={(e) => setCreateForm({ ...createForm, subscription_tier: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="free">Free / None</option>
                  <option value="starter">Starter Plan</option>
                  <option value="pro">Pro Plan</option>
                  <option value="agency">Agency Plan</option>
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-primary text-primary-foreground font-semibold">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          USER DETAIL INSPECTION MODAL
      ========================================================================= */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-[650px] bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Eye className="h-5 w-5 text-primary" />
              User Profile & Asset Telemetry
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Deep-dive metrics and active desktop license state for user #{selectedUser?.id}.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs">Fetching telemetry...</p>
            </div>
          ) : userDetail ? (
            <div className="space-y-5 py-2">
              {/* Identity Banner */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-base text-foreground flex items-center gap-2">
                    <span>{userDetail.email}</span>
                    {getRoleBadge(userDetail.role)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {userDetail.full_name || "No Name"} • Registered {new Date(userDetail.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  {getTierBadge(userDetail.license?.plan_tier || "free")}
                </div>
              </div>

              {/* Desktop License Card */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <Laptop className="h-4 w-4" />
                    <span>Standalone Windows Desktop License</span>
                  </div>
                  {userDetail.license?.status === "active" ? (
                    <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">None / Inactive</Badge>
                  )}
                </div>

                {userDetail.license ? (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-background/80 border border-border/60 flex items-center justify-between font-mono text-xs">
                      <span className="text-foreground select-all">{userDetail.license.key}</span>
                      <button
                        onClick={() => copyToClipboard(userDetail.license.key)}
                        className="text-muted-foreground hover:text-primary"
                        title="Copy Key"
                      >
                        {copiedKey === userDetail.license.key ? (
                          <Check className="h-3.5 w-3.5 text-teal-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <strong>Plan Tier:</strong> {userDetail.license.plan_tier?.toUpperCase()}
                      </div>
                      <div>
                        <strong>Expires:</strong> {new Date(userDetail.license.expires_at).toLocaleDateString()}
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span>
                          <strong>Hardware ID (HWID):</strong>{" "}
                          {userDetail.license.hwid ? (
                            <span className="font-mono text-[11px] text-teal-400">{userDetail.license.hwid.slice(0, 16)}...</span>
                          ) : (
                            <span className="text-muted-foreground">Unbound (Ready for first machine)</span>
                          )}
                        </span>
                        {userDetail.license.hwid && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px]"
                            onClick={() => handleLicenseAction("reset_hwid")}
                          >
                            Reset HWID
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>No standalone desktop license is currently assigned to this user.</span>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-primary text-primary-foreground font-semibold"
                      onClick={() => {
                        setShowDetailModal(false);
                        openLicenseModal(selectedUser!);
                      }}
                    >
                      Generate Key
                    </Button>
                  </div>
                )}
              </div>

              {/* Connected Telegram Accounts */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Connected Telegram Accounts ({userDetail.accounts_count})
                </div>
                {userDetail.accounts_summary.length > 0 ? (
                  <div className="space-y-1.5">
                    {userDetail.accounts_summary.map((acc: any) => (
                      <div
                        key={acc.id}
                        className="p-2.5 rounded-lg bg-secondary/20 border border-border/40 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 font-mono">
                          <span>📱 {acc.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {acc.status}
                          </Badge>
                          <span className="text-muted-foreground">
                            Trust Score: <strong className="text-foreground">{acc.trust_score}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No Telegram sessions uploaded yet.</p>
                )}
              </div>

              {/* Campaigns Summary */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Campaigns ({userDetail.campaigns_count})
                </div>
                {userDetail.campaigns_summary.length > 0 ? (
                  <div className="space-y-1.5">
                    {userDetail.campaigns_summary.map((camp: any) => (
                      <div
                        key={camp.id}
                        className="p-2.5 rounded-lg bg-secondary/20 border border-border/40 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-foreground">🎯 {camp.name}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {camp.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No active campaigns.</p>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          EDIT USER MODAL
      ========================================================================= */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit User #{selectedUser?.id}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify role, display name, and subscription tier for {selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Full Name</label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="User display name"
                className="bg-secondary/30 border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="operator">Operator</option>
                  <option value="admin">Super Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Subscription Tier</label>
                <select
                  value={editForm.subscription_tier}
                  onChange={(e) => setEditForm({ ...editForm, subscription_tier: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="free">Free User</option>
                  <option value="starter">Starter Plan</option>
                  <option value="pro">Pro Plan</option>
                  <option value="agency">Agency Plan</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="edit_is_active" className="text-xs font-semibold text-foreground cursor-pointer">
                Account Active (uncheck to suspend account)
              </label>
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-primary text-primary-foreground font-semibold">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          RESET PASSWORD MODAL
      ========================================================================= */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Lock className="h-5 w-5 text-cyan-400" />
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Set a new secure password for {selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">New Password *</label>
              <Input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new 12+ character secure password"
                className="bg-secondary/30 border-border"
              />
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-cyan-500 text-white font-semibold hover:bg-cyan-600">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MANAGE LICENSE MODAL
      ========================================================================= */}
      <Dialog open={showLicenseModal} onOpenChange={setShowLicenseModal}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Key className="h-5 w-5 text-primary" />
              Desktop License Control
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manage cryptographic activation key, plan tier, and hardware locking for {selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedUser?.license_key ? (
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Current Active Key</span>
                  {getTierBadge(selectedUser.license_tier)}
                </div>
                <div className="font-mono text-xs p-2 rounded bg-background border border-border/40 select-all flex items-center justify-between">
                  <span>{selectedUser.license_key}</span>
                  <button
                    onClick={() => copyToClipboard(selectedUser.license_key!)}
                    className="hover:text-primary"
                  >
                    {copiedKey === selectedUser.license_key ? (
                      <Check className="h-3.5 w-3.5 text-teal-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                  <span>Expires: {selectedUser.license_expires_at ? new Date(selectedUser.license_expires_at).toLocaleDateString() : "Never"}</span>
                  <span>HWID: {selectedUser.license_hwid ? "Locked" : "Unbound"}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                User currently has no desktop license generated.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Target Plan Tier</label>
                <select
                  value={licenseForm.plan_tier}
                  onChange={(e) => setLicenseForm({ ...licenseForm, plan_tier: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="starter">Starter Plan</option>
                  <option value="pro">Pro Plan</option>
                  <option value="agency">Agency Plan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Validity (Days)</label>
                <select
                  value={licenseForm.duration_days}
                  onChange={(e) => setLicenseForm({ ...licenseForm, duration_days: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={90}>90 Days (3 Months)</option>
                  <option value={365}>365 Days (1 Year)</option>
                  <option value={730}>730 Days (2 Years)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                onClick={() => handleLicenseAction("generate")}
                disabled={actionLoading}
                className="bg-primary text-primary-foreground font-semibold flex-1 text-xs"
              >
                {selectedUser?.license_key ? "Extend (+30d)" : "Generate License Key"}
              </Button>

              {selectedUser?.license_key && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleLicenseAction("reset_hwid")}
                    disabled={actionLoading}
                    className="text-xs"
                  >
                    Reset HWID Lock
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleLicenseAction("revoke")}
                    disabled={actionLoading}
                    className="text-xs"
                  >
                    Revoke Key
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          DELETE USER CONFIRMATION MODAL
      ========================================================================= */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[420px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete User #{selectedUser?.id}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete <strong>{selectedUser?.email}</strong>? All connected campaigns and licenses will be revoked.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="font-semibold"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
