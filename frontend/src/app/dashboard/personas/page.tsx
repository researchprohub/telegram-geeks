"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Brain, Edit, Trash2, Sparkles, Loader2, AlertCircle, Phone, Globe } from "lucide-react";
import api from "@/lib/api";

const TONE_OPTIONS = ["casual", "professional", "friendly", "excited", "analytical", "humorous"];

interface Persona {
  id: number;
  name: string;
  tone: string;
  energy_level: number;
  humor_level: number;
  niche_tags: string[];
  avatar_url?: string | null;
  soul_prompt?: string | null;
  telegram_account_id?: number | null;
  webhook_url?: string | null;
  is_active: boolean;
}

export default function PersonasPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTone, setNewTone] = useState("casual");
  const [newEnergy, setNewEnergy] = useState(0.5);
  const [newHumor, setNewHumor] = useState(0.3);
  const [newFormality, setNewFormality] = useState(0.4);
  const [newSoulPrompt, setNewSoulPrompt] = useState("");
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersonas();
  }, []);

  async function fetchPersonas() {
    try {
      const response = await api.get("/personas/");
      setPersonas(response.data.items || response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch personas");
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async () => {
    if (!newName) return;
    try {
      await api.post("/personas/", {
        name: newName,
        tone: newTone,
        energy_level: newEnergy,
        humor_level: newHumor,
        formality_level: newFormality,
        soul_prompt: newSoulPrompt || null,
      });
      await fetchPersonas();
      setShowModal(false);
      setNewName("");
      setNewTone("casual");
      setNewEnergy(0.5);
      setNewHumor(0.3);
      setNewFormality(0.4);
      setNewSoulPrompt("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create persona");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this persona?")) return;
    try {
      await api.delete(`/personas/${id}`);
      await fetchPersonas();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete persona");
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    setTestResult("");
    try {
      const response = await api.post(`/personas/${id}/test`);
      setTestResult(response.data.response || "Test completed successfully.");
    } catch (err: any) {
      setTestResult(err.response?.data?.detail || "Test failed");
    } finally {
      setTestingId(null);
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
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">AI Personas</h1>
            <p className="text-xs text-muted-foreground">{personas.length} personas</p>
          </div>
          <Button onClick={() => setShowModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Persona
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError("")} className="ml-auto">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {personas.map(p => (
            <Card key={p.id} className={`border-border shadow-sm hover:shadow-md transition-shadow ${!p.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Brain className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <CardTitle className="text-base">{p.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/personas/${p.id}`)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-1 flex-wrap items-center">
                  <Badge variant="outline">{p.tone}</Badge>
                  {(p.niche_tags || []).map(n => <Badge key={n} variant="secondary">{n}</Badge>)}
                  {p.telegram_account_id && (
                    <Badge variant="default" className="bg-success text-success-foreground text-[10px]">
                      <Phone className="h-3 w-3 mr-0.5" /> Account
                    </Badge>
                  )}
                  {p.webhook_url && (
                    <Badge variant="default" className="bg-primary text-primary-foreground text-[10px]">
                      <Globe className="h-3 w-3 mr-0.5" /> Webhook
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Energy</span>
                    <span className="text-foreground">{Math.round((p.energy_level ?? 0) * 100)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(p.energy_level ?? 0) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Humor</span>
                    <span className="text-foreground">{Math.round((p.humor_level ?? 0) * 100)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(p.humor_level ?? 0) * 100}%` }} />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleTest(p.id)}
                  disabled={testingId === p.id}
                >
                  {testingId === p.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  {testingId === p.id ? "Generating..." : "Test Generation"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Persona</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Persona Name</label>
              <Input
                placeholder="e.g., Alex"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tone</label>
              <select
                value={newTone}
                onChange={e => setNewTone(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {TONE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Energy: {Math.round(newEnergy * 100)}%</label>
              <input type="range" min="0" max="1" step="0.1" value={newEnergy} onChange={e => setNewEnergy(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Humor: {Math.round(newHumor * 100)}%</label>
              <input type="range" min="0" max="1" step="0.1" value={newHumor} onChange={e => setNewHumor(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Formality: {Math.round(newFormality * 100)}%</label>
              <input type="range" min="0" max="1" step="0.1" value={newFormality} onChange={e => setNewFormality(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Soul Prompt</label>
              <textarea value={newSoulPrompt} onChange={e => setNewSoulPrompt(e.target.value)} rows={3} placeholder="Optional — define the persona's core identity"
                className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary resize-y" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {testResult && (
        <Dialog open={!!testResult} onOpenChange={() => setTestResult("")}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Result</DialogTitle>
            </DialogHeader>
            <div className="bg-secondary/50 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap">
              {testResult}
            </div>
            <DialogFooter>
              <Button onClick={() => setTestResult("")}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}