# TelegramGeeks — Screen Inventory & Workflow Atlas

**Version:** 1.0  
**Date:** 2026-07-19  
**Status:** Final

---

## Part A: Complete Screen Inventory (All Routes)

### Operator Dashboard Area (User-Facing)

| # | Route | Screen Name | Purpose | Priority |
|---|-------|-------------|---------|----------|
| 1 | `/` | Landing Page | Marketing site, value prop, CTA to sign up | P0 |
| 2 | `/auth/login` | Login | Email/password + Telegram OAuth login | P0 |
| 3 | `/auth/register` | Registration | Email signup with Telegram number verification | P0 |
| 4 | `/auth/forgot-password` | Password Reset | Email-based password recovery | P1 |
| 5 | `/dashboard` | Main Dashboard | 6-second overview: WAC, active bots, recent campaigns, health score | P0 |
| 6 | `/dashboard/bots` | Bot Manager | Connect/manage Telegram bots, view health, API status | P0 |
| 7 | `/dashboard/bots/[id]/connect` | Bot Connection Wizard | Step-by-step bot token setup, permission verification | P0 |
| 8 | `/dashboard/bots/[id]/settings` | Bot Settings | Per-bot configuration: rate limits, permissions, webhook config | P1 |
| 9 | `/dashboard/campaigns` | Campaigns List | All campaigns with status filters, search, bulk actions | P0 |
| 10 | `/dashboard/campaigns/new` | Campaign Creator | Step wizard: type → audience → content → schedule → launch | P0 |
| 11 | `/dashboard/campaigns/[id]/edit` | Campaign Editor | Modify active/paused campaigns | P0 |
| 12 | `/dashboard/campaigns/[id]/analytics` | Campaign Analytics | Per-campaign metrics: delivery, open, click, conversion rates | P0 |
| 13 | `/dashboard/campaigns/[id]/preview` | Campaign Preview | Mobile/desktop preview of campaign messages | P1 |
| 14 | `/dashboard/audiences` | Audience Manager | Contact lists, segments, tags, import/export | P0 |
| 15 | `/dashboard/audiences/[id]/segments` | Segment Builder | Dynamic segment rules: join date, activity level, tags | P0 |
| 16 | `/dashboard/audiences/import` | Contact Import | CSV upload with mapping, duplicate detection, validation | P0 |
| 17 | `/dashboard/audiences/[id]/members` | Member Directory | Searchable list of audience members with activity indicators | P1 |
| 18 | `/dashboard/messages` | Message Composer | Rich text editor with templates, variables, media attachment | P0 |
| 19 | `/dashboard/messages/templates` | Template Library | Save/reuse message templates, AI-assisted creation | P1 |
| 20 | `/dashboard/scheduling` | Schedule Calendar | Visual calendar of upcoming broadcasts, sequences, automations | P0 |
| 21 | `/dashboard/automations` | Automation Rules | Trigger-based workflows: new member welcome, reaction responses, keyword triggers | P0 |
| 22 | `/dashboard/automations/[id]` | Automation Editor | Visual flow builder for automation rules | P0 |
| 23 | `/dashboard/analytics` | Analytics Hub | Cross-campaign dashboards, cohort analysis, trend charts | P0 |
| 24 | `/dashboard/analytics/realtime` | Real-Time Monitor | Live campaign delivery, active users, message queue depth | P1 |
| 25 | `/dashboard/analytics/export` | Report Export | Download analytics reports (PDF, CSV) | P1 |
| 26 | `/dashboard/payments` | Billing & Plans | Current plan, usage stats, payment method, upgrade/downgrade | P0 |
| 27 | `/dashboard/payments/usage` | Usage Dashboard | Detailed breakdown: messages sent, API calls, storage used | P1 |
| 28 | `/dashboard/settings/profile` | Profile Settings | Account info, avatar, timezone, language preferences | P1 |
| 29 | `/dashboard/settings/security` | Security Settings | 2FA, API keys, session management, audit log | P0 |
| 30 | `/dashboard/settings/notifications` | Notification Preferences | Email, in-app, webhook notification settings | P1 |
| 31 | `/dashboard/integrations` | Integrations Marketplace | Connect Stripe, Zapier, Google Sheets, custom webhooks | P1 |
| 32 | `/dashboard/referrals` | Referral Program | Track referral links, rewards, leaderboard | P2 |
| 33 | `/dashboard/onboarding` | Setup Wizard | First-time user onboarding: connect bot → create first audience → send first message | P0 |
| 34 | `/dashboard/help` | Help Center | Documentation, tutorials, video guides, FAQ | P1 |
| 35 | `/dashboard/support/ticket` | Support Ticket | Submit and track support requests | P1 |

### Admin Panel (Platform Operators)

