"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";

export default function AdminDepositsPage() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState("");
  const [confirming, setConfirming] = useState(false);

  interface Deposit {
    id: string;
    user: string;
    address: string;
    currency: string;
    network: string;
    amount: number;
    confirmations: number;
    minConfirmations: number;
    txHash: string;
    created: string;
    status?: string;
  }

  const pendingDeposits: Deposit[] = [
    { id: "DEP-001", user: "john@example.com", address: "0xabc...1234", currency: "USDT", network: "TRC20", amount: 149.00, confirmations: 1, minConfirmations: 1, txHash: "0xtx...abc", created: "2026-07-15 14:30" },
    { id: "DEP-002", user: "sarah@example.com", address: "bc1q...xyz", currency: "BTC", network: "BTC", amount: 0.005, confirmations: 2, minConfirmations: 3, txHash: "0xtx...def", created: "2026-07-15 12:15" },
  ];

  const allDeposits: Deposit[] = [
    ...pendingDeposits,
    { id: "DEP-003", user: "lisa@example.com", address: "0xdef...5678", currency: "ETH", network: "ETH", amount: 0.05, confirmations: 12, minConfirmations: 12, txHash: "0xtx...ghi", created: "2026-07-14 09:45", status: "confirmed" },
  ];

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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Manual Deposits</h1>
        <p className="text-sm text-muted-foreground">Review and confirm on-chain deposits awaiting credit.</p>
      </div>

      {/* Pending */}
      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle className="text-base text-foreground">Pending Deposits ({pendingDeposits.length})</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deposit ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Confirmations</TableHead>
              <TableHead>TX Hash</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingDeposits.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-sm text-foreground">{d.id}</TableCell>
                <TableCell className="text-foreground">{d.user}</TableCell>
                <TableCell><Badge variant="outline">{d.currency} ({d.network})</Badge></TableCell>
                <TableCell className="font-medium text-foreground">{d.amount}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-secondary rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${Math.min((d.confirmations / d.minConfirmations) * 100, 100)}%` }} />
                    </div>
                    <span className="text-sm text-foreground">{d.confirmations}/{d.minConfirmations}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{d.txHash}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedDeposit(d.id); setShowConfirmModal(true); }}>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* All Deposits */}
      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle className="text-base text-foreground">All Deposits</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allDeposits.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-sm text-foreground">{d.id}</TableCell>
                <TableCell className="text-foreground">{d.user}</TableCell>
                <TableCell><Badge variant="outline">{d.currency}</Badge></TableCell>
                <TableCell className="text-foreground">{d.amount}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    d.status === "confirmed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                  }`}>
                    {d.status || "pending"}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.created}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Confirm Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deposit {selectedDeposit}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Confirm this deposit and credit the user's account?</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={confirming}>
              {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              {confirming ? "Confirming..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
