# Partners Page — Admin-Managed Links

**Date:** 2026-08-18
**Status:** Approved (decisions below)
**Scope:** Make the marketing partners page data admin-manageable: edit links, add/remove partners, reorder.

## Decisions (user-confirmed)
1. **Admin scope:** full management — edit hrefs, add new partners, remove partners.
2. **Locales:** one shared partner list serves en/ru/cn sites (all three currently identical anyway).
3. **Storage:** dedicated `partners` DB table + CRUD endpoints, mirroring the blog module.

## Current state (verified)
- Three client components hold identical hardcoded arrays (124 partners): `frontend/src/app/partner/page.tsx`, `ru/partner/page.tsx`, `cn/partner/page.tsx`.
- Partner shape: `{ name, img, href, category: "proxies" | "browsers" | "sms" }`.
- Only divergence: cn sets `href: ""` for **AntiSafety** and **SMS-Active**; en/ru use `/contacts`.
- Blog is the established content-admin pattern: model in `app/models/__init__.py`, schemas in `app/schemas/__init__.py`, endpoints in `app/api/v1/endpoints/blog.py`, public pages fetch via server component using `blogApi` (`frontend/src/lib/api.ts`).
- DB: SQLite (`backend/test.db`), tables created by alembic migrations (`backend/alembic/versions/`). Auto-create only runs on empty DB — a new table **requires** a migration.
- Admin pages: client components under `frontend/src/app/admin/`, guarded by `layout.tsx` (role check). Admin API client uses default `api` axios instance with CSRF token on mutating requests. New admin link added in `frontend/src/components/admin-sidebar.tsx` `navGroups`.

## Design

### Backend
1. **Model** (`backend/app/models/__init__.py`) — add after `BlogPost`:
   ```
   class Partner(Base, TimestampMixin):
       __tablename__ = "partners"
       id, name (String 200, not null), img (String 500, not null),
       href (String 500, not null, default ""), category (String 20, not null),
       sort_order (Integer, default 0)
   ```
2. **Schemas** (`backend/app/schemas/__init__.py`) — mirror blog:
   `PartnerCreate { name, img, href="", category, sort_order=0 }`, `PartnerUpdate { all optional }`, `PartnerOut { id + all fields + created_at/updated_at }` with `model_config = {"from_attributes": True}`.
3. **Endpoints** — new file `backend/app/api/v1/endpoints/partners.py`:
   - `GET /api/v1/partners` — **public** (no auth), returns all partners ordered by `sort_order` (list response). Backed by `list[PartnerOut]`.
   - `GET /api/v1/admin/partners` — admin (require_admin) list (same payload; useful for the admin page).
   - `POST /api/v1/admin/partners` — create (require_admin).
   - `PUT /api/v1/admin/partners/{id}` — update (require_admin).
   - `DELETE /api/v1/admin/partners/{id}` — delete (require_admin).
   - Register router in `app/main.py`: `app.include_router(partners.router, prefix="/api/v1", tags=["Partners"])`.
4. **Migration** `backend/alembic/versions/007_partners_table.py`:
   - `upgrade()`: create `partners` table **and seed it with the current 124 partners** (names/imgs/hrefs from `en` copy; AntiSafety + SMS-Active get `href="/contacts"`; `sort_order` = array index). Data hardcoded in the migration.
   - `downgrade()`: drop table.

### Frontend
1. **API client** (`frontend/src/lib/api.ts`) — add:
   ```
   export const partnersApi = {
     list: () => api.get('/partners'),
     adminList: () => api.get('/admin/partners'),
     create: (data) => api.post('/admin/partners', data),
     update: (id, data) => api.put(`/admin/partners/${id}`, data),
     remove: (id) => api.delete(`/admin/partners/${id}`),
   };
   ```
2. **Public pages** — convert all three partner pages (`partner/page.tsx`, `ru/partner/page.tsx`, `cn/partner/page.tsx`):
   - Remove the hardcoded array.
   - Keep the page shell (header, CTA sections) unchanged.
   - Make page a server component fetching `const partners = await partnersApi.list()` (pattern from `blog/page.tsx`).
   - Pass partners into `PartnerGrid` as a prop.
   - `PartnerGrid` renders same grid; **treat `href === ""` as no link** → render non-clickable tile (no `<a>`, no ExternalLink hover) instead of `href=""`.
   - The `Partner` interface moves to the grid props type (`{ name; img; href; category }`).
3. **Admin page** — new `frontend/src/app/admin/partners/page.tsx` (client component, mirrors `admin/settings/page.tsx` UI conventions):
   - Table: Name | Category | Link | Logo (img thumbnail) | Actions (Edit / Delete).
   - "Add Partner" button → dialog with fields: Name, Link, Logo path (img URL), Category (select proxies/browsers/sms).
   - Edit dialog pre-fills; Delete confirms.
   - Uses `partnersApi`; success/error banners like settings page.
4. **Sidebar** (`frontend/src/components/admin-sidebar.tsx`) — add item `{ href: "/admin/partners", label: "Partners", icon: Handshake }` under **Management** group.

## Verification
- Backend: restart, `GET http://127.0.0.1:8002/api/v1/partners` returns 124 ordered partners.
- Alembic: `alembic upgrade head` applies `007` without error.
- Frontend: `npm run build` passes; `http://localhost:3000/partner`, `/ru/partner`, `/cn/partner` render 124 tiles; AntiSafety/SMS-Active render as non-linked tiles.
- Admin: login as admin → `/admin/partners` shows list; edit a link, add a partner, delete a partner — changes appear on public pages after refresh.

## Out of scope (later if needed)
- Logo image upload (admin pastes a path/URL; uploads exist only for blog media).
- Per-locale partner sets.
- Public-side pagination (124 items, static page).
