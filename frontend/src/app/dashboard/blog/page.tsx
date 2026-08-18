"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { blogApi } from "@/lib/api";
import { Plus, Pencil, Trash2, Globe, FileText, Loader2, Calendar, Eye } from "lucide-react";

export default function BlogDashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "publish" | "draft">("all");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await blogApi.listMyPosts(filter === "all" ? undefined : filter);
      setPosts(r.data || []);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(id);
    setError("");
    try {
      await blogApi.deletePost(id);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  const filters = [
    { key: "all" as const, label: "All" },
    { key: "publish" as const, label: "Published" },
    { key: "draft" as const, label: "Drafts" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-sm text-muted-foreground mt-1">Write, edit, and publish articles with AI support.</p>
        </div>
        <Link
          href="/dashboard/blog/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" /> New Post
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition ${
              filter === f.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => router.push("/blog")}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border border-border bg-secondary/40 text-muted-foreground hover:text-foreground transition"
        >
          <Eye className="h-4 w-4" /> View site
        </button>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-[hsl(var(--destructive)_/_0.1)] border border-[hsl(var(--destructive)_/_0.2)] text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-foreground font-medium">No posts here yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Start writing your first article.</p>
          <Link href="/dashboard/blog/new" className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> Write your first post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary/30 transition">
              {post.cover_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.cover_image} alt="" className="w-16 h-16 rounded-lg object-cover hidden sm:block" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">{post.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    post.status === "publish"
                      ? "bg-[hsl(var(--success)_/_0.15)] text-success"
                      : "bg-warning/15 text-warning"
                  }`}>
                    {post.status === "publish" ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {post.category_name && <span>{post.category_name}</span>}
                  {post.published_at && (
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.published_at).toLocaleDateString()}</span>
                  )}
                  <span>{(post.view_count || 0)} views</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link href={`/blog/${post.slug}`} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition" title="View">
                  <Eye className="h-4 w-4" />
                </Link>
                <Link href={`/dashboard/blog/${post.id}`} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition" title="Edit">
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deleting === post.id}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}