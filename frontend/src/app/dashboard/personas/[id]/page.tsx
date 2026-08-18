"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2, AlertTriangle, Upload, Phone, Globe, Database, CheckCircle2, Users, Sparkles, Plus, Trash2 } from "lucide-react";
import { personasApi, accountsApi, groupsApi } from "@/lib/api";

const TONE_OPTIONS = ["casual", "professional", "friendly", "excited", "analytical", "humorous"];

const SOUL_DEFAULTS = {
  age: 25, gender: "neutral", nationality: "US", occupation: "Professional",
  bio: "", values: [], philosophy: "", priorities: [], pet_peeves: [],
  humor_style: "dry", openness: 5, conscientiousness: 5, extraversion: 5,
  agreeableness: 5, neuroticism: 3, vocabulary: [], catchphrases: [], emoji_style: "occasional",
  expertise: [], opinions: {}, blindspots: [],
};

interface Account {
  id: number;
  phone_number: string;
  status: string;
}

interface Group {
  id: number;
  title: string;
  group_type: string;
  member_count: number;
}

interface GroupPrompt {
  group_name: string;
  purpose: string;
  member_count: string;
  language: string;
  topics: string[];
  culture_tone: string;
  active_hours: string;
  joining_reason: string;
  participation_style: string;
}

