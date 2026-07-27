# Architecture Document

## System Overview

The Telegram Engagement Platform is a microservices-style monorepo that enables AI-powered multi-account community engagement on Telegram.

## Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│              React + Tailwind + shadcn/ui               │
│              http://localhost:3000                       │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                  Backend (FastAPI)                       │
│              http://localhost:8000                       │
│  ┌─────────────┬──────────────┬──────────────────────┐  │
│  │ API Routes  │ Services     │ Middleware           │  │
│  │ Auth        │ Account      │ Rate Limiter         │  │
│  │ Accounts    │ Campaign     │ Request Logging      │  │
│  │ Personas    │ Analytics    │                      │  │
│  │ Campaigns   │              │                      │  │
│  │ Groups      │              │                      │  │
│  └─────────────┴──────────────┴──────────────────────┘  │
└──────┬─────────────────────────────────┬────────────────┘
       │                                 │
┌──────▼──────────────┐       ┌──────────▼────────────────┐
│  AI Engine          │       │  Conversation             │
│  Multi-provider     │       │  Orchestrator             │
│  OpenAI / Claude    │       │  Topic Detection          │
│  Groq / Ollama      │       │  Thread Coordination      │
└──────┬──────────────┘       └──────────┬────────────────┘
       │                                  │
┌──────▼──────────────────────────────────▼────────────────┐
│           Telegram API Layer                              │
│  Telethon Client Manager  │  Flood Handler               │
│  Proxy Manager            │  Ban Detector                │
└──────┬──────────────────────────────────┬────────────────┘
       │                                  │
┌──────▼──────────────┐       ┌──────────▼────────────────┐
│  Anti-Detection      │       │  Analytics Engine         │
│  Proxy Rotator       │       │  Metrics Calculator       │
│  Timing Randomizer   │       │  Report Generator         │
│  Behavioral Fingerprint │    │  Dashboard Data           │
└──────┬──────────────┘       └──────────┬────────────────┘
       │                                  │
┌──────▼──────────────────────────────────▼────────────────┐
│              Data Layer                                   │
│  PostgreSQL (persistent)    │  Redis (queue/cache/pubsub) │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User** creates a campaign via the frontend dashboard
2. **Backend** validates the request and stores it in PostgreSQL
3. **Orchestrator** picks up the campaign and begins processing
4. **AI Engine** generates persona-appropriate responses using the configured provider
5. **Telegram Layer** sends messages via Telethon clients with proxy rotation
6. **Anti-Detection** ensures all actions pass timing, rate, and behavioral checks
7. **Analytics Engine** records metrics and updates the dashboard in real-time

## Technology Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Backend | FastAPI | Async-native, auto-docs, high performance |
| Frontend | Next.js 14 | SSR, routing, ecosystem maturity |
| ORM | SQLAlchemy 2.0 | Mature, async support, migrations via Alembic |
| Telegram API | Telethon | Most mature Python MTProto library |
| AI Providers | Multi | Flexibility — paid + free + local models |
| Cache/Queue | Redis | Speed, pub/sub, distributed state |
| Database | PostgreSQL | Reliability, JSON support, full-text search |

## Scaling Considerations

- **Horizontal scaling**: Stateless backend behind load balancer
- **Account scaling**: Each account runs in its own Telethon client
- **AI scaling**: Provider abstraction allows switching between cloud/local
- **Database**: Read replicas for analytics, connection pooling
