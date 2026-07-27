# Proxy Hub — Design Spec

## Overview

Replace the current 5 fragmented in-memory proxy pools with a persisted, layered proxy system: **ProxyProviderHub** (provider registry + API integration + free aggregator) → **ProxyPool** (DB-backed pool + health checking) → **ProxyAssignmentEngine** (geo-aware assignment + rotation).

Follows the existing SMS Provider Hub pattern for provider integration.

---

## Data Model

New `Proxy` SQLAlchemy table (persistent):

| Field | Type | Notes |
|-------|------|-------|
| id | int PK | auto-increment |
| provider | str | `"manual"`, `"proxyscrape"`, `"proxy6"`, `"brightdata"`, etc. |
| proxy_type | str | `"socks5"`, `"http"`, `"https"` |
| host | str | |
| port | int | |
| username | str? | |
| password | str? | |
| country | str? | ISO code, populated via geo-ip |
| status | str | `"untested"`, `"healthy"`, `"slow"`, `"dead"` |
| last_checked | datetime? | |
| response_time_ms | float? | |
| success_count | int | lifetime successful uses |
| fail_count | int | lifetime failed uses |
| allocated_to_account_id | int? | FK → accounts.id |
| allocated_at | datetime? | |
| source | str | `"free_aggregator"`, `"user_added"`, `"provider_purchased"` |
| expires_at | datetime? | rental proxies |
| cost | float? | per-unit cost |
| notes | str? | |

The existing `account.proxy_config` JSON field is deprecated. One-time migration on first deploy inserts existing proxy_config values into the Proxy table and links them.

---

## Service Layer

### 1. ProxyProviderHub (`telegram_layer/src/proxy/provider_hub.py`)

Provider registry with metadata for each integrated provider:

```python
PROVIDER_REGISTRY = {
    "proxyscrape":  {"type": "free_api", "base_url": "...", "countries": 180, "update_minutes": 1},
    "proxifly":     {"type": "free_github", "cdn_url": "...", "countries": 109, "update_minutes": 5},
    "iplocate":     {"type": "free_github", "github_repo": "...", "update_minutes": 30},
    "sockslist":    {"type": "free_raw", "raw_url": "...", "update_minutes": 1},
    "webshare":     {"type": "freemium", "free_count": 10, "needs_api_key": True},
    "proxy6":       {"type": "paid", "crypto": True, "affiliate_commission": 0.50},
    "brightdata":   {"type": "paid", "crypto": True, "countries": 195, "enterprise": True},
    "oxylabs":      {"type": "paid", "crypto": True, "countries": 195, "enterprise": True},
    "iproyal":      {"type": "paid", "crypto": True, "no_expiry_credits": True},
    "proxy_cheap":  {"type": "paid", "crypto": True, "best_mobile": True},
    "hydraproxy":   {"type": "paid", "crypto": True, "us_mobile_4g_5g": True},
    "nodemaven":    {"type": "paid", "crypto": True, "clean_ip_95pct": True},
    "decodo":       {"type": "paid", "crypto": True, "affiliate_30pct": True},
    "proxy_seller": {"type": "paid", "crypto": True, "affiliate_50pct": True},
    "evomi":        {"type": "paid", "crypto": True, "from_049_per_gb": True},
    "anyip":        {"type": "paid", "crypto": True, "monero_support": True},
    "dataimpulse":  {"type": "paid", "crypto": True, "cheapest_1_per_gb": True},
    "soax":         {"type": "paid", "crypto": True},
    "airproxy":     {"type": "paid", "crypto": True},
    "gproxy":       {"type": "paid", "crypto": True, "mobile_40_countries": True},
    "thunderproxies": {"type": "paid", "crypto": True},
    "proxysocks5":  {"type": "paid", "crypto": True, "xmr_support": True},
    "floppydata":   {"type": "paid", "from_1_per_gb": True},
    "onlinesim":    {"type": "paid", "region": "russia", "crypto": True},
    "marsproxies":  {"type": "paid", "affiliate_40pct": True},
    "rayobyte":     {"type": "paid", "affiliate_40pct": True},
    "instantproxies": {"type": "paid", "affiliate_20pct": True},
    # + more paid providers added on demand
}
```

Methods:
- `fetch_from_provider(provider_id, api_key, params)` — calls provider API, returns proxy list
- `fetch_free_pool()` — aggregates all free sources → dedup by IP:port → validate → score
- `list_available(api_keys)` — returns registry filtered by which keys the user configured
- `get_provider_status(provider_id)` — health, last sync, error rate, latency

