"""Blog endpoints — WordPress-style posts/categories with writer portal + AI.

Public routes (`/categories`, `/posts`, `/posts/{slug}`) require no auth and only
return published posts. Writer routes inherit the existing cookie auth; ownership
rules mirror personas (admin sees all, writers their own).
"""

import os
import uuid as _uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import (
    BlogPostCreate, BlogPostUpdate, BlogPostOut, BlogCategoryCreate, BlogCategoryOut, BlogAIDraftRequest,
)
from app.models import BlogPost, BlogCategory, User, slugify
from app.db.session import get_db
from app.dependencies import get_current_user

router = APIRouter(tags=["Blog"])


# ─── AI helper: reuse platform AI engine, degrade to informative stub ───

async def _ai(request: Request, system: str, prompt: str, max_tokens: int = 2000) -> str:
    infra = getattr(request.app.state, "infrastructure", None)
    engine = getattr(infra, "ai_engine", None) if infra else None
    if engine:
        try:
            out = await engine.generate(prompt, system=system, max_tokens=max_tokens)
            return (out or "").strip()
        except Exception as e:
            print(f"[blog] AI error: {e}")
    return ""


# ─── serialization ───

def _post_out(p: BlogPost, author_name: str | None = None, category_name: str | None = None) -> BlogPostOut:
    return BlogPostOut(
        id=p.id, user_id=p.user_id, title=p.title, slug=p.slug, content=p.content,
        excerpt=p.excerpt, cover_image=p.cover_image, status=p.status,
        category_id=p.category_id, tags=p.tags or [],
        seo_title=p.seo_title, seo_description=p.seo_description, seo_keywords=p.seo_keywords,
        published_at=p.published_at, view_count=p.view_count, template=p.template,
        created_at=p.created_at, updated_at=p.updated_at,
        author_name=author_name, category_name=category_name,
    )


async def _attach_meta(db: AsyncSession, posts: list[BlogPost]) -> list[BlogPostOut]:
    if not posts:
        return []
    user_ids = {p.user_id for p in posts if p.user_id}
    cat_ids = {p.category_id for p in posts if p.category_id}
    authors: dict[int, str] = {}
    cats: dict[int, str] = {}
    if user_ids:
        r = await db.execute(select(User.id, User.full_name).where(User.id.in_(user_ids)))
        authors = {uid: (name or "Writer") for uid, name in r.all()}
    if cat_ids:
        r = await db.execute(select(BlogCategory.id, BlogCategory.name).where(BlogCategory.id.in_(cat_ids)))
        cats = dict(r.all())
    return [_post_out(p, authors.get(p.user_id), cats.get(p.category_id)) for p in posts]


def _can_edit(p: BlogPost, user: User) -> bool:
    return user.role == "admin" or p.user_id == user.id


# ─── Categories ───

