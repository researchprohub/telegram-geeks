# Backend Codebase Inventory — Telegram Geeks Platform

> Generated: 2026-07-17  
> Scope: `backend/app/` directory  
> Framework: FastAPI + SQLAlchemy (async) + PostgreSQL  

---

## Summary

This report provides a complete structural inventory of the Telegram Geeks backend application. The codebase is a multi-tenant engagement platform managing Telegram accounts, campaigns, personas, and group/channel targets. It includes JWT authentication, crypto payments (NowPayments + Oxapay + manual deposits), a modular Telegram Expert system with 27 operations, and an admin dashboard. Most endpoint handlers are currently stubbed with placeholder responses — real database integration is partially implemented in the admin module but not yet wired to all resources.

---

## 1. API Endpoint Files

### 1.1 `accounts.py` — Account Management
| Route | Method | Path | Response Model |
|-------|--------|------|----------------|
| `list_accounts` | GET | `/accounts/` | `PaginatedResponse` |
| `create_account` | POST | `/accounts/` | `AccountOut` |
| `get_account` | GET | `/accounts/{account_id}` | `AccountOut` |
| `update_account` | PUT | `/accounts/{account_id}` | `AccountOut` |
| `delete_account` | DELETE | `/accounts/{account_id}` | — |
| `check_account_health` | POST | `/accounts/{account_id}/health` | `AccountHealth` |
| `start_warmup` | POST | `/accounts/{account_id}/warmup` | — |
| `suspend_account` | POST | `/accounts/{account_id}/suspend` | — |
| `unsuspend_account` | POST | `/accounts/{account_id}/unsuspend` | — |

### 1.2 `admin.py` — Admin Dashboard
| Route | Method | Path | Response Model |
|-------|--------|------|----------------|
| `list_users` | GET | `/admin/users` | `list[UserListResponse]` |
| `get_user` | GET | `/admin/users/{user_id}` | `UserListResponse` |
| `update_user` | PUT | `/admin/users/{user_id}` | — |
| `ban_user` | POST | `/admin/users/{user_id}/ban` | — |
| `credit_user` | POST | `/admin/users/{user_id}/credit` | — |
| `delete_user` | DELETE | `/admin/users/{user_id}` | — |
| `list_orders` | GET | `/admin/orders` | — |
| `list_pending_orders` | GET | `/admin/orders/pending` | — |
| `update_order_status` | PUT | `/admin/orders/{order_id}/status` | — |
| `get_analytics_overview` | GET | `/admin/analytics/overview` | `AnalyticsOverview` |
| `list_pending_deposits` | GET | `/admin/deposits/pending` | — |
| `confirm_deposit` | POST | `/admin/deposits/{deposit_id}/confirm` | — |
| `reject_deposit` | POST | `/admin/deposits/{deposit_id}/reject` | — |
| `get_settings` | GET | `/admin/settings` | `SystemSettings` |
| `update_settings` | PUT | `/admin/settings` | `SystemSettings` |

### 1.3 `analytics.py` — Analytics
| Route | Method | Path | Response Model |
|-------|--------|------|----------------|
| `get_campaign_summary` | GET | `/analytics/summary/{campaign_id}` | — |
| `get_engagement_score` | GET | `/analytics/engagement/{group_id}` | `EngagementScore` |
| `get_conversion_funnel` | GET | `/analytics/funnel/{campaign_id}` | `ConversionFunnel` |
| `get_account_health` | GET | `/analytics/account-health/{account_id}` | — |
| `export_analytics` | GET | `/analytics/export/{campaign_id}` | — |

### 1.4 `auth.py` — Authentication
| Route | Method | Path | Response Model |
|-------|--------|------|----------------|
| `login` | POST | `/auth/login` | `TokenResponse` |
| `register` | POST | `/auth/register` | `UserOut` |
| `refresh_token` | POST | `/auth/refresh` | `TokenResponse` |
| `get_current_user` | GET | `/auth/me` | `UserOut` |

