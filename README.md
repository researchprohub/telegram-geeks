# Telegram Engagement Platform

**AI-Powered Multi-Account Community Engagement for Telegram**

The most advanced Telegram marketing automation platform — matching and exceeding every feature in Telegram Expert with AI-driven multi-account orchestration.

## 🚀 Features

### Core
- **Multi-Account Orchestration** — Manage dozens of Telegram accounts from one dashboard
- **AI Persona Factory** — Create diverse, human-like personas with unique personalities
- **Conversation Engine** — Auto-seed discussions, amplify engagement, drive conversions
- **Full Funnel Pipeline** — Monitor → Seed → Amplify → Convert → Analyze

### Telegram Expert Modules — ALL 27 IMPLEMENTED

#### Account Management
| Module | Description |
|--------|-------------|
| **Converter** | TDATA session format conversion (session+json ↔ TDATA) |
| **Booster** | 30-day progressive account warm-up via smart dialogs |
| **Registrar** | Account creation via SMS services (sms-activate, 5sim, onlinesim, smspva) |
| **Duplicator** | Second session for account protection |
| **Forwarder** | Route replies from accounts to working group |
| **Interceptor** | Keyword-based message monitoring and forwarding |
| **JSON Generator** | Generate session+json files for purchased accounts |
| **Link Checker** | Check entity info without accounts |
| **Gender Detector** | AI-powered gender detection from names |
| **SpamBot Remover** | Remove restrictions via @SpamBot with 2captcha |
| **Message Editor** | Edit sent messages (48h window), pin messages |
| **Number Checker** | Validate phone numbers + Telegram existence check |
| **Mass Inspection** | Check all accounts' status in bulk |
| **Import/Export** | Bulk account import and data export |

#### Messaging
| Module | Description |
|--------|-------------|
| **Mass Messaging** | DM to database, by ID, by numbers, to contacts |
| **Text Randomizer** | Spin syntax `{a|b|c}`, style selection, formatting |
| **Autoresponder** | Template-based auto-reply with spin syntax |
| **Autoposting V1** | Post to specific chat list |
| **Autoposting V2** | Post to ALL chats account is member of |
| **Channel Autoposting** | Scheduled content posting to channels |

#### Invites
| Module | Description |
|--------|-------------|
| **Invite by Numbers** | Invite users by phone number |
| **Invite by Username** | Invite users by @username |
| **Invite by ID** | Invite users by numeric ID |
| **Invite via Admin V1** | Use bot admin to invite users |
| **Invite via Admin V2** | Grant admin, invite, remove admin |
| **Invite V1** | Standard invite |
| **Invite V2** | Advanced invite with retry logic |

#### Contact Management
| Module | Description |
|--------|-------------|
| **Contact Book** | Add/export/delete/search contacts |
| **Mass Unsubscribing** | Unsubscribe from channels/chats/both |
| **Leave All Chats** | Bulk leave chats above min size |
| **Delete Dialogs** | Delete and leave chats |
| **Read Dialogs** | Mark dialogs as read |
| **Archive Chats** | Archive chats in bulk |

#### Audience Collection
| Module | Description |
|--------|-------------|
| **Collect from Comments** | Collect users who commented on messages |
| **Collect from Account** | Collect followers/following of a user |
| **Collect from Replies** | Collect users who replied in a chat |
| **Collect New Members** | Collect recently joined members |
| **Collect by Hashtag** | Collect users who posted with hashtag |

#### Bot & Referrals
| Module | Description |
|--------|-------------|
| **Bot Creator** | BotFather automation (create, set commands, photo, delete) |
| **Bot Management** | List bots, update info, manage settings |
| **Referrals to Bots** | Create referral links for bots |
| **Referrals to Mini Apps** | Create Mini App referral links |
| **Referral Stats** | Track clicks, joins, conversion rate |

