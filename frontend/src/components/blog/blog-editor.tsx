"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { blogApi } from "@/lib/api";
import { DEFAULT_TEMPLATE } from "@/components/blog/elementor-builder";
import MdEditor from "@/components/blog/md-editor";
import ElementorBuilder from "@/components/blog/elementor-builder";
import { excerptFrom } from "@/lib/md-toolbar";
import {
  Loader2, ArrowLeft, Save, Globe, Sparkles, Wand2, RefreshCw,
  FileText, LayoutTemplate, Search, FolderOpen, Upload, Image as ImageIcon, Trash2,
} from "lucide-react";

const STATUS_LABELS = { draft: "Draft", publish: "Publish" };

export default function BlogEditor({ postId }: { postId?: number }) {
  const router = useRouter();
  const isEdit = !!postId;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState<"draft" | "publish">("draft");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [template, setTemplate] = useState<string[]>(DEFAULT_TEMPLATE);
  const [categories, setCategories] = useState<any[]>([]);

  const [activePanel, setActivePanel] = useState<"publish" | "settings" | "layout" | "seo">("publish");

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<null | "draft" | "seo" | "improve">(null);
  const [draftTopic, setDraftTopic] = useState("");
  const [draftTone, setDraftTone] = useState("professional");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const coverFileRef = useRef<HTMLInputElement | null>(null);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCoverUploading(true);
    setError("");
    try {
      const r = await blogApi.uploadImage(file);
      setCoverImage((r as any)?.data?.url || "");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to upload image");
    } finally {
      setCoverUploading(false);
    }
  }

  const loadCategories = useCallback(async () => {
    try {
      const r = await blogApi.listCategories();
      setCategories(r.data || []);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadPost = useCallback(async () => {
    try {
      const r = await blogApi.getMyPost(postId!);
      setTitle(r.data.title);
      setSlug(r.data.slug);
      setContent(r.data.content || "");
      setExcerpt(r.data.excerpt || "");
      setCoverImage(r.data.cover_image || "");
      setStatus(r.data.status || "draft");
      setCategoryId(r.data.category_id ?? undefined);
      setTags((r.data.tags || []).join(", "));
      setSeoTitle(r.data.seo_title || "");
      setSeoDescription(r.data.seo_description || "");
      setSeoKeywords(r.data.seo_keywords || "");
      if (Array.isArray(r.data.template) && r.data.template.length) setTemplate(r.data.template);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadCategories();
    if (isEdit) loadPost();
  }, [loadCategories, loadPost, isEdit]);

  async function handleSave(publish: boolean) {
    setSaving(true);
    setError("");
    setSuccess("");
    const finalStatus = publish ? "publish" : "draft";
    const payload = {
      title,
      slug: slug || undefined,
      content,
      excerpt: excerpt || null,
      cover_image: coverImage || null,
      status: finalStatus,
      category_id: categoryId || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      seo_keywords: seoKeywords || null,
      template,
    };
    try {
      if (isEdit) await blogApi.updatePost(postId!, payload);
      else await blogApi.createPost(payload);
      setSuccess(finalStatus === "publish" ? "Post published successfully." : "Post saved as draft.");
      setTimeout(() => router.push("/dashboard/blog"), 800);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  async function handleDraft() {
    if (!draftTopic.trim()) return;
    setAiLoading("draft");
    setError("");
    try {
      const r = await blogApi.draft({ topic: draftTopic, tone: draftTone, target_words: 800, category: "General" });
      const text = r.data.content || "";
      setContent(text);
      if (!title) {
        setTitle(draftTopic);
        setSeoTitle(draftTopic);
      }
      if (!excerpt) setExcerpt(excerptFrom(text));
    } catch (e: any) {
      setError(e.response?.data?.detail || "AI draft failed");
    } finally {
      setAiLoading(null);
    }
  }

  async function handleSEO() {
    if (!title.trim() && !content.trim()) return;
    setAiLoading("seo");
    setError("");
    try {
      const r = await blogApi.seo({ title, content });
      setExcerpt(r.data.excerpt || excerpt);
      const raw = r.data.response || "";
      try {
        const parsed = JSON.parse(raw.replace(/^```json|```$/g, "").trim());
        if (parsed.seo_title) setSeoTitle(parsed.seo_title);
        if (parsed.seo_description) setSeoDescription(parsed.seo_description);
        if (parsed.seo_keywords) setSeoKeywords(parsed.seo_keywords);
      } catch {
        // non-JSON fallback: leave SEO fields as-is
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || "AI SEO failed");
    } finally {
      setAiLoading(null);
    }
  }

  async function handleImprove() {
    if (!content.trim()) return;
    setAiLoading("improve");
    setError("");
    try {
      const r = await blogApi.improve({ text: content, tone: "professional" });
      setContent(r.data.response || content);
    } catch (e: any) {
      setError(e.response?.data?.detail || "AI improve failed");
    } finally {
      setAiLoading(null);
    }
  }

  if (loading) return <div className="p-8 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const inputCls = "w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition";
  const labelCls = "block text-sm font-medium mb-1.5 text-foreground";

  const panels = [
    { key: "publish" as const, label: "Publish", icon: Globe },
    { key: "settings" as const, label: "Post settings", icon: FolderOpen },
    { key: "layout" as const, label: "Page layout", icon: LayoutTemplate },
    { key: "seo" as const, label: "SEO", icon: Wand2 },
  ];

  return (
    <div className="p-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/dashboard/blog")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to posts
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Status: <span className={status === "publish" ? "text-success" : "text-warning"}>{STATUS_LABELS[status]}</span>
          </span>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-2 text-sm font-medium text-foreground hover:border-primary/50 transition disabled:opacity-50"
          >
            {saving && status === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {saving && status === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />} Publish
          </button>
          {success && <span className="text-xs text-success">{success}</span>}
        </div>
      </div>

      {/* Title (WordPress-style big field) */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add title"
        className="w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/40 outline-none mb-1"
      />
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-5">
        <span>/blog/</span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "url-slug"}
          className="bg-transparent outline-none text-primary underline decoration-dotted underline-offset-2 w-40"
        />
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-[hsl(var(--destructive)_/_0.1)] border border-[hsl(var(--destructive)_/_0.2)] text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main canvas */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI assistant */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">AI Copilot</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Topic</label>
                <input value={draftTopic} onChange={(e) => setDraftTopic(e.target.value)} placeholder="e.g. 10 Telegram growth hacks for 2026" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tone</label>
                <select value={draftTone} onChange={(e) => setDraftTone(e.target.value)} className={inputCls}>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="persuasive">Persuasive</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={handleDraft}
                disabled={aiLoading === "draft" || !draftTopic.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {aiLoading === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Generate draft
              </button>
              <button
                onClick={handleImprove}
                disabled={aiLoading === "improve" || !content.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-medium text-foreground hover:border-primary/50 transition disabled:opacity-50"
              >
                {aiLoading === "improve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Improve writing
              </button>
              <button
                onClick={handleSEO}
                disabled={aiLoading === "seo"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-medium text-foreground hover:border-primary/50 transition disabled:opacity-50"
              >
                {aiLoading === "seo" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} Auto SEO
              </button>
            </div>
          </div>

          {/* Editor */}
          <div>
            <label className={`${labelCls} text-xs uppercase tracking-wide text-muted-foreground`}>Content</label>
            <MdEditor value={content} onChange={setContent} />
          </div>
        </div>

        {/* Right sidebar: WP-style collapsible panels */}
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-1">
            {panels.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setActivePanel(p.key)}
                  className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium border transition ${
                    activePanel === p.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {p.label === "Post settings" ? "Settings" : p.label === "Page layout" ? "Layout" : p.label}
                </button>
              );
            })}
          </div>

          {activePanel === "publish" && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Publish</h3>
              <div>
                <label className={labelCls}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={inputCls}>
                  <option value="draft">Draft</option>
                  <option value="publish">Published</option>
                </select>
              </div>
              <button
                onClick={() => handleSave(true)}
                disabled={saving || !title.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />} Publish
              </button>
            </div>
          )}

          {activePanel === "settings" && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Post settings</h3>
              <div>
                <label className={labelCls}>Featured image</label>
                <div className="flex gap-2">
                  <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://... or upload below" className={inputCls} />
                  <button
                    type="button"
                    onClick={() => coverFileRef.current?.click()}
                    disabled={coverUploading}
                    className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm font-medium text-foreground hover:border-primary/50 transition disabled:opacity-50"
                  >
                    {coverUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
                  </button>
                  <input ref={coverFileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" className="hidden" onChange={handleCoverUpload} />
                </div>
                {coverImage && (
                  <div className="relative mt-2 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImage} alt="" className="w-full h-32 object-cover rounded-lg border border-border" />
                    <button
                      type="button"
                      onClick={() => setCoverImage("")}
                      title="Remove image"
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border border-border text-muted-foreground hover:text-destructive transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)} className={inputCls}>
                  <option value="">Uncategorized</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Tags (comma separated)</label>
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="telegram, growth, automation" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Excerpt</label>
                <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} placeholder="Short summary shown in listings" className={inputCls} />
                <button type="button" onClick={() => !excerpt && content && setExcerpt(excerptFrom(content))} className="text-xs text-primary mt-1.5 hover:underline inline-flex items-center gap-1">
                  <Wand2 className="h-3 w-3" /> Auto-generate from content
                </button>
              </div>
            </div>
          )}

          {activePanel === "layout" && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-foreground">Single Post layout</h3>
                <LayoutTemplate className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Arrange the widgets that appear on this post&apos;s public page — powered by an Elementor-style template.
              </p>
              <ElementorBuilder sections={template} onChange={setTemplate} />
            </div>
          )}

          {activePanel === "seo" && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="font-semibold text-foreground">SEO</h3>
              <div>
                <label className={labelCls}>Meta title <span className="text-muted-foreground">({seoTitle.length}/60)</span></label>
                <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={60} placeholder="Max 60 characters" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Meta description <span className="text-muted-foreground">({seoDescription.length}/160)</span></label>
                <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} maxLength={160} placeholder="Max 160 characters" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Keywords</label>
                <input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="comma, separated" className={inputCls} />
              </div>
              <button
                onClick={handleSEO}
                disabled={aiLoading === "seo"}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-2 text-sm font-medium text-foreground hover:border-primary/50 transition disabled:opacity-50"
              >
                {aiLoading === "seo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate with AI
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}