### 1.5 `campaigns.py` — Campaign Management
| Route | Method | Path | Response Model |
|-------|--------|------|----------------|
| `list_campaigns` | GET | `/campaigns/` | `PaginatedResponse` |
| `create_campaign` | POST | `/campaigns/` | `CampaignOut` |
| `get_campaign` | GET | `/campaigns/{campaign_id}` | `CampaignOut` |
| `update_campaign` | PUT | `/campaigns/{campaign_id}` | `CampaignOut` |
| `delete_campaign` | DELETE | `/campaigns/{campaign_id}` | — |
| `start_campaign` | POST | `/campaigns/{campaign_id}/start` | — |
| `pause_campaign` | POST | `/campaigns/{campaign_id}/pause` | — |
| `stop_campaign` | POST | `/campaigns/{campaign_id}/stop` | — |
| `list_campaign_conversations` | GET | `/campaigns/{campaign_id}/conversations` | — |
| `list_campaign_threads` | GET | `/campaigns/{campaign_id}/threads` | — |

### 1.6 `groups.py` — Group/Channel Management
| Route | Method | Path | Response Model |
|-------|--------|------|----------------|
| `list_groups` | GET | `/groups/` | `PaginatedResponse` |
| `create_group` | POST | `/groups/` | `GroupOut` |
| `get_group` | GET | `/groups/{group_id}` | `GroupOut` |
| `remove_group` | DELETE | `/groups/{group_id}` | — |
| `scrape_group_members` | POST | `/groups/{group_id}/scrape-members` | — |
| `analyze_group` | POST | `/groups/{group_id}/analyze` | — |

### 1.7 `modules.py` — Telegram Expert Modules (27 modules)
| Route | Method | Path | Notes |
|-------|--------|------|-------|
| `list_modules` | GET | `/modules` | Lists all 27 modules, optional `?category=` filter |
| `get_module` | GET | `/modules/{module_id}` | Detail view for a single module |
| `execute_module` | POST | `/modules/{module_id}/execute` | Dispatches operations; returns queued task |

**Module registry** contains 27 modules organized into 6 categories:

| Category | Count | Module IDs |
|----------|-------|------------|
| `account` | 8 | converter, booster, registrar, duplicator, json_generator, spambot_remover, account_management, number_checker |
| `messaging` | 6 | mass_messaging, autoreponder, autoposting, stories, reactions, message_editor |
| `audience` | 5 | invite_modules, audience_collector, contact_book, mass_unsubscriber, gender_detector |
| `content` | 3 | cloner, interceptor, forwarder |
| `growth` | 3 | bot_creator, referrals, reporter |
| `admin` | 3 | admin, link_checker, database_tools, calculator_reports |

### 1.8 `payments.py` — Unified Payment API
| Route | Method | Path | Response Model |
|-------|--------|------|----------------|
| `create_payment` | POST | `/payments/create` | `PaymentResponse` |
| `get_payment_status` | GET | `/payments/status/{order_id}` | `PaymentStatusResponse` |
| `nowpayments_callback` | POST | `/payments/callback/nowpayments` | — |
| `oxapay_callback` | POST | `/payments/callback/oxapay` | — |
| `create_manual_deposit` | POST | `/payments/manual-deposit` | `ManualDepositResponse` |
| `check_manual_deposit` | GET | `/payments/manual-deposit/{address}` | — |
| `confirm_manual_deposit` | POST | `/payments/manual-deposit/confirm` | — |

### 1.9 `tdata_upload.py` — TData Account Upload
| Route | Method | Path | Response Model |
|-------|--------|------|----------------|
| `upload_single_tdata` | POST | `/accounts/upload/single` | `UploadResult` |
| `bulk_upload_tdata` | POST | `/accounts/upload/bulk` | `BulkUploadResult` |
| `validate_tdata_structure` | POST | `/accounts/upload/validate` | — |
| `get_upload_history` | GET | `/accounts/upload/upload-history` | — |

---

## 2. Schema Files (Pydantic Models)

**File:** `schemas/__init__.py`

