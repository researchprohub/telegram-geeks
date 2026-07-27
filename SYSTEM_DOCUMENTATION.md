# TelegramGeeks - Complete System Documentation

## Overview

TelegramGeeks is a full-stack Telegram marketing automation platform, designed as a superior alternative to "Telegram Expert". It provides 29 modules for account management, messaging, audience building, content cloning, growth, and admin operations — all orchestrated with multi-account AI conversation routing.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│                    localhost:3000                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Marketing   │  │ Dashboard   │  │ Module Browser      │  │
│  │ Site        │  │ (KPIs, etc) │  │ (Search, Run)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ Nginx Reverse Proxy
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                       │
│                    localhost:8000                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Auth     │ │ Modules  │ │Orchest.  │ │ Analytics     │  │
│  │ JWT/RBAC │ │ 29 mods  │ │ Engine   │ │ AI Insights   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Infrastructure Layer                     │   │
│  │  TelegramClientManager │ AIEngine (13 providers)     │   │
│  │  ProxyPoolManager      │ SessionManager              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Module Dispatcher                           │   │
│  │  Dynamic service loading │ Parameter remapping       │   │
│  │  Plan-tier gating       │ Graceful degradation       │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────┬───────────────────────┬────────────┬────────────┘
            │                       │            │
            ▼                       ▼            ▼
     ┌─────────────┐        ┌────────────┐  ┌──────────┐
     │ PostgreSQL  │        │   Redis    │  │  Ollama  │
     │  :5432      │        │  :6379     │  │ :11434   │
     │  Users,     │        │  Sessions, │  │ Local AI │
     │  Campaigns  │        │  Cache     │  │ Models   │
     └─────────────┘        └────────────┘  └──────────┘
```

## Services

| Service | Port | Purpose |
|---------|------|---------|
| Frontend (Next.js) | 3000 | Dashboard + Marketing site |
| Backend (FastAPI) | 8000 | REST API + Module execution |
| PostgreSQL | 5432 | Persistent data storage |
| Redis | 6379 | Session management + cache |
| Ollama | 11434 | Local AI inference |
| Nginx | 80 | Reverse proxy (optional) |

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` — Login with email/password
- `POST /api/v1/auth/register` — Register new user
- `GET /api/v1/auth/me` — Get current user info

### Modules (29 total)
- `GET /api/v1/modules` — List all modules (filter by `?category=account`)
- `GET /api/v1/modules/{module_id}` — Get module details
- `POST /api/v1/modules/{module_id}/execute` — Execute a module operation
- `GET /api/v1/modules/plans` — List plan tiers
- `GET /api/v1/modules/status` — Dispatcher + infrastructure status

### Orchestration
- `GET /api/v1/orchestrate/accounts` — List managed accounts
- `GET /api/v1/orchestrate/router/stats` — Conversation router statistics
- `GET /api/v1/orchestrate/router/topics` — Active routing topics

### Advanced Analytics
- `GET /api/v1/advanced-analytics/ai-insights` — AI-generated insights

### Health
- `GET /health` — System health check

## Module Categories & Operations

### Account Management (8 modules)
| Module | Operations |
|--------|-----------|
| converter | convert_to_tdata, convert_from_tdata, mass_convert |
| booster | start_warmup, get_progress, run_warmup_cycle |
| registrar | get_phone_number, register_account, set_profile |
| duplicator | duplicate_session, list_duplicates |
| json_generator | generate_json, validate_json, batch_generate |
| spambot_remover | check_spam_status, submit_appeal, remove_restrictions |
| account_management | mass_inspection, delete_dialogs, read_dialogs, import_accounts, export_account_data |
| number_checker | check_number, check_numbers_batch |

### Messaging & Automation (6 modules)
| Module | Operations |
|--------|-----------|
| mass_messaging | send_to_database, send_by_id, send_by_numbers, send_to_contacts |
| autoreponder | add_template, remove_template, start_monitoring |
| autoposting | post_to_chats_v1, post_to_chats_v2, post_to_channels, cancel_post |
| stories | publish_story, delete_story, export_stories |
| reactions | add_reaction, remove_reaction, get_reactions |
| message_editor | edit_message, pin_message, batch_edit |

### Audience (5 modules)
| Module | Operations |
|--------|-----------|
| invite_modules | invite_by_numbers, invite_by_username, invite_by_id, invite_via_admin_v1, invite_via_admin_v2 |
| audience_collector | collect_from_comments, collect_from_account, collect_from_replies, collect_new_chat_members |
| contact_book | add_contact, get_contacts, export_contacts, search_contacts, delete_contact |
| mass_unsubscriber | unsubscribe_from_channels, unsubscribe_from_chats, leave_all_chats |
| gender_detector | detect_gender, batch_detect |