export default function PersonaEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [tone, setTone] = useState("casual");
  const [energy, setEnergy] = useState(0.5);
  const [humor, setHumor] = useState(0.3);
  const [formality, setFormality] = useState(0.4);
  const [isActive, setIsActive] = useState(true);
  const [soulPrompt, setSoulPrompt] = useState("");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [assignedAccountId, setAssignedAccountId] = useState<number | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  const [soulForm, setSoulForm] = useState<any>(SOUL_DEFAULTS);
  const [soulGenerating, setSoulGenerating] = useState(false);

  const [groupPrompts, setGroupPrompts] = useState<Record<string, GroupPrompt>>({});
  const [newGroupPromptKey, setNewGroupPromptKey] = useState("");

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookHeaders, setWebhookHeaders] = useState("{}");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [importColumns, setImportColumns] = useState("");
  const [exportColumns, setExportColumns] = useState("");
  const [autoSync, setAutoSync] = useState(false);

  useEffect(() => {
    Promise.all([
      personasApi.get(id),
      accountsApi.list(1, 200),
      groupsApi.list(1, 200),
      personasApi.getAssignedGroups(id),
    ])
      .then(([res, accRes, grpRes, assignedRes]) => {
        const p = res.data;
        setName(p.name);
        setTone(p.tone || "casual");
        setEnergy(p.energy_level ?? 0.5);
        setHumor(p.humor_level ?? 0.3);
        setFormality(p.formality_level ?? 0.4);
        setIsActive(p.is_active ?? true);
        setSoulPrompt(p.soul_prompt ?? "");
        setAvatarPreview(p.avatar_url || null);
        setAssignedAccountId(p.telegram_account_id ?? null);
        setWebhookUrl(p.webhook_url || "");
        setWebhookHeaders(JSON.stringify(p.webhook_headers || {}, null, 2));
        if (p.sheets_config) {
          setSpreadsheetId(p.sheets_config.spreadsheet_id || "");
          setSheetName(p.sheets_config.sheet_name || "Sheet1");
          setImportColumns(p.sheets_config.import_columns || "");
          setExportColumns(p.sheets_config.export_columns || "");
          setAutoSync(p.sheets_config.auto_sync || false);
        }
        const gp = typeof p.group_prompts === "string" ? JSON.parse(p.group_prompts) : (p.group_prompts ?? {});
        setGroupPrompts(gp);
        if (p.soul_prompt_data && Object.keys(p.soul_prompt_data).length) {
          setSoulForm({ ...SOUL_DEFAULTS, ...p.soul_prompt_data });
        }
        setAccounts((accRes.data.items || accRes.data || []).filter((a: Account) => a.status !== "deleted"));
        setGroups((grpRes.data.items || grpRes.data || []));
        const assignedIds = (assignedRes.data.groups || []).map((g: Group) => g.id);
        setSelectedGroupIds(assignedIds);
      })
      .catch(e => setError(e?.response?.data?.detail || "Failed to load persona"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await personasApi.update(id, {
        name, tone,
        energy_level: energy,
        humor_level: humor,
        formality_level: formality,
        is_active: isActive,
        soul_prompt: soulPrompt || null,
        group_prompts: groupPrompts,
      });
      setSuccess("Profile saved");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to save");
    }
    setSaving(false);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await personasApi.uploadImage(id, file);
      setAvatarPreview(res.data.avatar_url);
      setSuccess("Image uploaded");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to upload image");
    }
    setUploading(false);
  };

  const handleAssignAccount = async () => {
    setSaving(true);
    setError(null);
    try {
      if (assignedAccountId) {
        await personasApi.assignAccount(id, assignedAccountId);
      } else {
        await personasApi.unassignAccount(id);
      }
      setSuccess("Account assigned");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to assign account");
    }
    setSaving(false);
  };

  const handleSaveWebhook = async () => {
    setSaving(true);
    setError(null);
    try {
      const headers = (() => { try { return JSON.parse(webhookHeaders); } catch { return {}; } })();
      await personasApi.setWebhook(id, webhookUrl, headers);
      setSuccess("Webhook saved");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to save webhook");
    }
    setSaving(false);
  };

  const handleSaveSheets = async () => {
    setSaving(true);
    setError(null);
    try {
      await personasApi.setSheetsConfig(id, {
        spreadsheet_id: spreadsheetId,
        sheet_name: sheetName,
        import_columns: importColumns,
        export_columns: exportColumns,
        auto_sync: autoSync,
      });
      setSuccess("Sheets config saved");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to save sheets config");
    }
    setSaving(false);
  };

  const handleAssignGroups = async () => {
    setSaving(true);
    setError(null);
    try {
      await personasApi.assignGroups(id, selectedGroupIds);
      setSuccess("Groups assigned");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to assign groups");
    }
    setSaving(false);
  };

  const toggleGroup = (gid: number) => {
    setSelectedGroupIds(prev => prev.includes(gid) ? prev.filter(x => x !== gid) : [...prev, gid]);
  };

  const handleGenerateSoul = async () => {
    setSoulGenerating(true);
    setError(null);
    try {
      const res = await personasApi.generateSoulPrompt(id, soulForm);
      setSoulPrompt(res.data.soul_prompt);
      setSuccess("Soul prompt generated");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to generate soul prompt");
    }
    setSoulGenerating(false);
  };

  const updateGroupPromptField = (key: string, field: string, value: string | string[]) => {
    setGroupPrompts(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
  };

  const addGroupPrompt = () => {
    const key = newGroupPromptKey.trim();
    if (!key) return;
    setGroupPrompts(prev => ({
      ...prev,
      [key]: { group_name: key, purpose: "", member_count: "?", language: "English", topics: [], culture_tone: "friendly", active_hours: "evening", joining_reason: "interest", participation_style: "occasional" },
    }));
    setNewGroupPromptKey("");
  };

  const removeGroupPrompt = (key: string) => {
    setGroupPrompts(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/personas")}>Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/personas")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{name}</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        {error && (
          <div className="mb-4 p-3 text-sm text-red-500 bg-red-500/10 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 text-sm text-green-500 bg-green-500/10 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {success}
          </div>
        )}

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="soul">Soul Gen</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="sheets">Sheets</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle>Personality Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-secondary rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                  </label>
                  <span className="text-sm">{isActive ? "Active" : "Inactive"}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tone</label>
                  <select value={tone} onChange={e => setTone(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary">
                    {TONE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Energy: {Math.round(energy * 100)}%</label>
                  <input type="range" min="0" max="1" step="0.1" value={energy} onChange={e => setEnergy(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Humor: {Math.round(humor * 100)}%</label>
                  <input type="range" min="0" max="1" step="0.1" value={humor} onChange={e => setHumor(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Formality: {Math.round(formality * 100)}%</label>
                  <input type="range" min="0" max="1" step="0.1" value={formality} onChange={e => setFormality(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Soul Prompt</label>
                  <textarea value={soulPrompt} onChange={e => setSoulPrompt(e.target.value)} rows={4}
                    className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary resize-y font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Group Prompts</label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="Group name (e.g. TechTalk)" value={newGroupPromptKey} onChange={e => setNewGroupPromptKey(e.target.value)} />
                      <Button variant="outline" size="sm" onClick={addGroupPrompt}><Plus className="h-4 w-4 mr-1" />Add</Button>
                    </div>
                    {Object.keys(groupPrompts).length === 0 && (
                      <p className="text-xs text-muted-foreground">No per-group prompts yet. Add a group to customize this persona's behavior there.</p>
                    )}
                    {Object.entries(groupPrompts).map(([key, gp]) => (
                      <div key={key} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{gp.group_name || key}</span>
                          <button onClick={() => removeGroupPrompt(key)} className="text-destructive hover:opacity-70"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Purpose</label>
                          <textarea value={gp.purpose || ""} onChange={e => updateGroupPromptField(key, "purpose", e.target.value)} rows={2}
                            className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary resize-y" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Culture / Tone</label>
                            <input className="w-full rounded-lg border border-border bg-secondary/40 px-2 py-1.5 text-sm outline-none" value={gp.culture_tone || ""} onChange={e => updateGroupPromptField(key, "culture_tone", e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Active Hours</label>
                            <input className="w-full rounded-lg border border-border bg-secondary/40 px-2 py-1.5 text-sm outline-none" value={gp.active_hours || ""} onChange={e => updateGroupPromptField(key, "active_hours", e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Topics (comma separated)</label>
                          <input className="w-full rounded-lg border border-border bg-secondary/40 px-2 py-1.5 text-sm outline-none" value={(gp.topics || []).join(", ")}
                            onChange={e => updateGroupPromptField(key, "topics", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="soul">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle>Soul Prompt Generator</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Fill in identity details, then generate the soul prompt from structured data.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Age</label>
                    <Input type="number" value={soulForm.age} onChange={e => setSoulForm({ ...soulForm, age: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Gender</label>
                    <Input value={soulForm.gender} onChange={e => setSoulForm({ ...soulForm, gender: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nationality</label>
                    <Input value={soulForm.nationality} onChange={e => setSoulForm({ ...soulForm, nationality: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Occupation</label>
                    <Input value={soulForm.occupation} onChange={e => setSoulForm({ ...soulForm, occupation: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Bio</label>
                  <textarea value={soulForm.bio} onChange={e => setSoulForm({ ...soulForm, bio: e.target.value })} rows={3}
                    className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary resize-y" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Values (comma separated)</label>
                  <Input value={(soulForm.values || []).join(", ")} onChange={e => setSoulForm({ ...soulForm, values: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Philosophy</label>
                  <textarea value={soulForm.philosophy} onChange={e => setSoulForm({ ...soulForm, philosophy: e.target.value })} rows={2}
                    className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary resize-y" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Humor Style</label>
                    <select value={soulForm.humor_style} onChange={e => setSoulForm({ ...soulForm, humor_style: e.target.value })}
                      className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary">
                      {["dry", "playful", "sarcastic", "none", "subtle"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Emoji Style</label>
                    <select value={soulForm.emoji_style} onChange={e => setSoulForm({ ...soulForm, emoji_style: e.target.value })}
                      className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary">
                      {["occasional", "frequent", "never"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <Button onClick={handleGenerateSoul} disabled={soulGenerating} className="w-full">
                  {soulGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  {soulGenerating ? "Generating..." : "Generate Soul Prompt"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle>Assigned Telegram Groups</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Select which groups this persona participates in.</p>
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No groups yet. Add groups in the Groups module first.</p>
                ) : (
                  <div className="space-y-2">
                    {groups.map(g => (
                      <label key={g.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedGroupIds.includes(g.id) ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/40"}`}>
                        <input type="checkbox" checked={selectedGroupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} className="accent-[hsl(var(--primary))]" />
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium flex-1">{g.title}</span>
                        <Badge variant="outline">{g.group_type}</Badge>
                        {g.member_count > 0 && <span className="text-xs text-muted-foreground">{g.member_count} members</span>}
                      </label>
                    ))}
                  </div>
                )}
                <Button onClick={handleAssignGroups} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  Save Group Assignment
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="image">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle>Persona Image</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-3">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Persona avatar" className="w-32 h-32 rounded-full object-cover border-2 border-border" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center border-2 border-dashed border-border">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors">
                    <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Uploading..." : "Upload Image"}
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle>Telegram Account</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Assign a Telegram account for this persona to send messages from.</p>
                <select value={assignedAccountId ?? ""} onChange={e => setAssignedAccountId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="">-- No account --</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.phone_number} ({a.status})
                    </option>
                  ))}
                </select>
                <Button onClick={handleAssignAccount} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Phone className="h-4 w-4 mr-1" />}
                  Save Assignment
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhook">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle>Webhook</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Generated content will be POSTed to this webhook URL.</p>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Webhook URL</label>
                  <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://example.com/webhook" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Headers (JSON)</label>
                  <textarea value={webhookHeaders} onChange={e => setWebhookHeaders(e.target.value)} rows={4}
                    className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary resize-y font-mono" />
                </div>
                <Button onClick={handleSaveWebhook} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Globe className="h-4 w-4 mr-1" />}
                  Save Webhook
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sheets">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle>Google Sheets</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Sync persona content with a Google Sheet.</p>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Spreadsheet ID</label>
                  <Input value={spreadsheetId} onChange={e => setSpreadsheetId(e.target.value)} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Sheet Name</label>
                  <Input value={sheetName} onChange={e => setSheetName(e.target.value)} placeholder="Sheet1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Import Columns</label>
                  <Input value={importColumns} onChange={e => setImportColumns(e.target.value)} placeholder="A,B,C" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Export Columns</label>
                  <Input value={exportColumns} onChange={e => setExportColumns(e.target.value)} placeholder="D,E,F" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-secondary rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                  </label>
                  <span className="text-sm">Auto-sync</span>
                </div>
                <Button onClick={handleSaveSheets} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Database className="h-4 w-4 mr-1" />}
                  Save Sheets Config
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}