### Auth Schemas
| Model | Fields |
|-------|--------|
| `UserLogin` | `email: EmailStr`, `password: str` |
| `UserRegister` | `email: EmailStr`, `password: str (min_length=8)`, `full_name: Optional[str]` |
| `TokenResponse` | `access_token: str`, `refresh_token: str`, `token_type: str = "bearer"`, `expires_in: int` |
| `UserOut` | `id: int`, `email: str`, `full_name: Optional[str]`, `role: str`, `is_active: bool`, `created_at: datetime` |

### Account Schemas
| Model | Fields |
|-------|--------|
| `AccountCreate` | `phone_number: str (5-20)`, `session_string: Optional[str]`, `proxy_config: Optional[dict]` |
| `AccountUpdate` | `session_string: Optional[str]`, `proxy_config: Optional[dict]`, `status: Optional[str]` |
| `AccountOut` | `id, phone_number, status, proxy_config, last_activity, flood_wait_until, ban_reason, trust_score, daily_message_count, created_at` |
| `AccountHealth` | `account_id, is_connected, is_banned, is_spamblocked, flood_wait_remaining, last_error, trust_score, daily_messages_sent` |

### Persona Schemas
| Model | Fields |
|-------|--------|
| `PersonaCreate` | `name (1-100)`, `personality_traits`, `writing_style`, `response_time_min (≥5)`, `response_time_max (≥10)`, `avatar_url`, `niche_tags`, `tone`, `energy_level (0-1)`, `humor_level (0-1)`, `formality_level (0-1)` |
| `PersonaUpdate` | Same fields as create, all Optional |
| `PersonaOut` | All fields + `id`, `created_at` |

### Campaign Schemas
| Model | Fields |
|-------|--------|
| `CampaignCreate` | `name (1-200)`, `description`, `campaign_type`, `config`, `target_groups`, `allowed_hours`, `timezone`, `persona_ids` |
| `CampaignUpdate` | Same fields, all Optional |
| `CampaignOut` | All fields + `id`, `created_by`, `started_at`, `created_at` |

### Group Schemas
| Model | Fields |
|-------|--------|
| `GroupCreate` | `chat_id`, `title`, `group_type`, `member_count`, `niche_tags`, `language` |
| `GroupOut` | `id, chat_id, title, group_type, member_count, niche_tags, language, safety_score, created_at` |

### Analytics Schemas
| Model | Fields |
|-------|--------|
| `MetricPoint` | `timestamp: datetime`, `value: float` |
| `EngagementScore` | `group_id, score, total_messages, total_reactions, total_views, unique_participants` |
| `ConversionFunnel` | `impressions, engagements, clicks, joins, active_members` |
| `AnalyticsSummary` | `campaign_id, engagement_score, conversion_rate, roi, account_health_index, metrics_history, funnel` |

### Pagination
| Model | Fields |
|-------|--------|
| `PaginatedResponse` | `items: list`, `total: int`, `page: int`, `page_size: int`, `total_pages: int` |

---

## 3. Model Files (SQLAlchemy ORM)

**Base:** `models/base.py` — `Base(DeclarativeBase)`, `TimestampMixin` (adds `created_at`, `updated_at`)

### Enums
| Enum | Values |
|------|--------|
| `AccountStatus` | `ACTIVE, SUSPENDED, BANNED, DELETED, WARMING` |
| `CampaignStatus` | `DRAFT, RUNNING, PAUSED, STOPPED` |
| `UserRole` | `ADMIN, OPERATOR, VIEWER` |
| `CampaignType` | `ENGAGEMENT, INVITE, MESSAGING, SOCIAL_PROOF` |

### ORM Models

#### `User` (table: `users`)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | PK |
| `email` | String(255) | UNIQUE, NOT NULL |
| `hashed_password` | String(255) | NOT NULL |
| `full_name` | String(200) | nullable |
| `role` | Enum(UserRole) | default=OPERATOR |
| `is_active` | Boolean | default=True |
| `last_login` | DateTime | nullable |
| `created_at` | DateTime | server_default=now() |
| `updated_at` | DateTime | server_default=now(), onupdate=now() |

**Relationships:** `campaigns` → list of Campaign

