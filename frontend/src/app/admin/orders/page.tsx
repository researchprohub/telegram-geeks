"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, Eye, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await api.get("/admin/orders");
      setOrders(res.data.orders || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  const statusColor = (status: string) =>
    status === "completed" || status === "confirmed"
      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
      : status === "pending"
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";

  const handleConfirm = async () => {
    if (!selectedOrder) return;
    setConfirming(true);
    try {
      await api.put(`/admin/orders/${selectedOrder.order_id}/status`, { status: "confirmed" });
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: "confirmed" } : o));
      setShowConfirmModal(false);
      setSelectedOrder(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to confirm order");
    } finally {
      setConfirming(false);
    }
  };

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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders & Payments</h1>
        <p className="text-sm text-muted-foreground">Track crypto payments and confirm pending orders.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">✕</button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-sm"><CardContent className="pt-6"><div className="text-3xl font-bold text-yellow-500">{orders.filter(o => o.status === "pending").length}</div><p className="mt-1 text-sm text-muted-foreground">Pending</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="pt-6"><div className="text-3xl font-bold text-green-500">{orders.filter(o => o.status === "completed" || o.status === "confirmed").length}</div><p className="mt-1 text-sm text-muted-foreground">Completed</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="pt-6"><div className="text-3xl font-bold text-red-500">{orders.filter(o => o.status === "expired" || o.status === "failed").length}</div><p className="mt-1 text-sm text-muted-foreground">Expired / Failed</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="pt-6"><div className="text-3xl font-bold">${orders.filter(o => o.status === "completed" || o.status === "confirmed").reduce((s, o) => s + (o.amount || 0), 0).toFixed(2)}</div><p className="mt-1 text-sm text-muted-foreground">Total Revenue</p></CardContent></Card>
      </div>

      {/* Orders Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base text-foreground">All Orders</CardTitle>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="confirmed">Confirmed</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
          </select>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Crypto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>TX Hash</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm text-foreground">{o.order_id}</TableCell>
                    <TableCell className="text-foreground">#{o.user_id}</TableCell>
                    <TableCell className="font-medium text-foreground">${Number(o.amount || 0).toFixed(2)} {o.currency}</TableCell>
                    <TableCell className="text-sm text-foreground">{o.plan_tier || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{o.gateway || "—"}</Badge></TableCell>
                    <TableCell className="text-sm text-foreground">{o.crypto_currency || "—"}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{o.tx_hash ? `${String(o.tx_hash).slice(0, 18)}…` : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{o.created_at ? new Date(o.created_at).toLocaleString() : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        {o.status === "pending" && (
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedOrder(o); setShowConfirmModal(true); }}>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirm Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Order {selectedOrder?.order_id}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure this payment has been received? This will credit the user's account.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={confirming}>
              {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              {confirming ? "Confirming..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}