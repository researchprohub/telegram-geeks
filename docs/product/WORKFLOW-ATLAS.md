# TelegramGeeks — Workflow Atlas

**Version:** 1.0  
**Date:** 2026-07-19  
**Status:** Final

---

## 1. Platform Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Landing  │ │Dashboard │ │  Admin   │ │  Auth      │  │
│  │  Page    │ │  Views   │ │  Panel   │ │  Flows     │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
├─────────────────────────────────────────────────────────┤
│                   API LAYER (FastAPI)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Campaign │ │ Audience │ │  Bot     │ │ Analytics  │  │
│  │  Service │ │ Service  │ │ Service  │ │  Service   │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
├─────────────────────────────────────────────────────────┤
│                 TELEGRAM LAYER                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Bot API  │ │Rate Limiter│ │Proxy    │ │Safety     │  │
│  │ Client   │ │ & Queue  │ │Rotator  │ │Monitor    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
├─────────────────────────────────────────────────────────┤
│               DATA LAYER                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │PostgreSQL│ │  Redis   │ │  S3/MinIO│                │
│  │(Primary) │ │(Cache)   │ │(Storage) │                │
│  └──────────┘ └──────────┘ └──────────┘                │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Core Workflow Diagrams

### 2.1 Campaign Execution Flow

```
User creates campaign
        │
        ▼
  Validate audience (opt-in check)
        │
        ▼
  Compose message (AI assist available)
        │
        ▼
  Schedule / Immediate send
        │
        ▼
  ┌─── Queue in Redis ───┐
   │                      │
   ▼                      │
  Rate limiter checks     │
   │                      │
   ▼                      │
  Telegram Bot API call   │
   │                      │
   ▼                      │
  Delivery status update  │
   │                      │
   ▼                      │
  Analytics capture       │
   │                      │
   ▼                      │
  User notification       │
```

**Key Decision Points:**
- **Audience opt-in validation:** Every message recipient must have explicitly opted in. If any contact fails validation, the campaign pauses with an error report.
- **Rate limit compliance:** Per-bot rate limits enforced by the rate limiter module. Exceeding limits triggers a backoff queue.
- **Message content filtering:** Basic content scan for spam indicators (excessive links, suspicious URLs, prohibited keywords).

### 2.2 Bot Connection & Health Flow

```
User clicks "Connect Bot"
        │
        ▼
  Paste bot token / OAuth
        │
        ▼
  Validate token with Telegram API
        │
        ▼
  Fetch bot info (username, permissions)
        │
        ▼
  Assign rate limit profile
        │
        ▼
  Start health monitor (background task)
        │
        ▼
  ┌─── Health Monitor ───┐
   │                      │
   ▼                      │
  Ping Telegram API       │
   │                      │
   ▼                      │
  Update status in Redis  │
   │                      │
   ▼                      │
  Alert on error          │
```

### 2.3 Audience Import Flow

```
User selects "Import Contacts"
        │
        ▼
  Upload CSV / Sync Telegram group
        │
        ▼
  Parse and validate rows
        │
        ▼
  Detect duplicates (by telegram_id)
        │
        ▼
  Show preview with validation results
        │
        ▼
  User confirms import
        │
        ▼
  Batch insert to PostgreSQL
        │
        ▼
  Send confirmation with stats
```

**Opt-in Enforcement:** When syncing from Telegram groups, only members who have interacted with the bot are imported. No bulk group member scraping.

### 2.4 Automation Rule Execution Flow

```
Trigger event occurs (new member, reaction, keyword)
        │
        ▼
  Event queue in Redis
        │
        ▼
  Automation engine evaluates rules
        │
        ▼
  Match found? → Execute action
        │
        ▼
  Log execution to analytics
        │
        ▼
  Update rule execution counter
```

### 2.5 Payment & Billing Flow

```
User upgrades plan
        │
        ▼
  Stripe checkout / invoice
        │
        ▼
  Payment webhook received
        │
        ▼
  Update user plan_tier
        │
        ▼
  Adjust rate limit quotas
        │
        ▼
  Send confirmation email
        │
        ▼
  Log to payment records
```

---

## 3. Drop-off Risk Matrix

| Workflow Step | Risk Level | Mitigation Strategy |
|---------------|-----------|---------------------|
| Email verification | Medium | Telegram OAuth fallback |
| Bot token paste | High | Copy-paste helper, QR code for mobile |
| Audience import | High | Sample template download, drag-and-drop |
| First campaign creation | Critical | Pre-built templates, AI auto-fill |
| Scheduling | Medium | Calendar widget with smart suggestions |
| Payment upgrade | High | Transparent pricing, free trial period |
| Team invitation | Low | Simple email invite with role presets |

---

## 4. State Machine Definitions

### Campaign States
```
DRAFT → SCHEDULED → SENDING → COMPLETED
                       ↓           ↓
                    PAUSED     FAILED
                       ↑           ↓
                       └── RETRY ──┘
```

### Bot States
```
DISCONNECTED → CONNECTING → CONNECTED → HEALTHY
                                      ↓
                                   WARNING
                                      ↓
                                   ERROR
                                      ↓
                              RECONNECTING → CONNECTED
```

### Audience States
```
CREATING → ACTIVE → IMPORTING → ACTIVE
                          ↓
                       VALIDATING → ACTIVE
```

---

## 5. Error Handling Patterns

| Error Type | User Message | Recovery Path |
|------------|-------------|---------------|
| Bot token invalid | "We couldn't verify your bot token. Please check it matches exactly what @BotFather gave you." | Retry with copy-paste helper |
| Rate limit exceeded | "You've reached Telegram's message limit for this bot. Resuming in {minutes} minutes." | Auto-resume with countdown |
| Message delivery failed | "3 messages failed to deliver. View details." | Retry individual messages |
| Payment declined | "Your payment was declined. Please update your payment method." | Redirect to payment settings |
| Invalid CSV format | "Row 15: Missing required column 'telegram_id'. Please fix and re-upload." | Highlight error rows, download corrected template |

---

## 6. Telegram Compliance Guardrails

All workflows incorporate these mandatory checks:

1. **Opt-in Verification:** Before any message is queued, the recipient's opt-in status is verified against the audience's source.
2. **Rate Limit Enforcement:** Per-bot rate limits from Telegram's API documentation are respected. The rate limiter module implements exponential backoff.
3. **Content Moderation:** Outbound messages are scanned for prohibited content patterns (phishing URLs, scam indicators).
4. **Data Retention:** Per Telegram Bot Platform ToS Section 4.2, user data is automatically purged when no longer needed for the service.
5. **No Scraping:** All audience data must be manually imported or synced from groups the user administers. No automated group member extraction.
