# API Contracts — TelegramGeeks Platform

**Date:** 2026-07-19  
**Version:** 1.0.0  
**Base URL:** `/api/v1`  
**Auth:** Bearer token in `Authorization` header  

---

## Authentication Endpoints

### POST `/auth/login`
**Purpose:** Authenticate user and receive JWT tokens.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string (EmailStr) | Yes | User email |
| password | string | Yes | User password (min 8 chars) |

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 604800
}
```

**Response 401:** Invalid email or password  
**Response 403:** Account is deactivated

**⚠️ SECURITY NOTE:** Both `access_token` and `refresh_token` return the same value. This is a design flaw — refresh tokens should be distinct and rotatable.

---

### POST `/auth/register`
**Purpose:** Create a new user account.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string (EmailStr) | Yes | Unique email |
| password | string | Yes | Min 8 characters |
| full_name | string | No | User display name |

**Response 200:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "operator",
  "is_active": true,
  "created_at": "2026-07-19T00:00:00"
}
```

**Response 409:** Email already registered

---

### POST `/auth/refresh`
**Purpose:** Refresh JWT token.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refresh_token | string | Yes | Current token |

**Response 200:** Same as `/auth/login`  
**Response 401:** Invalid refresh token

---

### GET `/auth/me`
**Purpose:** Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "operator",
  "is_active": true,
  "created_at": "2026-07-19T00:00:00"
}
```

**Response 401:** Invalid token

---

## Accounts Endpoints

### GET `/accounts/`
**Purpose:** List accounts with pagination.

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| page_size | int | 20 | Items per page |
| status | string | null | Filter by status |

**Response 200:**
```json
{
  "items": [
    {
      "id": 1,
      "phone_number": "+1234567890",
      "status": "active",
      "proxy_config": {},
      "last_activity": "2026-07-19T10:00:00",
      "flood_wait_until": null,
      "ban_reason": null,
      "trust_score": 85.0,
      "daily_message_count": 12,
      "created_at": "2026-07-19T00:00:00"
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

---

### POST `/accounts/`
**Purpose:** Create a new Telegram account.

**Body:**
```json
{
  "phone_number": "+1234567890",
  "session_string": "1...encrypted...",
  "proxy_config": {"host": "proxy.example.com", "port": 8080, "type": "socks5"}
}
```

**Response 201:** Account object  
**Response 409:** Phone number already exists

---

### GET `/accounts/{account_id}`
**Purpose:** Get account details.

**Response 200:** Account object  
**Response 404:** Account not found

---

### PUT `/accounts/{account_id}`
**Purpose:** Update account settings.

**Body (partial update):**
```json
{
  "session_string": "new_session...",
  "proxy_config": {...},
  "status": "active"
}
```

---

### DELETE `/accounts/{account_id}`
**Purpose:** Soft-delete an account. Sets `status = "deleted"` and `deleted_at`.

---

### POST `/accounts/{account_id}/health`
**Purpose:** Check account health status.

**Response 200:**
```json
{
  "account_id": 1,
  "is_connected": true,
  "is_banned": false,
  "is_spamblocked": false,
  "flood_wait_remaining": null,
  "last_error": null,
  "trust_score": 85.0,
  "daily_messages_sent": 12
}
```

---

### POST `/accounts/{account_id}/warmup`
**Purpose:** Start account warm-up process.

### POST `/accounts/{account_id}/suspend`
**Purpose:** Temporarily suspend an account.

### POST `/accounts/{account_id}/unsuspend`
**Purpose:** Resume a suspended account.

---

## Campaigns Endpoints

### GET `/campaigns/`
**Purpose:** List campaigns with pagination.

**Query Params:** `page`, `page_size`, `status`

**Response 200:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Tech Outreach",
      "description": "Engage tech communities",
      "campaign_type": "engagement",
      "status": "running",
      "config": {"min_delay": 10, "max_delay": 60},
      "target_groups": [1, 2, 3],
      "allowed_hours": [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "timezone": "UTC",
      "persona_ids": [1],
      "created_by": 1,
      "created_at": "2026-07-19T00:00:00",
      "started_at": "2026-07-19T10:00:00"
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

---

### POST `/campaigns/`
**Purpose:** Create a new campaign.

**Body:**
```json
{
  "name": "New Campaign",
  "description": "Campaign description",
  "campaign_type": "engagement",
  "config": {},
  "target_groups": [],
  "allowed_hours": [],
  "timezone": "UTC",
  "persona_ids": []
}
```

---

### GET `/campaigns/{campaign_id}`
**Purpose:** Get campaign details.

### PUT `/campaigns/{campaign_id}`
**Purpose:** Update campaign (partial update).

### DELETE `/campaigns/{campaign_id}`
**Purpose:** Hard-delete a campaign. ⚠️ **Inconsistent** — other resources use soft delete.

### POST `/campaigns/{campaign_id}/start`
**Purpose:** Start a campaign (status → "running").

### POST `/campaigns/{campaign_id}/pause`
**Purpose:** Pause a campaign (status → "paused").

### POST `/campaigns/{campaign_id}/stop`
**Purpose:** Stop a campaign (status → "stopped").

### GET `/campaigns/{campaign_id}/conversations`
**Purpose:** List conversations for a campaign.

**Response:** ⚠️ **STUB** — Returns `{"items": [], "total": 0, ...}` always.

### GET `/campaigns/{campaign_id}/threads`
**Purpose:** List threads for a campaign.

**Response:** ⚠️ **STUB** — Returns `{"threads": []}` always.

---

## Groups Endpoints

### GET `/groups/`
**Purpose:** List target groups with pagination.

**Query Params:** `page`, `page_size`, `group_type`

### POST `/groups/`
**Purpose:** Add a target group.

**Body:**
```json
{
  "chat_id": -1001234567890,
  "title": "Tech News Channel",
  "group_type": "channel",
  "member_count": 5000,
  "niche_tags": ["tech", "news"],
  "language": "en"
}
```

### GET `/groups/{group_id}`
**Purpose:** Get group details.

### DELETE `/groups/{group_id}`
**Purpose:** Delete a group.

### POST `/groups/{group_id}/scrape-members`
**Purpose:** Scrape members from a group.

**Query Params:** `limit` (default: 100)

**Response:** ⚠️ **STUB** — Returns `{"message": "...", "members_count": 0}`.

### POST `/groups/{group_id}/analyze`
**Purpose:** Analyze group metrics.

**Response 200:**
```json
{
  "group_id": 1,
  "title": "Tech News",
  "member_count": 5000,
  "safety_score": 95.0,
  "niche_tags": ["tech", "news"]
}
```

---

## Personas Endpoints

### GET `/personas/`
**Purpose:** List personas with pagination.

### POST `/personas/`
**Purpose:** Create a new AI persona.

**Body:**
```json
{
  "name": "Alex",
  "personality_traits": {"outgoing": 0.8, "analytical": 0.6},
  "writing_style": {"formality": 0.3, "humor": 0.7},
  "response_time_min": 30,
  "response_time_max": 300,
  "avatar_url": null,
  "niche_tags": ["tech", "crypto"],
  "tone": "casual",
  "energy_level": 0.7,
  "humor_level": 0.6,
  "formality_level": 0.3
}
```

### GET `/personas/{persona_id}`
**Purpose:** Get persona details.

### PUT `/personas/{persona_id}`
**Purpose:** Update persona (partial update).

### DELETE `/personas/{persona_id}`
**Purpose:** Delete a persona.

### POST `/personas/{persona_id}/test`
**Purpose:** Test persona AI generation.

**Response 200:**
```json
{
  "persona_id": 1,
  "name": "Alex",
  "sample_response": "Hey! This is Alex speaking...",
  "quality_score": 0.92
}
```

---

## Modules Endpoints

### GET `/modules/`
**Purpose:** List all 44 Telegram Expert modules.

**Query Params:** `category` (optional filter)

**Response 200:**
```json
{
  "total": 44,
  "active": 44,
  "categories": ["account", "admin", "audience", "content", "growth", "messaging"],
  "module_categories": {...},
  "modules": [
    {
      "id": "converter",
      "name": "TDATA Converter",
      "category": "account",
      "icon": "refresh-cw",
      "description": "Convert session+json to TDATA format.",
      "operations": ["convert_to_tdata", "convert_from_tdata", "mass_convert"],
      "status": "active"
    }
  ]
}
```

### GET `/modules/{module_id}`
**Purpose:** Get module details. Checks plan tier access.

### POST `/modules/{module_id}/execute`
**Purpose:** Execute a module operation.

**Body:**
```json
{
  "operation": "send_to_database",
  "params": {
    "account_id": "test",
    "database_path": "./contacts.csv",
    "text": "Hello!"
  }
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "module": "mass_messaging",
  "operation": "send_to_database",
  "result": {...}
}
```

**Response 403:** Module requires higher plan tier  
**Response 404:** Module not found

### GET `/modules/plans`
**Purpose:** List available plan tiers.

**Response 200:** Array of plan tier objects with pricing, features, and module access.

### GET `/modules/status`
**Purpose:** Get dispatcher and infrastructure status.

---

## Analytics Endpoints

### GET `/analytics/summary/{campaign_id}`
**Purpose:** Get campaign analytics summary.

**Response 200:**
```json
{
  "campaign_id": 1,
  "campaign_name": "Tech Outreach",
  "status": "running",
  "total_conversations": 42,
  "engagement_score": 0.0,
  "conversion_rate": 0.0,
  "roi": 0.0,
  "account_health_index": 0.0
}
```
⚠️ **Note:** Scores are always 0.0 — analytics computation is not implemented.

### GET `/analytics/engagement/{group_id}`
**Purpose:** Get group engagement metrics.

**Response 200:** Similar structure with `score`, `total_messages`, etc. Most values are 0.

### GET `/analytics/funnel/{campaign_id}`
**Purpose:** Get conversion funnel data.

**Response 200:** `{"impressions": 0, "engagements": 0, ...}` — all zeros.

### GET `/analytics/account-health/{account_id}`
**Purpose:** Get account health metrics.

**Response 200:** Real data from Account model (trust_score, daily_messages, status).

### GET `/analytics/export/{campaign_id}`
**Purpose:** Export analytics data.

**Query Params:** `format` (default: "json")

**Response:** ⚠️ **STUB** — Returns `{"message": "Exported analytics..."}`.

---

## Advanced Analytics Endpoints

### GET `/advanced-analytics/engagement-summary`
**Purpose:** Overall engagement summary.

**Response 200:** ⚠️ **STUB** — All counts are 0.

### GET `/advanced-analytics/account-health/{account_id}`
**Purpose:** Detailed account health score.

**Response 200:** ⚠️ **STUB** — Returns hardcoded scores.

### GET `/advanced-analytics/ai-insights`
**Purpose:** AI-generated insights.

**Response 200:** ⚠️ **STUB** — Returns hardcoded insight examples.

### GET `/advanced-analytics/roi-calculator`
**Purpose:** Calculate campaign ROI.

**Query Params:** `messages_sent`, `conversions`, `cost_per_account`, `revenue_per_conversion`, `total_accounts`

**Note:** Imports and calls `CalculatorReportsService` — this is one of the few endpoints with real computation.

### GET `/advanced-analytics/engagement-score`
**Purpose:** Calculate engagement score.

**Query Params:** `total_messages`, `total_reactions`, `total_views`, `unique_participants`, `total_members`

**Note:** Calls `CalculatorReportsService` — real computation.

### GET `/advanced-analytics/performance-trend`
**Purpose:** Performance trend data.

**Query Params:** `days` (default: 30)

**Response:** ⚠️ **STUB** — Uses `random.randint()` for data points.

---

## Payments Endpoints

### POST `/payments/create`
**Purpose:** Create a crypto payment.

**Body:**
```json
{
  "amount": 29.0,
  "currency": "USD",
  "pay_currency": null,
  "order_id": "order_123",
  "order_description": "Starter Plan",
  "gateway": "nowpayments",
  "ipn_callback_url": null,
  "metadata": {}
}
```

**Response 200:**
```json
{
  "payment_id": "np_abc123",
  "pay_address": "bc1q...",
  "pay_amount": 0.001,
  "price_amount": 29.0,
  "currency": "USD",
  "expires_at": "2026-07-19T01:00:00",
  "status": "pending",
  "order_id": "1_order_123"
}
```

### GET `/payments/status/{order_id}`
**Purpose:** Check payment status.

### POST `/payments/callback/nowpayments`
**Purpose:** NowPayments IPN webhook handler.

### POST `/payments/callback/oxapay`
**Purpose:** Oxapay webhook handler.

### POST `/payments/manual-deposit`
**Purpose:** Create manual deposit address.

### GET `/payments/manual-deposit/{address}`
**Purpose:** Check deposit status.

### POST `/payments/manual-deposit/confirm`
**Purpose:** Admin confirms manual deposit.

---

## Orchestration Endpoints

### POST `/orchestrate/distribute`
**Purpose:** Distribute messages across accounts.

**Body:**
```json
{
  "target_peer": "@channel",
  "messages": ["Hello!", "Welcome!"],
  "min_delay": 10,
  "max_delay": 60
}
```

### POST `/orchestrate/thread/create`
**Purpose:** Create conversation thread.

### POST `/orchestrate/thread/{thread_id}/respond`
**Purpose:** Send response in thread.

### GET `/orchestrate/threads`
**Purpose:** List all threads.

### POST `/orchestrate/collective-action`
**Purpose:** Execute action across all accounts.

### GET `/orchestrate/accounts`
**Purpose:** List available connected accounts.

### POST `/orchestrate/router/route`
**Purpose:** Route incoming message to best account.

### GET `/orchestrate/router/stats`
**Purpose:** Get routing statistics.

### GET `/orchestrate/router/conversations`
**Purpose:** List conversation contexts.

### POST `/orchestrate/router/expertise`
**Purpose:** Set account topic expertise.

---

## Admin Endpoints (Require `admin` role)

### GET `/admin/users`
**Purpose:** List all users with search/filter/pagination.

**Query Params:** `page`, `page_size`, `search`, `role`, `status`

**Response 200:** Array of `UserListResponse` objects.

### GET `/admin/users/{user_id}`
**Purpose:** Get user details.

### PUT `/admin/users/{user_id}`
**Purpose:** Update user (role, is_active, full_name).

### POST `/admin/users/{user_id}/ban`
**Purpose:** Ban a user (soft delete).

### POST `/admin/users/{user_id}/credit`
**Purpose:** Add credits to user. ⚠️ **STUB** — No balance system implemented.

### DELETE `/admin/users/{user_id}`
**Purpose:** Soft-delete a user.

### GET `/admin/orders`
**Purpose:** List payment orders. ⚠️ **STUB** — Returns `{"orders": [], "total": 0}`.

### GET `/admin/orders/pending`
**Purpose:** List pending orders. ⚠️ **STUB** — Returns `{"pending_orders": []}`.

### PUT `/admin/orders/{order_id}/status`
**Purpose:** Manually update order status. ⚠️ **STUB** — Only logs the action.

### GET `/admin/analytics/overview`
**Purpose:** System-wide analytics.

**Response 200:**
```json
{
  "total_users": 42,
  "active_users": 38,
  "total_revenue": 0.0,
  "total_orders": 0,
  "pending_orders": 0,
  "total_campaigns": 15,
  "active_campaigns": 3,
  "conversion_rate": 0.0,
  "avg_order_value": 0.0,
  "total_accounts": 42,
  "total_groups": 10,
  "total_personas": 5
}
```
⚠️ Revenue, orders, and conversion metrics are all 0 — Order model doesn't exist.

### GET `/admin/deposits/pending`
**Purpose:** List pending deposits. ⚠️ **STUB**.

### POST `/admin/deposits/{deposit_id}/confirm`
**Purpose:** Confirm deposit. ⚠️ **STUB**.

### POST `/admin/deposits/{deposit_id}/reject`
**Purpose:** Reject deposit. ⚠️ **STUB**.

### GET `/admin/settings`
**Purpose:** Get system settings.

**Response 200:** `SystemSettings` object with pricing, supported cryptos, API keys.

### PUT `/admin/settings`
**Purpose:** Update system settings. ⚠️ **STUB** — Only echoes back the body.

---

## TData Upload Endpoints

### POST `/accounts/upload/single`
**Purpose:** Upload a single TData ZIP file.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | ZIP file |
| api_id | int | Yes | Telegram API ID |
| api_hash | string | Yes | Telegram API Hash |

**Response 200:**
```json
{
  "uploaded": 5,
  "failed": 0,
  "accounts": [...],
  "errors": []
}
```

### POST `/accounts/upload/bulk`
**Purpose:** Bulk upload multiple TData ZIP files.

### POST `/accounts/upload/validate`
**Purpose:** Validate TData folder structure.

### GET `/accounts/upload/upload-history`
**Purpose:** Get upload history. ⚠️ **STUB** — Returns empty array.

---

## Errors

All endpoints return errors in this format:

```json
{
  "detail": "Error message string or object"
}
```

Common status codes:
- `400` — Bad request (validation error)
- `401` — Unauthorized (invalid/missing token)
- `403` — Forbidden (insufficient permissions/plan tier)
- `404` — Not found
- `409` — Conflict (duplicate resource)
- `429` — Rate limit exceeded
- `500` — Internal server error
- `503` — Service unavailable (e.g., orchestration engine not initialized)

---

## Known Contract Issues

1. **Inconsistent delete semantics:** Campaigns use hard delete; Accounts use soft delete
2. **Stub endpoints:** Many analytics and admin endpoints return empty/stub data
3. **Missing Order model:** Payment endpoints reference orders but no Order model exists in `models/__init__.py`
4. **No subscription model:** Module access gating uses hardcoded role→tier mapping
5. **Token duplication:** `/auth/refresh` returns identical access and refresh tokens
6. **No pagination on admin endpoints:** `/admin/users` doesn't support pagination (hardcoded offset)
7. **`advanced_analytics/performance-trend`** imports `random` at module level after the function definition (syntax error risk)
