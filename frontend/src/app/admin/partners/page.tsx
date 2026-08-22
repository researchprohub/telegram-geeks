"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, Loader2, CheckCircle2, AlertCircle, Handshake, Trash2,
  Pencil, Link2, RotateCcw, Search, Sparkles, Filter
} from "lucide-react";
import { partnersApi } from "@/lib/api";

const CATEGORIES = ["proxies", "browsers", "sms"] as const;

interface Partner {
  id: number;
  name: string;
  img: string;
  href: string;
  category: string;
  sort_order: number;
}

const emptyForm = { name: "", img: "", href: "", category: "proxies" as string, sort_order: 0 };

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<Partner | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchPartners();
  }, []);

  async function fetchPartners() {
    try {
      const res = await partnersApi.adminList();
      setPartners(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load partners");
    } finally {
      setLoading(false);
    }
  }

  function flash(msg: string) {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(""), 3500);
  }

  const handleSeedDefaults = async () => {
    if (!confirm("This will restore the 124 default verified partners. Are you sure?")) return;
    setSeeding(true);
    setError("");
    try {
      const res = await partnersApi.seed();
      setPartners(res.data || []);
      flash("Successfully seeded / restored 124 verified partners!");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to seed default partners");
    } finally {
      setSeeding(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({ name: p.name, img: p.img, href: p.href, category: p.category, sort_order: p.sort_order });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.img) {
      setError("Name and image URL are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await partnersApi.update(editing.id, form);
        flash("Partner updated successfully!");
      } else {
        await partnersApi.create(form);
        flash("Partner added successfully!");
      }
      setDialogOpen(false);
      await fetchPartners();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save partner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    setError("");
    try {
      await partnersApi.remove(deleting.id);
      flash("Partner removed!");
      setDeleting(null);
      await fetchPartners();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete partner");
    } finally {
      setSaving(false);
    }
  };

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchCat = categoryFilter === "all" || p.category?.toLowerCase() === categoryFilter.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.href?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [partners, categoryFilter, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Handshake className="h-6 w-6 text-primary" />
            Partners Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage partner logos, affiliate links, and categories shown across all marketing pages.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-1.5" />
            )}
            Seed / Restore Defaults (124)
          </Button>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Partner
          </Button>
        </div>
      </div>

      {saveMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2 text-sm text-green-400">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {saveMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-white/50 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["all", "proxies", "browsers", "sms"].map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "ghost"}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
              className="text-xs uppercase tracking-wider h-8"
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter partners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Partner List Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Partner Catalog ({filteredPartners.length} of {partners.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="w-24">Logo</TableHead>
                <TableHead>Partner Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Target URL / Affiliate</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    {partners.length === 0 ? (
                      <div className="space-y-3">
                        <p>No partners found in the database.</p>
                        <Button size="sm" variant="outline" onClick={handleSeedDefaults}>
                          <RotateCcw className="h-4 w-4 mr-1.5" />
                          Click here to seed 124 verified partners
                        </Button>
                      </div>
                    ) : (
                      "No partners matching current filters."
                    )}
                  </TableCell>
                </TableRow>
              )}
              {filteredPartners.map((p, idx) => (
                <TableRow key={p.id || idx}>
                  <TableCell className="text-xs text-center font-mono text-muted-foreground">
                    {p.sort_order ?? idx}
                  </TableCell>
                  <TableCell>
                    <div className="w-16 h-8 rounded bg-black/40 border border-border flex items-center justify-center p-1">
                      <img
                        src={p.img}
                        alt={p.name}
                        className="max-w-full max-h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {p.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    {p.href ? (
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
                      >
                        <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{p.href}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">/contacts</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting(p)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Partner" : "Add Partner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. AstroProxy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Image Path / URL *</label>
              <Input
                value={form.img}
                onChange={(e) => setForm({ ...form, img: e.target.value })}
                placeholder="e.g. /assets/img/partners/15/15_astro_060226023838_en.png"
              />
              {form.img && (
                <div className="mt-2 p-2 bg-muted rounded border border-border flex items-center gap-3">
                  <div className="w-16 h-8 bg-black/40 rounded flex items-center justify-center p-1">
                    <img src={form.img} alt="Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <span className="text-xs text-muted-foreground">Logo preview</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Target / Affiliate Link</label>
              <Input
                value={form.href}
                onChange={(e) => setForm({ ...form, href: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Sort Order</label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save Changes" : "Create Partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Partner</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <strong className="text-foreground">{deleting?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