#### Stories & Reactions
| Module | Description |
|--------|-------------|
| **Stories** | Publish/delete/export stories with user tagging |
| **Reactions** | Add/remove/get reactions with multi-account boosting |

#### Reports & Admin
| Module | Description |
|--------|-------------|
| **Reporter** | Mass complaint filing with anti-detection |
| **Channel Cloner** | Copy channel content including protected |
| **Chat Cloner** | Copy group content with full structure |
| **Admin** | Create chats/channels, manage admins, set photos |
| **Calculator** | ROI calculator, engagement score |
| **Reports** | Campaign and system-wide reports |

#### Database Tools
| Module | Description |
|--------|-------------|
| **Union Databases** | Merge multiple database files |
| **Exclude Database** | Subtract one DB from another |
| **Clean Database** | Remove duplicates, invalid entries |
| **Validate Database** | Check database integrity |

### AI Engine — 13 Providers (200+ Models)
| Provider | Models | Cost |
|----------|--------|------|
| OpenAI | gpt-4o, gpt-4o-mini, o1, o3-mini | Paid |
| Anthropic | Claude Sonnet/Opus | Paid |
| **Groq** | Llama 3.3 70B, Mixtral 8x7B, Gemma 2 | **Free** |
| **Ollama** | Llama 3.1, Mistral, Gemma 2, Qwen 2.5, Phi-3 | **Free (local)** |
| **Google Gemini** | Gemini 2.5 Pro/Flash | **Free** |
| **NVIDIA NIM** | 117+ models | **Free, 40 RPM, no daily cap** |
| **Cerebras** | Llama 3.3 70B, Qwen 3 235B | **Free, 30 RPM** |
| **Cloudflare Workers AI** | 39 models | **Free, serverless** |
| **OpenRouter** | 35+ free models | **Free, single key** |
| **SiliconFlow** | Qwen 2.5, DeepSeek V3/R1 | **Free** |
| **Cohere** | Command R+, embed, rerank | **Free** |
| **Mistral AI** | Mistral Large 3, Ministral 8B | **Free** |
| HuggingFace | Various | Free tier |

### Anti-Detection — 12 Modules
Proxy Rotator, Timing Randomizer, Behavioral Fingerprint, Content Diversifier, Account Aging, Anomaly Detector, Flood Guard, Geo Location, Activity Pattern, Safety Monitor, Cleanup, Reporting

### Orchestrator — 7 Modules
Conversation Engine, Topic Engine, Social Proof, Pipeline (7 stages), Scheduler, Reporter, Anti-Pattern

### Analytics — 6 Modules
Metrics, Predictions, Alerts, Charts (6 types), Comparisons, Exports, Real-time Streaming

### Frontend — 8 Pages
Dashboard, Accounts CRUD, Personas CRUD, Campaigns Wizard, Groups CRUD, Analytics Dashboard, Settings

## 📁 Project Structure
```
telegram-engagement-platform/
├── backend/                 # FastAPI REST API (13 endpoint groups)
├── ai_engine/               # 13 AI provider implementations
├── telegram_layer/          # 27 Telegram Expert modules
├── orchestrator/            # Conversation orchestration engine
├── anti_detection/          # 12 anti-detection modules
├── database_layer/          # PostgreSQL + Redis
├── analytics_engine/        # Metrics, predictions, alerts, charts
├── frontend/                # Next.js dashboard (8 pages)
├── nginx/                   # Reverse proxy
├── scripts/                 # Init and seed scripts
├── docs/                    # Full documentation
├── docker-compose.yml       # Full orchestration
└── Makefile                 # Build/run commands
```

## ⚡ Quick Start
```bash
cd telegram-engagement-platform
cp backend/.env.example backend/.env
docker compose up -d postgres redis ollama
cd backend && alembic upgrade head && cd ..
docker compose up -d backend frontend
# Visit http://localhost:3000
```

## 📖 Documentation
- [API Reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Security](docs/SECURITY.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)

## 📄 License
MIT License
