# Telegram Geeks Windows Desktop Blueprint

## Target stack
Tauri 2 + React + Tailwind + Vite. Reuses existing FastAPI backend. No Electron bloat.

## Layout
```
desktop/
  src-tauri/          # Rust shell
  src/                # React UI
    api/              # fetch wrappers for backend
    components/
    pages/
  package.json
  tauri.conf.json
```

## API contract
Desktop talks to backend via http://localhost:8000/api/v1
- auth, accounts, personas, campaigns, groups, orchestration, modules, neuro-text, global-config

## Minimal steps
1. `npm create tauri-app` -> React template
2. Configure `tauri.conf.json` window size, single instance
3. Add `api/client.ts` with baseURL from env
4. Map existing backend routers to UI pages:
   - /accounts -> Account manager
   - /campaigns -> Campaign dashboard
   - /personas -> Persona templates / warmup
   - /orchestration -> Multi-account executor
   - /modules -> Telegram actions
5. Use existing CSS variables from AGENTS.md for theming
6. Build installer via `tauri build` for Windows x64

## Skipped
- Offline mode, custom native features. Add when needed.
- Full auth rewrite; re-use backend JWT.

## Why Tauri
- ~5MB bundle vs 100MB+ Electron
- Native Windows menus, updater, system tray via Rust
- Reuses web UI skills already in repo
