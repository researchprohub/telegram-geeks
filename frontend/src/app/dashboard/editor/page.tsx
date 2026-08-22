"use client";

import { useState } from "react";
import { Edit3, CheckCircle2, Loader2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function MessageEditorPage() {
  const [accountId, setAccountId] = useState<string>("1");
  const [chatId, setChatId] = useState<string>("-1001928374829");
  const [messageId, setMessageId] = useState<string>("42");
  const [newText, setNewText] = useState<string>("🔥 Updated Announcement: Our private alpha is now live for all tier members!");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const handleEditMessage = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/workflow/run-step", {
        stage_number: 4,
        step_id: "4B",
        operation: "edit_message",
        params: {
          account_id: accountId,
          chat_id: Number(chatId),
          message_id: Number(messageId),
          new_text: newText,
        },
      });
      setResult(res.data);
    } catch (e: any) {
      setResult({ status: "error", message: e.message || "Message edit failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <Edit3 className="h-6 w-6 text-primary" />
          48-Hour Message Post-Send Editor
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Edit and update previously broadcasted messages across groups and channels within Telegram's 48-hour edit window
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs text-foreground font-medium">
            Telegram protocol permits editing sent messages up to 48 hours post-dispatch. Changes reflect instantly for all recipients.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Sender Account ID</label>
            <input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Chat / Channel ID</label>
            <input
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Message ID</label>
            <input
              value={messageId}
              onChange={(e) => setMessageId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">New Message Content</label>
          <textarea
            rows={4}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground font-mono"
          />
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-border">
          <button
            onClick={handleEditMessage}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
            {loading ? "Editing Message..." : "Update Live Telegram Message"}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <CheckCircle2 className="h-4 w-4" /> Message Updated
          </div>
          <pre className="p-3 bg-secondary rounded-lg font-mono text-xs text-foreground overflow-x-auto">
            {JSON.stringify(result.result || result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
