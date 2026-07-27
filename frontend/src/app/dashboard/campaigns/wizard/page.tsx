"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, CheckCircle2, Loader2, ChevronRight, ChevronLeft,
  Target, Settings, FileText, Calendar, CheckCircle,
} from "lucide-react";
import api from "@/lib/api";

const STEPS = [
  { id: "basics", label: "Basics", icon: FileText },
  { id: "target", label: "Target", icon: Target },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "review", label: "Review", icon: CheckCircle },
];

const TARGET_GROUPS = [
  { id: "tech", label: "Tech & Crypto", desc: "Developers, traders, blockchain" },
  { id: "marketing", label: "Marketing", desc: "Marketers, advertisers, SMM" },
  { id: "gaming", label: "Gaming", desc: "Gamers, streamers, esports" },
  { id: "finance", label: "Finance", desc: "Investors, analysts, finance" },
  { id: "business", label: "Business", desc: "Entrepreneurs, startups" },
  { id: "education", label: "Education", desc: "Students, teachers, academies" },
];

export default function CampaignWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "engagement", description: "",
    targets: [] as string[], target_count: 500,
    daily_limit: 50, delay_min: 10, delay_max: 30, use_spintax: true,
    start_now: true, start_date: "", message_template: "",
  });

  function update(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function toggleTarget(id: string) {
    setForm(prev => ({
      ...prev,
      targets: prev.targets.includes(id)
        ? prev.targets.filter(t => t !== id)
        : [...prev.targets, id],
    }));
  }

  async function handleCreate() {
    setCreating(true);
    try {
      await api.post("/campaigns/", {
        name: form.name,
        campaign_type: form.type,
        description: form.description,
        config: {
          target_groups: form.targets,
          target_count: form.target_count,
          daily_message_limit: form.daily_limit,
          delay_range: [form.delay_min, form.delay_max],
          use_spintax: form.use_spintax,
          start_now: form.start_now,
          start_date: form.start_date || null,
          message_template: form.message_template || null,
        },
        status: "draft",
      });
      router.push("/dashboard/campaigns");
    } catch {
      // keep on page so user can retry
    } finally {
      setCreating(false);
    }
  }

  function canProceed(): boolean {
    if (step === 0) return form.name.length >= 2;
    if (step === 1) return form.targets.length > 0;
    return true;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">New Campaign</h1>
            <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="px-4 py-3">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-2 w-full rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-secondary"
              }`} />
              <div className={`flex items-center gap-1 text-[10px] font-medium ${
                i === step ? "text-primary" : i < step ? "text-green-500" : "text-muted-foreground"
              }`}>
                <s.icon className="h-3 w-3" />
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="px-4 space-y-4">
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <Card className="border-border shadow-sm">
              <CardContent className="pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Campaign Name</label>
                  <Input placeholder="e.g., Tech Community Q3" value={form.name} onChange={e => update("name", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Campaign Type</label>
                  <select value={form.type} onChange={e => update("type", e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary">
                    <option value="engagement">Engagement</option>
                    <option value="messaging">Messaging</option>
                    <option value="invite">Invite</option>
                    <option value="social_proof">Social Proof</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Description (optional)</label>
                  <textarea value={form.description} onChange={e => update("description", e.target.value)}
                    rows={3} placeholder="What is this campaign about?"
                    className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <Card className="border-border shadow-sm">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">Select target audience types for this campaign:</p>
                <div className="grid grid-cols-2 gap-2">
                  {TARGET_GROUPS.map(g => (
                    <div key={g.id} onClick={() => toggleTarget(g.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        form.targets.includes(g.id)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/30 hover:bg-secondary/50"
                      }`}>
                      <p className="text-sm font-medium text-foreground">{g.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Target Audience Size</label>
                  <Input type="number" value={form.target_count}
                    onChange={e => update("target_count", parseInt(e.target.value) || 0)}
                    min={100} max={10000} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <Card className="border-border shadow-sm">
              <CardContent className="pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Daily Message Limit</label>
                  <Input type="number" value={form.daily_limit}
                    onChange={e => update("daily_limit", parseInt(e.target.value) || 0)}
                    min={5} max={500} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Min Delay (seconds)</label>
                    <Input type="number" value={form.delay_min}
                      onChange={e => update("delay_min", parseInt(e.target.value) || 0)}
                      min={1} max={300} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Max Delay (seconds)</label>
                    <Input type="number" value={form.delay_max}
                      onChange={e => update("delay_max", parseInt(e.target.value) || 0)}
                      min={1} max={300} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Message Template</label>
                  <textarea value={form.message_template} onChange={e => update("message_template", e.target.value)}
                    rows={3} placeholder="Optional default message template..."
                    className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
                </div>
                <label className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={form.use_spintax}
                    onChange={e => update("use_spintax", e.target.checked)}
                    className="rounded border-border" />
                  <span className="text-sm text-foreground">Use Spintax for message variation</span>
                </label>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <Card className="border-border shadow-sm">
              <CardContent className="pt-4 space-y-4">
                <label className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={form.start_now}
                    onChange={e => update("start_now", e.target.checked)}
                    className="rounded border-border" />
                  <span className="text-sm text-foreground">Start campaign immediately</span>
                </label>
                {!form.start_now && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Scheduled Start Date</label>
                    <Input type="datetime-local" value={form.start_date}
                      onChange={e => update("start_date", e.target.value)} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <Card className="border-border shadow-sm">
              <CardContent className="pt-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Review Your Campaign</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-secondary/20 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Name</p>
                    <p className="font-medium text-foreground">{form.name}</p>
                  </div>
                  <div className="bg-secondary/20 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Type</p>
                    <p className="font-medium text-foreground capitalize">{form.type}</p>
                  </div>
                  <div className="bg-secondary/20 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Target Groups</p>
                    <p className="font-medium text-foreground">{form.targets.length} selected</p>
                  </div>
                  <div className="bg-secondary/20 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Audience Size</p>
                    <p className="font-medium text-foreground">{form.target_count}</p>
                  </div>
                  <div className="bg-secondary/20 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Daily Limit</p>
                    <p className="font-medium text-foreground">{form.daily_limit} msgs</p>
                  </div>
                  <div className="bg-secondary/20 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Delay Range</p>
                    <p className="font-medium text-foreground">{form.delay_min}s - {form.delay_max}s</p>
                  </div>
                  <div className="bg-secondary/20 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Spintax</p>
                    <p className="font-medium text-foreground">{form.use_spintax ? "Enabled" : "Disabled"}</p>
                  </div>
                  <div className="bg-secondary/20 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Start</p>
                    <p className="font-medium text-foreground">{form.start_now ? "Immediately" : form.start_date || "Not set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              {creating ? "Creating..." : "Launch Campaign"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