| # | Route | Screen Name | Purpose | Priority |
|---|-------|-------------|---------|----------|
| 36 | `/admin` | Admin Dashboard | Platform health: active users, revenue, bot uptime, abuse reports | P0 |
| 37 | `/admin/users` | User Management | Search, suspend, upgrade users; view activity logs | P0 |
| 38 | `/admin/users/[id]` | User Detail | Full user profile, connected bots, campaign history, billing | P0 |
| 39 | `/admin/bots` | Bot Health Monitor | System-wide bot status, error rates, API quota utilization | P0 |
| 40 | `/admin/campaigns` | Campaign Oversight | Review flagged campaigns, enforce content policies | P1 |
| 41 | `/admin/analytics` | Platform Analytics | MAU, revenue, churn, feature adoption, cohort retention | P0 |
| 42 | `/admin/analytics/revenue` | Revenue Dashboard | MRR, ARR, LTV, CAC, conversion funnel | P1 |
| 43 | `/admin/compliance` | Compliance Dashboard | Spam reports, ToS violations, rate-limit breaches | P0 |
| 44 | `/admin/compliance/reports` | Abuse Reports | Review user-reported spam, take action | P0 |
| 45 | `/admin/settings/general` | Platform Settings | Global configuration, feature flags, maintenance mode | P0 |
| 46 | `/admin/settings/pricing` | Pricing Management | Plan configuration, coupon codes, usage thresholds | P1 |
| 47 | `/admin/settings/webhooks` | Webhook Manager | System webhook endpoints, retry policies | P1 |
| 48 | `/admin/logs` | Audit Log | Immutable log of all admin actions, system events | P0 |
| 49 | `/admin/ai/models` | AI Model Config | Configure AI providers, rate limits, content filters | P1 |
| 50 | `/admin/health` | System Health | Infrastructure monitoring: CPU, memory, queue depth, error rates | P0 |

### Missing Screens (Identified Gaps)

| Gap | Route | Description | Recommendation |
|-----|-------|-------------|----------------|
| 1 | `/auth/verify-email` | Email verification after signup | **ADD** — Critical for deliverability trust |
| 2 | `/auth/setup-2fa` | Two-factor authentication setup | **ADD** — Required for security |
| 3 | `/dashboard/billing/invoices` | Historical invoice download | **ADD** — Essential for business users |
| 4 | `/dashboard/billing/upgrade` | Plan upgrade flow with proration | **ADD** — Revenue-critical path |
| 5 | `/dashboard/audiences/[id]/import-preview` | CSV import preview before commit | **ADD** — Prevents bad data |
| 6 | `/dashboard/campaigns/[id]/retry` | Manual retry failed messages | **ADD** — Operational necessity |
| 7 | `/dashboard/notifications` | Centralized notification center | **ADD** — Currently scattered across pages |
| 8 | `/dashboard/empty-state` | Empty dashboard/audience/campaign states | **ADD** — Critical for onboarding experience |

---

## Part B: 5 Core User Journeys

### Journey 1: First-Time User Activation
```
Sign Up → Verify Email → Connect Bot → Create First Audience → Send First Broadcast → See Results
```

**Drop-off Mitigations:**
- **Email verification friction:** Offer Telegram OAuth as alternative auth method
- **Bot connection confusion:** Progressive wizard with real-time status indicators, copy-paste token input
- **Audience creation blank slate:** Pre-populated sample audience, one-click import from Telegram group members
- **First campaign paralysis:** 5 pre-built templates ("Welcome New Members", "Weekly Update", "Event Announcement")
- **Results invisibility:** Real-time delivery counter during send, post-send summary with engagement metrics

### Journey 2: Campaign Management
```
Create Campaign → Select Audience → Compose Message → Schedule → Monitor → Analyze
```

**Drop-off Mitigations:**
- **Audience selection overwhelm:** Smart suggestions based on past campaign performance
- **Content writer's block:** AI-assisted message drafting with tone/style options
- **Scheduling confusion:** Calendar view with drag-and-drop, timezone-aware delivery
- **Monitoring anxiety:** Live delivery feed with error highlighting, one-click pause
- **Analysis paralysis:** Auto-generated post-campaign report with actionable insights

### Journey 3: Audience Growth
```
Define Target → Import/Connect → Segment → Nurture → Convert
```

**Drop-off Mitigations:**
- **Import friction:** Drag-and-drop CSV with live validation, Telegram group member sync
- **Segmentation complexity:** Visual segment builder with real-time member count preview
- **Nurture fatigue:** Automated welcome sequences, smart content recommendations
- **Conversion gap:** Integrated payment links, referral tracking, A/B tested CTAs

### Journey 4: Platform Scaling
```
Add Second Bot → Create Team → Set Permissions → Monitor Multi-Bot → Optimize Quotas
```

