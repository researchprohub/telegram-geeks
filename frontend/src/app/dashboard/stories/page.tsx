"use client";

import { useState } from "react";
import { Sparkles, Upload, Tag, Trash2, Download, Play, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function StoriesPage() {
  const [activeTab, setActiveTab] = useState<"publish" | "tag" | "clean" | "export">("publish");
  const [mediaFile, setMediaFile] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [targetUsers, setTargetUsers] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const handleExecute = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/workflow/run-step", {
        stage_number: 6,
        step_id: "6B",
        operation: activeTab === "publish" ? "publish_story" : activeTab === "tag" ? "tag_users" : activeTab === "clean" ? "clean_stories" : "export_links",
        params: {
          caption,
          target_users: targetUsers.split("\n").filter(Boolean),
          media: mediaFile,
        },
      });
      setResult(res.data);
    } catch (e: any) {
      setResult({ status: "error", message: e.message || "Failed to execute story action" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Stories Management Suite
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Publish Telegram stories, tag target prospects for notification push, clean story history, and export links
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {[
          { id: "publish", label: "Publish Story", icon: Upload },
          { id: "tag", label: "Tag Users in Story", icon: Tag },
          { id: "clean", label: "Clean Archive", icon: Trash2 },
          { id: "export", label: "Export Links", icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setResult(null); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        {activeTab === "publish" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Story Media URL or Asset Path</label>
              <input
                value={mediaFile}
                onChange={(e) => setMediaFile(e.target.value)}
                placeholder="https://domain.com/story-banner.png or ./assets/story1.jpg"
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Caption / Spintax</label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="{🔥 Big News|🚀 New Launch}! Join our private alpha group now."
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground font-mono"
              />
            </div>
          </div>
        )}

        {activeTab === "tag" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Usernames to Tag (One per line)</label>
              <textarea
                rows={5}
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                placeholder="@crypto_whale\n@defi_trader\n@sol_builder"
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tagged users receive a high-priority push notification directly in their Telegram chat list.
            </p>
          </div>
        )}

        {activeTab === "clean" && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">Bulk Clean Story Archives</h3>
            <p className="text-xs text-muted-foreground">
              Removes expired and active stories across selected accounts to maintain fresh account profiles.
            </p>
          </div>
        )}

        {activeTab === "export" && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">Export Live Story Links</h3>
            <p className="text-xs text-muted-foreground">
              Extracts public story URLs to verify reach, impressions, and viewer counts.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end pt-4 border-t border-border">
          <button
            onClick={handleExecute}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            {loading ? "Processing..." : "Execute Story Action"}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <CheckCircle2 className="h-4 w-4" /> Result
          </div>
          <pre className="p-3 bg-secondary rounded-lg font-mono text-xs text-foreground overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
