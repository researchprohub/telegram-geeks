# Telegram Geeks Desktop — Fresh Windows App Design

Date: 2026-08-20
Status: Approved

## Goal

Replace the crash-prone PySide6 desktop app (`windows_app/`) with a fresh,
stable Windows desktop app built on Electron + React, reusing the existing
FastAPI backend as an embedded local subprocess, and covering the authenticated
web application surface.

The old `windows_app/` tree is deleted as part of this work; the new app lives
in `desktop/` alongside the existing web `frontend/` and `backend/` trees. The
`windows_app/backend.py` spawn pattern and `windows_app/api.py` client logic
are reused conceptually, not copied verbatim (they are ported, cleaned, and
live in the new `desktop/` layout).

## Decisions (confirmed with owner)

| Decision | Choice |
|----------|--------|
| Framework | Electron + React |
| Scope | Authed app only (no landing/blog/pricing/cart/locale pages) |
| Backend | Embedded local backend (FastAPI subprocess, port 8765, SQLite + seeded creds) |
| Packaging | Portable folder (no installer) |
| UI build | Fresh Vite + React SPA inside the Electron shell |

## Architecture

```
desktop/
  main.js            # Electron main: spawns backend subprocess, window, IPC bridge
  preload.js         # contextBridge: exposes window.api (no nodeIntegration)
  backend/           # sidecar copy of FastAPI backend
  .venv/             # dev venv; production ships a bundled Python runtime
  src/               # Vite + React SPA (authed surface only)
    api/             # axios client — JWT Bearer (desktop pattern, not cookies)
    hooks/           # auth state, backend-health polling
    components/      # layout, sidebar, tables, dialogs, status
    pages/           # login · register · dashboard · accounts · modules/*
                     # campaigns · personas · groups · neuro-text · analytics
                     # converter · booster · billing · settings · admin
  index.html
  vite.config.ts
```

- Pure SPA; routing via `react-router-dom` (no Next.js server components).
- Backend lifecycle owned by the Electron main process, same proven spawn
  pattern as `windows_app/backend.py` (the desktop crashes were pure
  QThread GUI bugs, not backend bugs).
- CSRF already skipped for `Authorization: Bearer` requests
  (`backend/app/middleware/csrf.py`), so the JWT client needs no cookie dance.

## Reuse from existing codebase

- Design tokens: CSS variables + Tailwind config from
  `frontend/src/app/globals.css` (midnight/charcoal + telegram cyan primary).
  Dark-only theme.
- API contract: port the method mapping from `frontend/src/lib/api.ts` to the
  desktop axios client. Backend routers to cover (30+):
  auth, accounts, modules, campaigns, personas, groups, neuro-text, analytics,
  converter, booster, billing, settings, admin, global-config, proxies,
  sms-providers, tdata-upload, postbot, orchestration, ip-analyzer,
  persona-templates, persona-warmup, persona-memory, persona-analytics,
  persona-emotions, persona-knowledge-base, community-roles, group-knowledge,
  registrar, spambot-remover, model-routing, tools.
- Module pages: the 45 module pages under the web `dashboard/modules/*` are
  driven by the `/modules/{id}/params` + `/modules/{id}/execute` contract. The
  desktop SPA gets one generic module runner page consuming that contract
  instead of porting 45 bespoke pages verbatim.

## Data flow

1. Electron main spawns the backend subprocess (SQLite DB, seeded
   admin@test.com/admin123 and demo@test.com/demo123).
2. Main waits for `GET /health` to report `checks.database: true`
   (seed done).
3. Main creates the BrowserWindow and loads the SPA.
4. SPA calls `http://127.0.0.1:8765/api/v1/**` via axios with JWT Bearer.
5. Backend is terminated on app quit; port conflict at start shows an error
   screen with a relaunch hint.

## Auth

JWT kept in memory during the run and persisted encrypted to disk via
Electron `safeStorage` (DPAPI on Windows) so restarts restore the session.

## Error handling & resilience

- No `QThread` anywhere; only daemon threads with event-loop marshaling.
- Backend-down state → visible banner + auto-retry with backoff, never a
  silent hang.
- Every async operation shows busy state; 401 redirects to login; validation
  errors render inline.

## Testing

- `npm run check` (tsc + build) gate on every change.
- Python-side smoke test (port of the proven `smoke_test.py`):
  login → list modules → execute → account CRUD.
- Manual launch checklist: kill stale 8765 → start → login → exercise each
  nav section.

## Packaging

Portable folder via `electron-builder`: `dist/TelegramGeeks/` containing the
exe, the bundled backend, and a bundled Python runtime. No installer.
`run-dev.bat` + `build.bat` mirror the current Windows workflow.

## Out of scope (explicitly skipped)

- Offline mode, custom native features, system tray, auto-updater.
- Marketing website pages inside the app.
- Full auth rewrite; reuses backend JWT.