### Content (3 modules)
| Module | Operations |
|--------|-----------|
| cloner | clone_channel, clone_group, clone_with_progress |
| interceptor | add_keyword, start_monitoring, stop_monitoring |
| forwarder | start_forwarding, route_reply, stop_forwarding |

### Growth (3 modules)
| Module | Operations |
|--------|-----------|
| bot_creator | create_bot, set_bot_commands, set_bot_photo, delete_bot |
| referrals | create_referral_link, create_mini_app_referral, get_referral_stats |
| reporter | report_message, report_user, report_channel, mass_report |

### Admin & Analytics (4 modules)
| Module | Operations |
|--------|-----------|
| admin | create_chat, create_channel, add_admin, remove_admin, set_chat_photo |
| link_checker | check_link, check_channel, check_user, check_group |
| database_tools | union_databases, exclude_database, clean_database, validate_database |
| calculator_reports | calculate_roi, calculate_engagement_score, generate_report |

## Plan Tiers

| Tier | Price/Month | Accounts | Campaigns | Modules | AI/day |
|------|------------|----------|-----------|---------|--------|
| Starter | $29 | 5 | 3 | 13 core | 100 |
| Pro | $79 | 25 | 20 | All 29 | 1,000 |
| Agency | $199 | Unlimited | Unlimited | All 29 + Team | Unlimited |

## AI Engine

13 providers integrated with automatic fallback:

| Provider | Free | Models |
|----------|------|--------|
| Ollama | Yes | llama3, mistral, codellama, phi3, gemma2 |
| Groq | Yes | llama-3.1-8b, mixtral-8x7b |
| NVIDIA NIM | Yes | meta/llama-3.1-8b |
| Cerebras | Yes | llama-3.1-8b, llama-3.1-70b |
| Cloudflare Workers AI | Yes | llama-2-7b |
| SiliconFlow | Yes | Qwen2.5-7B |
| Google Gemini | Yes | gemini-pro, gemini-1.5-flash |
| HuggingFace | Yes | meta-llama/Llama-3-8B |
| OpenAI | No | gpt-4o, gpt-4o-mini |
| Anthropic | No | claude-3-haiku, claude-3-sonnet |
| OpenRouter | No | openrouter/auto |
| Cohere | No | command-r |
| Mistral AI | No | mistral-small, mistral-large |

## Multi-Account Orchestration

The orchestration engine coordinates multiple Telegram accounts for:
- **Message distribution** — Round-robin or load-balanced sending
- **Collective actions** — Simultaneous reactions, boosts, invites across accounts
- **Conversation routing** — Topic-based routing with AI-assisted replies
- **Anti-detection** — Staggered timing, proxy rotation, human-like patterns

## Getting Started

### Prerequisites
- Docker + Docker Compose
- Git

### Installation
```bash
git clone <repo>
cd telegram-geeks
docker compose up -d
```

### Initial Setup
1. Register an admin user via the API or dashboard
2. Configure AI provider API keys in `backend/app/core/config.py` or `.env`
3. Add Telegram accounts via TData upload or session strings
4. Browse and execute modules from the dashboard

### Running Tests
```bash
python final_complete_test.py
```

## Docker Services

```yaml
services:
  backend:     telegram-geeks-backend   :8000
  frontend:    telegram-geeks-frontend   :3000
  postgres:    postgres:16-alpine        :5432
  redis:       redis:7-alpine            :6379
  ollama:      ollama/ollama:latest      :11434
  nginx:       nginx:alpine              :80
```

## Key Differentiators vs Telegram Expert

1. **Multi-Account Orchestration** — Coordinate teams of accounts
2. **13 AI Providers** — Including 8 free options (vs. single provider)
3. **TData Upload** — Simple account import from Telegram Desktop
4. **Modern UI/UX** — Professional Next.js dashboard
5. **Open Source Core** — Transparent and customizable
6. **Crypto Payments** — NowPayments + Oxapay integration
7. **Local AI** — Ollama support for privacy-first deployments

## Troubleshooting

### Module returns "requires Pro plan"
- Ensure your user role is set to "pro" or "admin" in the database
- Get a fresh JWT token after role change

### Module returns "service not available"
- Check that `telegram_layer` is properly mounted in the backend container
- Verify the service class exists in `telegram_layer/src/actions/`

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Verify CORS settings in `backend/app/core/config.py`

### Ollama not responding
- Check `http://localhost:11434/api/tags` for available models
- Pull a model: `docker exec telegram-geeks-ollama-1 ollama pull llama3`
