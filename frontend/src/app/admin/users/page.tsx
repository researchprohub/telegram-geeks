"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Ban, CreditCard, Eye, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showBanModal, setShowBanModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banning, setBanning] = useState(false);
  const [crediting, setCrediting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users || res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  const handleBan = async () => {
    if (!selectedUser) return;
    setBanning(true);
    try {
      await api.post(`/admin/users/${selectedUser}/ban`);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser ? { ...u, is_active: false } : u))
      );
      setShowBanModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to ban user");
    } finally {
      setBanning(false);
    }
  };

  const handleCredit = async () => {
    if (!selectedUser || !creditAmount) return;
    setCrediting(true);
    try {
      await api.post(`/admin/users/${selectedUser}/credit`, {
        amount: parseFloat(creditAmount),
        description: creditDesc,
      });
      setShowCreditModal(false);
      setCreditAmount("");
      setCreditDesc("");
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to credit user");
    } finally {
      setCrediting(false);
    }
  };

  const filtered = users.filter((u: any) => {
    if (search && !(u.email || "").toLowerCase().includes(search.toLowerCase()) && !(u.full_name || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter === "active" && !u.is_active) return false;
    if (statusFilter === "inactive" && u.is_active) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">Manage platform users, roles, and access.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">✕</button>
        </div>
      )}

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
              <option value="user">User</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs">{user.id}</TableCell>
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
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {user.is_active && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user.id); setShowBanModal(true); }}>
                            <Ban className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user.id); setShowCreditModal(true); }}>
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        </>
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

      {/* Credit Modal */}
      <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Amount ($)</label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="50.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <Input
                value={creditDesc}
                onChange={(e) => setCreditDesc(e.target.value)}
                placeholder="Bonus credits"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreditModal(false)}>Cancel</Button>
            <Button onClick={handleCredit} disabled={crediting}>
              {crediting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              {crediting ? "Adding..." : "Add Credits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