**Drop-off Mitigations:**
- **Multi-bot complexity:** Bot comparison dashboard showing quota utilization per bot
- **Team onboarding:** Role-based access with guided setup, invite links with pre-filled permissions
- **Quota management:** Predictive alerts (80%, 90%, 95% of hourly limits), auto-scaling recommendations
- **Cross-bot analytics:** Unified view with per-bot and aggregated metrics

### Journey 5: Revenue Generation (Creator Monetization)
```
Set Up Payment → Create Paid Content → Promote to Audience → Track Revenue → Retain Subscribers
```

**Drop-off Mitigations:**
- **Payment setup:** Guided Stripe integration with test mode, one-click connect
- **Content gating confusion:** Visual content lock/unlock preview, drip schedule builder
- **Revenue tracking:** Simple revenue dashboard with churn alerts, lifetime value per subscriber
- **Retention:** Automated renewal reminders, win-back campaigns for lapsed subscribers

---

## Part C: Data Model Surface (UI-Relevant Entities)

### Entity 1: User
| Field | Type | UI Relevance |
|-------|------|--------------|
| id | UUID | Primary key |
| email | String | Login, invoices |
| telegram_id | String | Bot linkage |
| plan_tier | Enum | Feature gates, billing |
| created_at | DateTime | Onboarding timeline |
| last_active | DateTime | Activity indicators |
| avatar_url | String | Profile display |
| two_factor_enabled | Boolean | Security badge |

### Entity 2: Bot
| Field | Type | UI Relevance |
|-------|------|--------------|
| id | UUID | Bot selector |
| user_id | FK → User | Ownership |
| bot_token_hash | String | Connection status |
| username | String | Bot identification |
| status | Enum (active/paused/disconnected) | Health indicator |
| api_quota_remaining | Integer | Quota bar |
| api_quota_reset_at | DateTime | Quota countdown |
| connected_chats_count | Integer | Capacity display |
| error_count_24h | Integer | Error badge |

### Entity 3: Campaign
| Field | Type | UI Relevance |
|-------|------|--------------|
| id | UUID | Campaign selector |
| user_id | FK → User | Ownership |
| name | String | Campaign list |
| type | Enum (broadcast/sequence/automation) | Filter, icon |
| status | Enum (draft/scheduled/sending/completed/paused/failed) | Status badge |
| audience_id | FK → Audience | Target display |
| scheduled_at | DateTime | Schedule display |
| sent_count | Integer | Progress bar |
| delivered_count | Integer | Delivery rate |
| failed_count | Integer | Error rate |
| created_at | DateTime | Date column |

### Entity 4: Audience
| Field | Type | UI Relevance |
|-------|------|--------------|
| id | UUID | Audience selector |
| user_id | FK → User | Ownership |
| name | String | Audience list |
| type | Enum (telegram_group/telegram_channel/custom) | Type badge |
| member_count | Integer | Size display |
| active_members_7d | Integer | Engagement indicator |
| created_at | DateTime | Age indicator |
| last_imported | DateTime | Freshness |

### Entity 5: Message Template
| Field | Type | UI Relevance |
|-------|------|--------------|
| id | UUID | Template selector |
| user_id | FK → User | Ownership |
| name | String | Template list |
| content_preview | String | Card preview |
| type | Enum (text/html/media/interactive) | Icon |
| variables | JSON | Variable badges |
| created_at | DateTime | Sort order |

### Entity 6: Automation Rule
| Field | Type | UI Relevance |
|-------|------|--------------|
| id | UUID | Rule selector |
| user_id | FK → User | Ownership |
| name | String | Rule list |
| trigger_type | Enum (new_member/reaction/keyword/schedule) | Trigger icon |
| trigger_value | String | Trigger display |
| action_type | Enum (send_message/add_tag/remove_member) | Action icon |
| is_active | Boolean | Toggle switch |
| executions_count | Integer | Usage stat |

### Entity 7: Payment
| Field | Type | UI Relevance |
|-------|------|--------------|
| id | UUID | Invoice ID |
| user_id | FK → User | Ownership |
| amount_cents | Integer | Amount display |
| currency | String | Currency symbol |
| status | Enum (pending/succeeded/failed/refunded) | Status badge |
| plan_tier | String | Plan name |
| created_at | DateTime | Date column |
| stripe_invoice_url | String | Receipt link |

### Entity 8: Notification
| Field | Type | UI Relevance |
|-------|------|--------------|
| id | UUID | Notification ID |
| user_id | FK → User | Ownership |
| type | Enum (campaign_complete/bot_error/quota_warning/payment) | Icon mapping |
| title | String | Notification header |
| body | String | Notification body |
| is_read | Boolean | Unread dot |
| created_at | DateTime | Timestamp |
| action_url | String | Click target |