#### `Account` (table: `accounts`)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | PK |
| `phone_number` | String(20) | UNIQUE, NOT NULL |
| `session_string` | Text | nullable |
| `status` | Enum(AccountStatus) | default=WARMING |
| `proxy_config` | JSON | default=dict |
| `api_id` | Integer | nullable |
| `api_hash` | String(64) | nullable |
| `last_activity` | DateTime | nullable |
| `flood_wait_until` | DateTime | nullable |
| `ban_reason` | Text | nullable |
| `trust_score` | Float | default=0.0 |
| `daily_message_count` | Integer | default=0 |
| `deleted_at` | DateTime | nullable |
| `created_at` | DateTime | server_default=now() |
| `updated_at` | DateTime | server_default=now(), onupdate=now() |

**Relationships:** `conversations`, `campaign_accounts`

#### `Persona` (table: `personas`)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | PK |
| `name` | String(100) | NOT NULL |
| `personality_traits` | JSON | default=dict |
| `writing_style` | JSON | default=dict |
| `response_time_min` | Integer | default=30 |
| `response_time_max` | Integer | default=300 |
| `avatar_url` | String(500) | nullable |
| `niche_tags` | JSON (list[str]) | default=list |
| `tone` | String(50) | default="casual" |
| `energy_level` | Float | default=0.5 |
| `humor_level` | Float | default=0.3 |
| `formality_level` | Float | default=0.4 |
| `created_at` | DateTime | server_default=now() |
| `updated_at` | DateTime | server_default=now(), onupdate=now() |

**Relationships:** `conversations`

#### `TelegramGroup` (table: `groups`)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | PK |
| `chat_id` | Integer | UNIQUE, NOT NULL |
| `title` | String(255) | NOT NULL |
| `group_type` | String(20) | default="group" |
| `member_count` | Integer | default=0 |
| `niche_tags` | JSON (list[str]) | default=list |
| `language` | String(10) | nullable |
| `last_activity` | DateTime | nullable |
| `safety_score` | Float | default=100.0 |
| `deleted_at` | DateTime | nullable |
| `created_at` | DateTime | server_default=now() |
| `updated_at` | DateTime | server_default=now(), onupdate=now() |

**Relationships:** `campaign_targets`

#### `Campaign` (table: `campaigns`)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | PK |
| `name` | String(200) | NOT NULL |
| `description` | Text | nullable |
| `campaign_type` | Enum(CampaignType) | default=ENGAGEMENT |
| `status` | Enum(CampaignStatus) | default=DRAFT |
| `config` | JSON | default=dict |
| `target_groups` | JSON (list[int]) | default=list |
| `allowed_hours` | JSON (list[int]) | default=list |
| `timezone` | String(50) | default="UTC" |
| `persona_ids` | JSON (list[int]) | default=list |
| `created_by` | Integer | nullable |
| `created_at` | DateTime | server_default=now() |
| `updated_at` | DateTime | server_default=now(), onupdate=now() |

**Relationships:** `created_by_user`, `conversations`, `targets`, `analytics_records`, `campaign_accounts`

#### `CampaignAccount` (association table)
| Column | Type | Constraints |
|--------|------|-------------|
| `campaign_id` | Integer | PK, FK → campaigns |
| `account_id` | Integer | PK, FK → accounts |
| `assigned_at` | DateTime | server_default=now() |

#### `CampaignTarget` (association table)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | PK |
| `campaign_id` | Integer | NOT NULL |
| `group_id` | Integer | NOT NULL |
| `added_at` | DateTime | server_default=now() |

#### `Conversation` (table: `conversations`)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | PK |
| `campaign_id` | Integer | NOT NULL |
| `group_id` | Integer | nullable |
| `message_id` | Integer | nullable |
| `status` | String(20) | default="pending" |
| `thread_parent_id` | Integer | nullable |
| `persona_id` | Integer | nullable |
| `account_id` | Integer | nullable |
| `response_text` | Text | nullable |
| `ai_model_used` | String(50) | nullable |
| `quality_score` | Float | nullable |
| `meta` | JSON | nullable |
| `created_at` | DateTime | server_default=now() |
| `updated_at` | DateTime | server_default=now(), onupdate=now() |

