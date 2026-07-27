# API Documentation — Telegram Engagement Platform

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication

All endpoints except `/auth/login` and `/auth/register` require a Bearer token.

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}

Response:
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 604800
}
```

### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

### Refresh Token
```
POST /auth/refresh?refresh_token=xxx
```

### Get Current User
```
GET /auth/me
Authorization: Bearer <token>
```

---

## Accounts

### List Accounts
```
GET /accounts?page=1&page_size=20&status=active
```

### Create Account
```
POST /accounts
{
  "phone_number": "+1234567890",
  "session_string": "AqD7...encrypted_session...",
  "proxy_config": {
    "host": "proxy.example.com",
    "port": 1080,
    "type": "socks5"
  }
}
```

### Get Account
```
GET /accounts/{account_id}
```

### Update Account
```
PUT /accounts/{account_id}
{
  "status": "suspended",
  "proxy_config": {...}
}
```

### Delete Account
```
DELETE /accounts/{account_id}
```

### Check Health
```
POST /accounts/{account_id}/health
```

### Start Warm-up
```
POST /accounts/{account_id}/warmup
```

### Suspend / Unsuspend
```
POST /accounts/{account_id}/suspend
POST /accounts/{account_id}/unsuspend
```

---

## Personas

### List Personas
```
GET /personas?page=1&page_size=20
```

### Create Persona
```
POST /personas
{
  "name": "Alex",
  "tone": "friendly",
  "energy_level": 0.7,
  "humor_level": 0.5,
  "formality_level": 0.2,
  "niche_tags": ["tech", "crypto"],
  "personality_traits": {"openness": 0.8},
  "writing_style": {"style": "casual"}
}
```

### Test Persona Generation
```
POST /personas/{persona_id}/test
Response: {
  "sample_response": "Hey everyone! Just came across...",
  "quality_score": 0.92
}
```

---

## Campaigns

### List Campaigns
```
GET /campaigns?page=1&status=running
```

### Create Campaign
```
POST /campaigns
{
  "name": "Tech Community Engagement",
  "campaign_type": "engagement",
  "config": {"cycle_delay_min": 120, "cycle_delay_max": 300},
  "target_groups": [1, 2, 3],
  "allowed_hours": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
  "timezone": "UTC",
  "persona_ids": [1, 2, 3]
}
```

### Start / Pause / Stop
```
POST /campaigns/{id}/start
POST /campaigns/{id}/pause
POST /campaigns/{id}/stop
```

### Campaign Conversations
```
GET /campaigns/{id}/conversations?page=1&page_size=50
```

---

## Groups

### List Groups
```
GET /groups?page=1&group_type=channel
```

### Add Group
```
POST /groups
{
  "chat_id": -1001234567890,
  "title": "Tech News",
  "group_type": "channel",
  "member_count": 5000,
  "niche_tags": ["tech", "news"]
}
```

### Scrape Members
```
POST /groups/{id}/scrape-members?limit=100
```

### Analyze Group
```
POST /groups/{id}/analyze
Response: {
  "top_topics": ["AI", "blockchain"],
  "activity_score": 0.85,
  "sentiment": "positive",
  "peak_hours": [10, 14, 18, 21]
}
```

---

## Analytics

### Campaign Summary
```
GET /analytics/summary/{campaign_id}
```

### Engagement Score
```
GET /analytics/engagement/{group_id}
```

### Conversion Funnel
```
GET /analytics/funnel/{campaign_id}
```

### Account Health
```
GET /analytics/account-health/{account_id}
```

### Export Data
```
GET /analytics/export/{campaign_id}?format=csv
```

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Invalid request parameters |
| 401 | AUTHENTICATION_ERROR | Missing or invalid token |
| 403 | AUTHORIZATION_ERROR | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 429 | RATE_LIMIT | Too many requests |
| 500 | INTERNAL_ERROR | Server error |
