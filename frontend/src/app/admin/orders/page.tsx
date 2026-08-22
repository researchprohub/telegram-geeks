"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  ShoppingCart,
  CheckCircle,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  ExternalLink,
  Coins,
  ArrowRight,
} from "lucide-react";
import api from "@/lib/api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await api.get("/admin/orders");
      setOrders(res.data?.orders || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  const handleConfirm = async () => {
    if (!selectedOrder) return;
    setConfirming(true);
    try {
      await api.put(`/admin/orders/${selectedOrder.order_id}/status`, { status: "confirmed" });
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: "confirmed" } : o))
      );
      setSuccess(`Order ${selectedOrder.order_id} marked as confirmed.`);
      setShowConfirmModal(false);
      setSelectedOrder(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to confirm order");
    } finally {
      setConfirming(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "confirmed":
        return <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[10px]">Paid</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">Pending</Badge>;
      default:
        return <Badge variant="destructive" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 mb-2 shadow-sm">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Cryptocurrency & Subscription Checkout Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Customer Orders & Billing
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time audit log of checkout transactions, crypto settlement hashes, and license issuance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="border-border/60 hover:bg-secondary/40 font-semibold"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess("")}>✕</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Filter Status:</span>
            <div className="inline-flex rounded-xl bg-secondary/40 p-1 border border-border/60">
              {["all", "completed", "pending", "failed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                    statusFilter === st
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            Showing {filtered.length} of {orders.length} transactions
          </div>
        </CardContent>
      </Card>

      {/* Orders Ledger */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No orders matched your selected status filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 text-xs">
                    <TableHead className="pl-6">Order Reference</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Fiat Amount</TableHead>
                    <TableHead>Crypto Payment</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => (
                    <TableRow key={order.id} className="border-border/30 hover:bg-secondary/20 transition-colors text-xs">
                      <TableCell className="pl-6 font-mono font-bold">
                        <span className="text-foreground select-all">{order.order_id}</span>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        User #{order.user_id}
                      </TableCell>

                      <TableCell className="font-mono font-bold text-foreground">
                        ${Number(order.amount || 0).toFixed(2)} USD
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">
                            {order.crypto_currency || "CRYPTO"}
                          </Badge>
                          {order.crypto_amount && (
                            <span className="text-muted-foreground">{order.crypto_amount}</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {order.plan_tier || "PRO"}
                        </Badge>
                      </TableCell>

                      <TableCell>{getStatusBadge(order.status)}</TableCell>

                      <TableCell className="text-muted-foreground font-mono text-[11px]">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowConfirmModal(true);
                              }}
                              className="h-7 text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500 hover:text-white"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Fulfill
                            </Button>
                          )}
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

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <CheckCircle className="h-5 w-5 text-teal-400" />
              Manual Order Fulfillment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Verify and confirm transaction {selectedOrder?.order_id}. This will activate the user&apos;s subscription.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fiat Amount:</span>
                <strong className="font-mono text-foreground">${selectedOrder.amount} USD</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selected Currency:</span>
                <strong className="font-mono text-primary">{selectedOrder.crypto_currency || "CRYPTO"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <strong className="font-mono text-foreground">#{selectedOrder.user_id}</strong>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-3">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="bg-teal-500 text-white font-semibold hover:bg-teal-600"
            >
              {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm & Issue Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}