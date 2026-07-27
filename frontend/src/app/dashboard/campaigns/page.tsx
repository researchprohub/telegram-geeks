"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Play, Pause, Trash2, BarChart3, Loader2, AlertCircle, Wand2, Rocket, Pencil, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

const TYPE_COLORS: Record<string, string> = {
  engagement: "bg-blue-500",
  invite: "bg-purple-500",
  messaging: "bg-green-500",
  social_proof: "bg-orange-500",
};

interface Campaign {
  id: number;
  name: string;
  campaign_type: string;
  status: string;
  conversations?: number;
  efficiency?: number;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const response = await api.get("/campaigns/");
      setCampaigns(response.data.items || response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  }

  const handleStart = async (id: number) => {
    try {
      await api.post(`/campaigns/${id}/start`);
      await fetchCampaigns();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to start campaign");
    }
  };

  const handlePause = async (id: number) => {
    try {
      await api.post(`/campaigns/${id}/pause`);
      await fetchCampaigns();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to pause campaign");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await api.delete(`/campaigns/${id}`);
      await fetchCampaigns();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete campaign");
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
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.07] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Campaigns</h1>
            <p className="text-sm text-slate-400">{campaigns.length} total</p>
          </div>
          <Link href="/dashboard/campaigns/wizard">
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)]">
              <Wand2 className="h-4 w-4" />
              New Campaign
            </button>
          </Link>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl font-bold text-cyan-400">{campaigns.filter(c => c.status === "running").length}</div>
              <Rocket className="h-4 w-4 text-cyan-400/60" />
            </div>
            <p className="text-xs text-slate-400">Running</p>
          </div>
          <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl font-bold text-yellow-400">{campaigns.filter(c => c.status === "paused").length}</div>
              <Pause className="h-4 w-4 text-yellow-400/60" />
            </div>
            <p className="text-xs text-slate-400">Paused</p>
          </div>
          <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl font-bold text-blue-400">{campaigns.filter(c => c.status === "draft").length}</div>
              <Pencil className="h-4 w-4 text-blue-400/60" />
            </div>
            <p className="text-xs text-slate-400">Drafts</p>
          </div>
          <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl font-bold text-purple-400">{campaigns.reduce((s, c) => s + (c.conversations || 0), 0)}</div>
              <Zap className="h-4 w-4 text-purple-400/60" />
            </div>
            <p className="text-xs text-slate-400">Conversations</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError("")} className="ml-auto text-slate-500 hover:text-white">✕</button>
          </div>
        )}

        {/* Campaign List */}
        <div className="space-y-2">
          {campaigns.map(c => (
            <div key={c.id} className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-4 hover:bg-white/[0.04] transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${TYPE_COLORS[c.campaign_type] || "bg-slate-500"} shadow-[0_0_6px_rgba(255,255,255,0.1)]`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{c.campaign_type} · {c.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {c.status === "running" && (
                    <button onClick={() => handlePause(c.id)} className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition-all">
                      <Pause className="h-4 w-4" />
                    </button>
                  )}
                  {c.status === "paused" || c.status === "draft" ? (
                    <button onClick={() => handleStart(c.id)} className="p-2 rounded-xl hover:bg-white/[0.06] transition-all">
                      <Play className="h-4 w-4 text-green-400" />
                    </button>
                  ) : null}
                  <button onClick={() => router.push("/dashboard/analytics")} className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition-all">
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 rounded-xl hover:bg-white/[0.06] transition-all">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
