"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [confirming, setConfirming] = useState(false);

  const orders = [
    { id: "ORD-001", user: "john@example.com", amount: "$149.00", gateway: "NowPayments", crypto: "USDT (TRC20)", status: "completed", date: "2026-07-15 14:30", tx: "0xabc123..." },
    { id: "ORD-002", user: "sarah@example.com", amount: "$49.00", gateway: "Oxapay", crypto: "BTC", status: "pending", date: "2026-07-15 12:15", tx: "" },
    { id: "ORD-003", user: "lisa@example.com", amount: "$399.00", gateway: "NowPayments", crypto: "ETH", status: "completed", date: "2026-07-14 09:45", tx: "0xdef456..." },
    { id: "ORD-004", user: "alex@example.com", amount: "$149.00", gateway: "Oxapay", crypto: "USDT (ERC20)", status: "expired", date: "2026-07-13 16:00", tx: "" },
    { id: "ORD-005", user: "mike@example.com", amount: "$49.00", gateway: "NowPayments", crypto: "LTC", status: "pending", date: "2026-07-15 18:20", tx: "" },
  ];

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      setShowConfirmModal(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders & Payments</h1>
        <p className="text-sm text-muted-foreground">Track crypto payments and confirm pending orders.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-sm"><CardContent className="pt-6"><div className="text-3xl font-bold text-yellow-500">{orders.filter(o => o.status === "pending").length}</div><p className="mt-1 text-sm text-muted-foreground">Pending</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="pt-6"><div className="text-3xl font-bold text-green-500">{orders.filter(o => o.status === "completed").length}</div><p className="mt-1 text-sm text-muted-foreground">Completed</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="pt-6"><div className="text-3xl font-bold text-red-500">{orders.filter(o => o.status === "expired").length}</div><p className="mt-1 text-sm text-muted-foreground">Expired</p></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="pt-6"><div className="text-3xl font-bold">${orders.reduce((s, o) => s + parseFloat(o.amount.replace("$", "")), 0).toFixed(2)}</div><p className="mt-1 text-sm text-muted-foreground">Total Revenue</p></CardContent></Card>
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
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
          </select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
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
                  <TableCell className="font-mono text-sm text-foreground">{o.id}</TableCell>
                  <TableCell className="text-foreground">{o.user}</TableCell>
                  <TableCell className="font-medium text-foreground">{o.amount}</TableCell>
                  <TableCell><Badge variant="outline">{o.gateway}</Badge></TableCell>
                  <TableCell className="text-sm text-foreground">{o.crypto}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      o.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" :
                      o.status === "pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" :
                      "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    }`}>
                      {o.status}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{o.tx || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.date}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      {o.status === "pending" && (
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedOrderId(o.id); setShowConfirmModal(true); }}>
                          <CheckCircle className="h-4 w-4 text-green-500" />
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

      {/* Confirm Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Order {selectedOrderId}</DialogTitle></DialogHeader>
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
