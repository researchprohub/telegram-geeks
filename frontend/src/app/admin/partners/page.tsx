"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, CheckCircle2, AlertCircle, Handshake, Trash2, Pencil, Link2 } from "lucide-react";
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
  const [saveMessage, setSaveMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<Partner | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  async function fetchPartners() {
    try {
      const res = await partnersApi.adminList();
      setPartners(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load partners");
    } finally {
      setLoading(false);
    }
  }

  function flash(msg: string) {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(""), 3000);
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Partners</h1>
          <p className="text-sm text-muted-foreground">
            Manage the partner logos shown on the marketing pages (shared across en / ru / cn).
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Partner
        </Button>
      </div>

      {saveMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {saveMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">✕</button>
        </div>
      )}

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Handshake className="h-4 w-4" />
            Partner List ({partners.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Link</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length === 0 && (
                <TableRow>
                  <TableCell className="text-center text-muted-foreground py-8">
                    No partners yet. Click "Add Partner" to create one.
                  </TableCell>
                </TableRow>
              )}
              {partners.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs text-muted-foreground">{p.sort_order}</TableCell>
                  <TableCell>
                    <img src={p.img} alt={p.name} className="h-8 w-auto object-contain max-w-[60px]" loading="lazy" />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                  <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                  <TableCell className="max-w-[220px]">
                    {p.href ? (
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
                      >
                        <Link2 className="h-3 w-3 flex-shrink-0" />
                        {p.href}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">No link</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(p)} className="text-destructive hover:text-destructive">
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
                placeholder="e.g. Proxy Shop"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Logo URL *</label>
              <Input
                value={form.img}
                onChange={(e) => setForm({ ...form, img: e.target.value })}
                placeholder="e.g. /assets/partners/proxy-shop.svg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Link (URL)</label>
              <Input
                value={form.href}
                onChange={(e) => setForm({ ...form, href: e.target.value })}
                placeholder="https://example.com — leave empty to show without a link"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editing ? "Save Changes" : "Add Partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Partner</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove "{deleting?.name}"? This will remove it from all locale pages immediately.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
