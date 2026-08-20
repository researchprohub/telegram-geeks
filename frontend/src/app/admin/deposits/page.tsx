"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [txHash, setTxHash] = useState("");
  const [amount, setAmount] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDeposits();
  }, []);

  async function fetchDeposits() {
    try {
      const res = await api.get("/admin/deposits/pending");
      setDeposits(res.data.deposits || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load deposits");
    } finally {
      setLoading(false);
    }
  }

  const openConfirm = (d: any) => {
    setSelectedDeposit(d);
    setTxHash(d.tx_hash || "");
    setAmount(String(d.expected_amount ?? ""));
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedDeposit) return;
    setConfirming(true);
    try {
      await api.post(`/admin/deposits/${selectedDeposit.id}/confirm`, {
        tx_hash: txHash,
        amount: parseFloat(amount) || 0,
      });
      setDeposits(prev => prev.filter(d => d.id !== selectedDeposit.id));
      setShowConfirmModal(false);
      setSelectedDeposit(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to confirm deposit");
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async (dep: any) => {
    setRejecting(true);
    try {
      await api.post(`/admin/deposits/${dep.id}/reject`);
      setDeposits(prev => prev.filter(d => d.id !== dep.id));
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reject deposit");
    } finally {
      setRejecting(false);
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Manual Deposits</h1>
        <p className="text-sm text-muted-foreground">Review and confirm on-chain deposits awaiting credit.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">✕</button>
        </div>
      )}

      {/* Pending */}
      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle className="text-base text-foreground">Pending Deposits ({deposits.length})</CardTitle></CardHeader>
        {deposits.length === 0 ? (
          <CardContent><p className="py-8 text-center text-sm text-muted-foreground">No pending deposits.</p></CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deposit ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>TX Hash</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-sm text-foreground">#{d.id}</TableCell>
                  <TableCell className="text-foreground">#{d.user_id}</TableCell>
                  <TableCell><Badge variant="outline">{d.currency}</Badge></TableCell>
                  <TableCell className="font-medium text-foreground">{d.expected_amount}</TableCell>
                  <TableCell className="text-foreground">{d.received_amount ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.address ? `${String(d.address).slice(0, 14)}…` : "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.tx_hash ? `${String(d.tx_hash).slice(0, 14)}…` : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.created_at ? new Date(d.created_at).toLocaleString() : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openConfirm(d)} disabled={rejecting}>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleReject(d)} disabled={rejecting}>
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Confirm Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deposit #{selectedDeposit?.id}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">TX Hash</label>
              <Input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Amount Received</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={confirming || !txHash}>
              {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              {confirming ? "Confirming..." : "Confirm Deposit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}