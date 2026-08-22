"use client";

import { useState } from "react";
import { ShieldAlert, Play, CheckCircle2, Loader2, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function ReporterPage() {
  const [targetLinks, setTargetLinks] = useState<string>("https://t.me/scam_channel_example");
  const [reportReason, setReportReason] = useState<string>("spam");
  const [accountCount, setAccountCount] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const handleReport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/workflow/run-step", {
        stage_number: 7,
        step_id: "7B",
        operation: "mass_report",
        params: {
          links: targetLinks.split("\n").filter(Boolean),
          reason: reportReason,
          accounts_count: accountCount,
        },
      });
      setResult(res.data);
    } catch (e: any) {
      setResult({ status: "error", message: e.message || "Report failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          Parallel Multi-Account Reporter
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Submit parallel multi-account reports against spam, fake channels, scam bots, and infringing content
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Links to Report (One per line)</label>
          <textarea
            rows={4}
            value={targetLinks}
            onChange={(e) => setTargetLinks(e.target.value)}
            placeholder="https://t.me/fake_channel\nhttps://t.me/scam_bot\nhttps://t.me/channel/42"
            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Report Violation Category</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground"
            >
              <option value="spam">Spam / Unsolicited Advertising</option>
              <option value="fake">Fake Account / Impersonation</option>
              <option value="violence">Violence / Harmful Material</option>
              <option value="copyright">Copyright Infringement</option>
              <option value="other">Other Violation</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Assigned Reporting Accounts</label>
            <input
              type="number"
              value={accountCount}
              onChange={(e) => setAccountCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-border">
          <button
            onClick={handleReport}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-95 shadow-md shadow-destructive/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertOctagon className="h-4 w-4" />}
            {loading ? "Submitting Reports..." : "Execute Parallel Mass Report"}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <CheckCircle2 className="h-4 w-4" /> Reports Dispatched
          </div>
          <pre className="p-3 bg-secondary rounded-lg font-mono text-xs text-foreground overflow-x-auto">
            {JSON.stringify(result.result || result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
