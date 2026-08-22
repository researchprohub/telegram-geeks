"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Wallet,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Coins,
  ShieldAlert,
} from "lucide-react";
import api from "@/lib/api";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [txHash, setTxHash] = useState("");
  const [amount, setAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchDeposits();
  }, []);

  async function fetchDeposits() {
    setLoading(true);
    try {
      const res = await api.get("/admin/deposits/pending");
      setDeposits(res.data?.deposits || []);
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

  const openReject = (d: any) => {
    setSelectedDeposit(d);
    setRejectReason("Transaction hash not found on blockchain explorer.");
    setShowRejectModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedDeposit) return;
    setConfirming(true);
    try {
      await api.post(`/admin/deposits/${selectedDeposit.id}/confirm`, {
        tx_hash: txHash,
        amount: parseFloat(amount) || 0,
      });
      setDeposits((prev) => prev.filter((d) => d.id !== selectedDeposit.id));
      setSuccess(`Deposit #${selectedDeposit.id} confirmed and user credited.`);
      setShowConfirmModal(false);
      setSelectedDeposit(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to confirm deposit");
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit) return;
    setRejecting(true);
    try {
      await api.post(`/admin/deposits/${selectedDeposit.id}/reject?reason=${encodeURIComponent(rejectReason)}`);
      setDeposits((prev) => prev.filter((d) => d.id !== selectedDeposit.id));
      setSuccess(`Deposit #${selectedDeposit.id} rejected.`);
      setShowRejectModal(false);
      setSelectedDeposit(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reject deposit");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 mb-2 shadow-sm">
            <Wallet className="h-3.5 w-3.5" />
            <span>Cryptocurrency Manual Review Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Crypto Deposit Approvals
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Review incoming blockchain deposits, verify on-chain hashes, and credit customer balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDeposits}
            disabled={loading}
            className="border-border/60 hover:bg-secondary/40 font-semibold"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Queue
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

      {/* Queue Table */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-400" />
              Pending Blockchain Deposits ({deposits.length})
            </span>
            <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
              Awaiting Verification
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : deposits.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-teal-400/50 mb-1" />
              <p className="font-semibold text-foreground text-sm">Deposit Queue Clear</p>
              <p className="text-xs">All incoming cryptographic deposits have been approved or fulfilled.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 text-xs">
                    <TableHead className="pl-6">Deposit ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Expected Amount</TableHead>
                    <TableHead>Tx Hash / Reference</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((d) => (
                    <TableRow key={d.id} className="border-border/30 hover:bg-secondary/20 transition-colors text-xs">
                      <TableCell className="pl-6 font-mono font-bold text-foreground">
                        #{d.id}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        User #{d.user_id}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-400 border-amber-500/30">
                          {d.currency || "USDT"}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-mono font-bold text-foreground">
                        {d.expected_amount ?? d.amount} {d.currency || "USD"}
                      </TableCell>

                      <TableCell className="font-mono text-[11px] select-all max-w-[200px] truncate">
                        {d.tx_hash ? (
                          <span className="text-primary hover:underline">{d.tx_hash}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Not provided yet</span>
                        )}
                      </TableCell>

                      <TableCell className="text-muted-foreground font-mono text-[11px]">
                        {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => openConfirm(d)}
                            className="h-7 text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500 hover:text-white"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openReject(d)}
                            className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
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

      {/* Approve Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <CheckCircle className="h-5 w-5 text-teal-400" />
              Approve Deposit #{selectedDeposit?.id}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Confirm on-chain transaction hash and settled amount to credit user #{selectedDeposit?.user_id}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Transaction Hash (TxID) *</label>
              <Input
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x... or solana tx signature"
                className="font-mono text-xs bg-secondary/30 border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Actual Confirmed Amount *</label>
              <Input
                type="number"
                step="0.0001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono text-xs bg-secondary/30 border-border"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={confirming || !amount}
              className="bg-teal-500 text-white font-semibold hover:bg-teal-600"
            >
              {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm & Credit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Reject Deposit #{selectedDeposit?.id}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide a rejection reason for user #{selectedDeposit?.user_id}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Rejection Reason</label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-secondary/30 border-border text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={rejecting}
              variant="destructive"
              className="font-semibold"
            >
              {rejecting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Reject Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}