@router.get("/categories", response_model=list[BlogCategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(BlogCategory).order_by(BlogCategory.name))
    return r.scalars().all()


@router.post("/categories", response_model=BlogCategoryOut, status_code=201)
async def create_category(
    body: BlogCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    slug = slugify(body.name)
    existing = await db.execute(select(BlogCategory).where(BlogCategory.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"
    cat = BlogCategory(name=body.name, slug=slug, description=body.description)
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await db.execute(select(BlogCategory).where(BlogCategory.id == category_id))
    cat = r.scalar_one_or_none()
    if not cat:
        raise HTTPException(404, "Category not found")
    await db.delete(cat)
    await db.commit()
    return {"ok": True}


# ─── Public posts (published only) ───

@router.get("/posts")
async def list_public_posts(
    category: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = 1,
    page_size: int = 12,
    db: AsyncSession = Depends(get_db),
):
    q = select(BlogPost).where(BlogPost.status == "publish")
    if category:
        q = q.join(BlogCategory).where(BlogCategory.slug == category)
    if search:
        q = q.where(or_(BlogPost.title.ilike(f"%{search}%"), BlogPost.content.ilike(f"%{search}%")))
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(BlogPost.published_at.desc().nulls_last()).offset((page - 1) * page_size).limit(page_size)
    posts = (await db.execute(q)).scalars().all()
    items = await _attach_meta(db, posts)
    if tag:
        items = [i for i in items if tag in i.tags]
        total = len(items)
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size)}


# ─── Writer: own posts CRUD (admin sees all) ───

@router.get("/posts/author/all")
async def list_my_posts(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(BlogPost)
    if current_user.role != "admin":
        q = q.where(BlogPost.user_id == current_user.id)
    if status_filter:
        q = q.where(BlogPost.status == status_filter)
    q = q.order_by(BlogPost.updated_at.desc())
    posts = (await db.execute(q)).scalars().all()
    return await _attach_meta(db, posts)


@router.post("/posts", response_model=BlogPostOut, status_code=201)
async def create_post(
    body: BlogPostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    slug = slugify(body.slug or body.title)
    existing = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"
    p = BlogPost(
        user_id=current_user.id, title=body.title, slug=slug,
        content=body.content, excerpt=body.excerpt, cover_image=body.cover_image,
        status=body.status, category_id=body.category_id, tags=body.tags or [],
        seo_title=body.seo_title or body.title, seo_description=body.seo_description,
        seo_keywords=body.seo_keywords, template=body.template,
        published_at=datetime.utcnow() if body.status == "publish" else None,
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return _post_out(p, current_user.full_name or "Writer")


@router.get("/posts/detail/{post_id}", response_model=BlogPostOut)
async def get_my_post(post_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Post not found")
    if not _can_edit(p, current_user):
        raise HTTPException(403, "Access denied")
    return (await _attach_meta(db, [p]))[0]


@router.put("/posts/{post_id}", response_model=BlogPostOut)
async def update_post(
    post_id: int, body: BlogPostUpdate,
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    r = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Post not found")
    if not _can_edit(p, current_user):
        raise HTTPException(403, "Access denied")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    if p.status == "publish" and not p.published_at:
        p.published_at = datetime.utcnow()
    elif p.status == "draft":
        p.published_at = None
    await db.commit()
    await db.refresh(p)
    return (await _attach_meta(db, [p]))[0]


@router.delete("/posts/{post_id}")
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Post not found")
    if not _can_edit(p, current_user):
        raise HTTPException(403, "Access denied")
    await db.delete(p)
    await db.commit()
    return {"ok": True}


# ─── AI assistants (writer, needs auth) ───

@router.post("/ai/draft")
async def ai_generate_draft(body: BlogAIDraftRequest, request: Request, current_user: User = Depends(get_current_user)):
    system = "You are an expert blog writer. Return only the article body in clean markdown paragraphs, split by blank lines, with a # heading. No preamble."
    prompt = f"Write a {body.target_words}-word article titled '{body.topic}' in a {body.tone} tone, category: {body.category}."
    out = await _ai(request, system, prompt, max_tokens=3000)
    if not out:
        out = (f"# {body.topic}\n\n"
               f"*(Draft generated offline — set an AI provider in Settings to enable live AI writing.)*\n\n"
               f"Write a {body.target_words}-word {body.tone} article about {body.topic} in the {body.category} category.")
    return {"content": out}


class _SEORequest(BaseModel):
    title: str
    content: str


@router.post("/ai/seo")
async def generate_seo(body: _SEORequest, request: Request, current_user: User = Depends(get_current_user)):
    system = ("You are an SEO expert. Return strict JSON with exactly three keys: "
              "seo_title (max 60 chars), seo_description (max 160 chars), seo_keywords (comma-separated).")
    prompt = f"Title: {body.title}\n\nContent:\n{body.content[:3000]}"
    out = await _ai(request, system, prompt, max_tokens=400)
    excerpt = (body.content or "")[:160].replace("\n", " ").strip()
    return {"response": out or "", "excerpt": excerpt}


class _ImproveRequest(BaseModel):
    text: str
    tone: str = "professional"


@router.post("/ai/improve")
async def improve_text(body: _ImproveRequest, request: Request, current_user: User = Depends(get_current_user)):
    if not body.text.strip():
        raise HTTPException(400, "text is required")
    system = (f"You are an expert editor. Rewrite the provided text: fix grammar, improve readability and flow, "
              f"keep the meaning, use a {body.tone} tone. Return only the rewritten text.")
    out = await _ai(request, system, body.text, max_tokens=1500)
    return {"response": out or body.text}


# ─── Media upload (images) ───

BLOG_UPLOAD_DIR = Path(os.path.dirname(__file__)) / "../../../.." / "uploads" / "blog"


@router.post("/media/upload")
async def upload_blog_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload an image for use in a blog post / featured image. Returns a /static URL."""
    ext = os.path.splitext(file.filename or "image")[1].lower()
    if ext not in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}:
        raise HTTPException(400, "Unsupported image type")
    filename = f"{_uuid.uuid4().hex}{ext}"
    abs_path = BLOG_UPLOAD_DIR / filename
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    content = await file.read()
    with open(abs_path, "wb") as f:
        f.write(content)
    return {"url": f"/static/blog/{filename}"}


# ─── Public single post (catch-all LAST so it doesn't shadow writer routes) ───

@router.get("/posts/{slug}", response_model=BlogPostOut)
async def get_public_post(slug: str, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(BlogPost).where(BlogPost.slug == slug, BlogPost.status == "publish"))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Post not found")
    p.view_count = (p.view_count or 0) + 1
    await db.commit()
    await db.refresh(p)
    ar = await db.execute(select(User.full_name).where(User.id == p.user_id)) if p.user_id else None
    author = (ar.scalar_one_or_none() if ar else "") or ""
    cr = await db.execute(select(BlogCategory.name).where(BlogCategory.id == p.category_id)) if p.category_id else None
    cat = (cr.scalar_one_or_none() if cr else "") or ""
    return _post_out(p, author, cat)