### 2. ProxyPool (`telegram_layer/src/proxy/pool.py`)

DB-backed pool manager:

Methods:
- `add(proxy_data)` → inserts single proxy row
- `add_batch(proxies)` → bulk insert
- `get_healthy(country=None, proxy_type=None, limit=10)` → best proxies by status + response_time
- `get_by_id(proxy_id)` → single proxy
- `report_success(proxy_id)` → increment success_count
- `report_failure(proxy_id)` → increment fail_count, mark dead after threshold
- `run_health_check(max_workers=10)` → async batch via aiohttp ipify check
- `expire_stale(max_age_hours=24)` → mark free proxies dead
- `get_pool_stats()` → counts by status, country, provider, source
- `search(filters)` → search with status/country/type/provider/source filters

### 3. ProxyAssignmentEngine (`telegram_layer/src/proxy/assignment.py`)

Bridges pool → account connection:

Methods:
- `assign_for_account(account_id, country=None, preferred_provider=None)` — picks best healthy proxy, sets allocated_to_account_id + allocated_at
- `release(proxy_id)` — clears allocated_to_account_id
- `rotate(account_id)` — releases current, assigns new
- `get_account_proxy(account_id)` — returns currently allocated proxy dict usable by Telethon
- `auto_assign_pending()` — batch-assigns proxies to unassigned accounts

---

## Architecture Flow

```
User adds API key → ProxyProviderHub validates → can fetch proxies on demand
                         ↓
              Free Aggregator (bg task, 10min)
                         ↓
  ProxyPool.add_batch() → DB → run_health_check() → marked healthy/dead
                         ↓
  ProxyAssignmentEngine.get_account_proxy(account_id)
                         ↓
              TelegramClientManager.connect_account()
              reads proxy dict from assignment → configures SOCKS5
```

---

## API Endpoints

### `/api/v1/proxy-providers`
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | List all providers with status |
| GET | `/{id}` | Provider details |
| POST | `/{id}/fetch` | Fetch proxies from provider |
| POST | `/free-pool/refresh` | Trigger free pool refresh |

### `/api/v1/proxy-pool`
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | List proxies (filtered) |
| GET | `/healthy` | Query healthy proxies |
| POST | `/add` | Add single proxy |
| POST | `/add-batch` | Bulk add proxies |
| POST | `/check` | Run health check |
| DELETE | `/{id}` | Remove proxy |
| GET | `/stats` | Pool statistics |

### `/api/v1/proxy-assignment`
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/assign` | Assign proxy to account |
| POST | `/release` | Release proxy |
| POST | `/rotate` | Rotate account's proxy |
| GET | `/account/{account_id}` | Get account's proxy |

---

## Background Tasks

- **Free proxy aggregator**: every 10 min, fetch from free sources → dedup → validate → store → expire stale
- **Health checker**: every 30 min, batch-test all healthy proxies, mark slow/dead ones
- **Expiration sweeper**: every 60 min, expire rentals, unlink dead proxies from accounts

---

## Backend Wiring

In `Infrastructure.__init__()`:
```python
self.proxy_api_keys: dict[str, str] = {}  # populated via settings or admin config
self.proxy_provider_hub = ProxyProviderHub(api_keys=self.proxy_api_keys)
self.proxy_pool = ProxyPool(async_session_factory)
self.proxy_assignment = ProxyAssignmentEngine(self.proxy_pool, async_session_factory)
```

Registered in `module_dispatcher.py` MODULE_SERVICES as `proxy_provider_hub`, `proxy_pool`, `proxy_assignment`.

In `TelegramClientManager.connect_account()`:
- Replace raw `proxy: dict | None` parameter with internal proxy_assignment lookup
- Fall back to existing account.proxy_config if no Proxy row exists (migration compat)

---

## Migration

One-time script in `/backend/app/services/proxy_migration.py`:
- Iterate all accounts with non-null `proxy_config`
- For each, try to parse and insert into Proxy table
- Set `allocated_to_account_id`
- Log migration results

---

## Non-Goals (Phase 1)

- HTTP/HTTPS proxy support in Telethon client (SOCKS5 only, same as today)
- Proxy provider billing/payment integration (manual API key entry only)
- Auto-scaling proxy pools by demand (manual fetch + health check)
- Affiliate link generation (tracking codes added later to provider URLs)