**Relationships:** `campaign`, `persona`, `account`

#### `AnalyticsRecord` (table: `analytics`)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | PK |
| `campaign_id` | Integer | nullable |
| `metric_name` | String(100) | NOT NULL |
| `metric_value` | Float | NOT NULL |
| `timestamp` | DateTime | server_default=now() |
| `meta` | JSON | nullable |
| `period` | String(20) | default="hourly" |

#### `EventLog` (table: `events`)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | PK |
| `campaign_id` | Integer | nullable |
| `event_type` | String(50) | NOT NULL |
| `event_data` | JSON | default=dict |
| `account_id` | Integer | nullable |
| `group_id` | Integer | nullable |
| `processed` | Boolean | default=False |
| `created_at` | DateTime | server_default=now() |
| `updated_at` | DateTime | server_default=now(), onupdate=now() |

---

## 4. Core Configuration (`core/config.py`)

All fields with defaults:

| Setting | Default | Description |
|---------|---------|-------------|
| `database_url` | `"postgresql+asyncpg://postgres:postgres@localhost:5432/tep"` | Async PostgreSQL connection |
| `sql_alchemy_echo` | `False` | SQL query logging |
| `redis_url` | `"redis://localhost:6379/0"` | Redis cache/session URL |
| `telegram_api_id` | `12345678` | Telegram API ID |
| `telegram_api_hash` | `"your_api_hash"` | Telegram API Hash |
| `session_storage_path` | `"./sessions"` | Session file storage |
| `jwt_secret` | `"change-me-in-production"` | ⚠️ Insecure default — must be changed |
| `jwt_algorithm` | `"HS256"` | JWT signing algorithm |
| `jwt_expire_minutes` | `10080` (7 days) | Token expiration |
| `openai_api_key` | `None` | OpenAI API key |
| `anthropic_api_key` | `None` | Anthropic API key |
| `groq_api_key` | `None` | Groq API key |
| `ollama_base_url` | `"http://localhost:11434"` | Ollama local LLM |
| `huggingface_api_key` | `None` | HuggingFace API key |
| `default_ai_provider` | `"openai"` | Primary AI provider |
| `default_ai_model` | `"gpt-4o-mini"` | Default AI model |
| `ai_fallback_chain` | `"openai,anthropic,groq,ollama"` | Provider fallback order |
| `rate_limit_requests_per_minute` | `60` | Per-minute rate limit |
| `rate_limit_burst` | `10` | Burst allowance |
| `default_proxy_pool_size` | `20` | Number of proxies |
| `proxy_rotation_enabled` | `True` | Auto proxy rotation |
| `max_daily_messages_per_account` | `50` | Daily cap per account |
| `flood_wait_auto_resume` | `True` | Auto-resume on flood wait |
| `ban_detection_enabled` | `True` | Ban risk monitoring |
| `frontend_url` | `"http://localhost:3000"` | Frontend origin |
| `log_level` | `"INFO"` | Logging level |
| `log_format` | `"json"` | Log format |
| `metrics_enabled` | `True` | Prometheus metrics |
| `metrics_port` | `9090` | Metrics HTTP port |
| `cors_origins` | `["http://localhost:3000", "http://localhost:8000"]` | Allowed CORS origins |

**Config model:** Uses `pydantic_settings.BaseSettings` with `.env` file support (`env_file=".env"`), extra fields ignored.

---

## 5. Security Utilities (`core/security.py`)

### Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `hash_password` | `(password: str) → str` | Hashes plaintext password using bcrypt |
| `verify_password` | `(plain_password: str, hashed_password: str) → bool` | Verifies password against bcrypt hash |
| `create_access_token` | `(data: dict, expires_delta: Optional[timedelta]) → str` | Creates signed JWT with expiry |
| `decode_access_token` | `(token: str) → Optional[dict]` | Decodes/validates JWT; returns payload or None |

**Dependencies:** `passlib` (CryptContext with bcrypt), `python-jose` (JWT encode/decode), reads `jwt_secret` and `jwt_algorithm` from settings.

