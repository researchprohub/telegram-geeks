"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, BarChart3, Users, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

interface Group {
  id: number;
  chat_id: number;
  title: string;
  type: string;
  members: number;
  tags: string[];
  safety_score: number;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newChatId, setNewChatId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      const response = await api.get("/groups/");
      setGroups(response.data.items || response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async () => {
    if (!newTitle || !newChatId) return;
    try {
      await api.post("/groups/", {
        title: newTitle,
        chat_id: parseInt(newChatId),
        type: "group",
      });
      await fetchGroups();
      setShowAdd(false);
      setNewTitle("");
      setNewChatId("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add group");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this group?")) return;
    try {
      await api.delete(`/groups/${id}`);
      await fetchGroups();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete group");
    }
  };

  const handleScrape = async (id: number) => {
    try {
      await api.post(`/groups/${id}/scrape-members`, null, { params: { limit: 100 } });
      await fetchGroups();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to scrape members");
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
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Target Groups</h1>
            <p className="text-xs text-muted-foreground">{groups.length} groups</p>
          </div>
          <Button onClick={() => setShowAdd(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Group
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError("")} className="ml-auto">✕</button>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No groups found</p>
            <p className="text-xs text-muted-foreground/60">Add target groups to start campaigns</p>
          </div>
        ) : (
          groups.map(g => (
            <Card key={g.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    g.type === "channel" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" : "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
                  }`}>
                    {g.type === "channel" ? "📢" : "💬"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{g.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline">{g.type}</Badge>
                      <span className="text-xs text-muted-foreground">{g.members?.toLocaleString() || 0} members</span>
                      <Badge variant="secondary" className={
                        (g.safety_score || 0) > 80
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                      }>
                        Safety: {g.safety_score || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => handleScrape(g.id)}>
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(g.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Group Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Target Group</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Group/Channel Title</label>
              <Input
                placeholder="e.g., Tech News"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Chat ID</label>
              <Input
                placeholder="-1001234567890"
                value={newChatId}
                onChange={e => setNewChatId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