---

## 6. Router Mounting (`api/v1/router.py`)

All endpoint groups mounted under the v1 API router:

| Prefix | Endpoint Module | Tags |
|--------|----------------|------|
| `/auth` | `auth` | Authentication |
| `/accounts` | `accounts` | Accounts |
| `/personas` | `personas` | Personas |
| `/campaigns` | `campaigns` | Campaigns |
| `/groups` | `groups` | Groups |
| `/analytics` | `analytics` | Analytics |
| `/modules` | `modules` | Modules |
| `/accounts/upload` | `tdata_upload` | Account Upload |
| `/payments` | `payments` | Payments |
| `/admin` | `admin` | Admin |

Total: **10 endpoint groups**, covering ~60+ individual routes.

---

## 7. Database Migrations (`alembic/versions/`)

### `001_initial_schema.py`
- **Revision:** `001`
- **Down revision:** `None` (first migration)
- **Tables created:** 10

| Table | Columns | Indexes |
|-------|---------|---------|
| `users` | 9 cols (id, email, hashed_password, full_name, role, is_active, last_login, created_at, updated_at) | — |
| `accounts` | 15 cols (id, phone_number, session_string, status, proxy_config, api_id, api_hash, last_activity, flood_wait_until, ban_reason, trust_score, daily_message_count, deleted_at, created_at, updated_at) | `ix_accounts_phone`, `ix_accounts_status` |
| `personas` | 14 cols (id, name, personality_traits, writing_style, response_time_min/max, avatar_url, niche_tags, tone, energy/humor/formality levels, timestamps) | — |
| `groups` | 11 cols (id, chat_id, title, group_type, member_count, niche_tags, language, last_activity, safety_score, deleted_at, timestamps) | `ix_groups_chat_id` |
| `campaigns` | 12 cols (id, name, description, campaign_type, status, config, target/allowed hours/timezone/persona ids, created_by, timestamps) | `ix_campaigns_status`, `ix_campaigns_created_at` |
| `campaign_accounts` | 3 cols (composite PK: campaign_id, account_id; assigned_at) | — |
| `campaign_targets` | 4 cols (id, campaign_id, group_id, added_at) | — |
| `conversations` | 14 cols (id, campaign_id, group_id, message_id, status, thread_parent_id, persona_id, account_id, response_text, ai_model_used, quality_score, metadata, timestamps) | `ix_conversations_campaign` |
| `analytics` | 7 cols (id, campaign_id, metric_name, metric_value, timestamp, metadata, period) | `ix_analytics_campaign`, `ix_analytics_timestamp` |
| `events` | 9 cols (id, campaign_id, event_type, event_data, account_id, group_id, processed, timestamps) | — |

**Total indexes:** 8 (covering phone_number, status, campaign_id, timestamp, chat_id, created_at fields)

---

## Key Observations & Gaps

1. **Stub-heavy endpoints:** Most endpoints in `accounts.py`, `campaigns.py`, `groups.py`, `personas.py`, `analytics.py`, and `tdata_upload.py` return hardcoded placeholder data rather than querying the database. Only `admin.py` has partial real DB integration.

2. **Missing endpoints:** No dedicated endpoint for listing conversations, listing campaigns by user, or retrieving analytics records directly from the database.

3. **Schema-model mismatch:** The migration uses `metadata` column name for `conversations` and `analytics` tables, while the SQLAlchemy model defines it as `meta`. Similarly, `role` in the migration is `String(20)` but the model uses an `Enum(UserRole)`.

4. **JWT secret:** The default `jwt_secret` is `"change-me-in-production"` — a security risk if deployed without override.

5. **No order/payment model:** Despite having a full payments subsystem, there is no `Order` or `Payment` SQLAlchemy model — the `admin.py` orders endpoints return empty stubs.

6. **Single migration:** Only one migration exists (`001`). Any schema drift since initial development has not been captured in Alembic.

7. **Dependencies:** `dependencies.py` and `exceptions.py` exist but were not scoped for this inventory; they likely contain `get_current_user` dependency injection and custom exception handlers respectively.
