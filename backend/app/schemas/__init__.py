"""Pydantic schemas for API request/response validation."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ---- Password helpers ----

def _validate_password_strength(password: str) -> list[str]:
    """Validate password meets complexity requirements. Returns list of failures."""
    errors = []
    if len(password) < 12:
        errors.append("At least 12 characters")
    if not re.search(r"[A-Z]", password):
        errors.append("At least one uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("At least one lowercase letter")
    if not re.search(r"\d", password):
        errors.append("At least one digit")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]", password):
        errors.append("At least one special character (!@#$%^&*...)")
    return errors


# ---- Auth ----

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=12)

    @field_validator("new_password")
    @classmethod
    def new_password_complexity(cls, v: str) -> str:
        errors = _validate_password_strength(v)
        if errors:
            raise ValueError(f"Password does not meet requirements: {'; '.join(errors)}")
        return v


class UpdateProfile(BaseModel):
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email format")
        return v.strip().lower()


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=12)
    full_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        errors = _validate_password_strength(v)
        if errors:
            raise ValueError(f"Password does not meet requirements: {'; '.join(errors)}")
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Account ----

class AccountCreate(BaseModel):
    phone_number: str = Field(..., min_length=5, max_length=20)
    session_string: Optional[str] = None
    proxy_config: Optional[dict] = None


class AccountUpdate(BaseModel):
    session_string: Optional[str] = None
    proxy_config: Optional[dict] = None
    status: Optional[str] = None
    first_name: Optional[str] = None
    username: Optional[str] = None


class AccountOut(BaseModel):
    id: int
    phone_number: str
    status: str
    proxy_config: dict
    last_activity: Optional[datetime] = None
    flood_wait_until: Optional[datetime] = None
    ban_reason: Optional[str] = None
    trust_score: float
    daily_message_count: int
    created_at: datetime
    # Sprint-01 folder fields
    spamblock_until: Optional[datetime] = None
    health_check_at: Optional[datetime] = None
    health_score: Optional[int] = None
    dc_id: Optional[int] = None
    ping_ms: Optional[int] = None

    model_config = {"from_attributes": True}


class AccountHealth(BaseModel):
    account_id: int
    is_connected: bool
    is_banned: bool
    is_spamblocked: bool
    flood_wait_remaining: Optional[int] = None
    last_error: Optional[str] = None
    trust_score: float
    daily_messages_sent: int


class AccountHealthResult(BaseModel):
    account_id: int
    old_status: str
    new_status: str
    changed: bool
    ping_ms: Optional[int] = None
    dc_id: Optional[int] = None
    error: Optional[str] = None


class BulkHealthJob(BaseModel):
    job_id: str
    status: str  # pending|running|completed
    progress: int  # 0-100
    total: int = 0
    done: int = 0
    results: list[AccountHealthResult] = []


class BulkStatusUpdate(BaseModel):
    account_ids: list[int]
    status: str


# ---- Persona ----

class PersonaCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    personality_traits: Optional[dict] = {}
    writing_style: Optional[dict] = {}
    response_time_min: int = Field(default=30, ge=5)
    response_time_max: int = Field(default=300, ge=10)
    avatar_url: Optional[str] = None
    niche_tags: Optional[list[str]] = []
    tone: str = Field(default="casual", max_length=50)
    energy_level: float = Field(default=0.5, ge=0.0, le=1.0)
    humor_level: float = Field(default=0.3, ge=0.0, le=1.0)
    formality_level: float = Field(default=0.4, ge=0.0, le=1.0)
    soul_prompt: Optional[str] = None
    soul_prompt_data: Optional[dict] = {}
    group_prompts: Optional[dict] = {}
    telegram_account_id: Optional[int] = None
    assigned_group_ids: Optional[list[int]] = []
    webhook_url: Optional[str] = None
    webhook_headers: Optional[dict] = {}
    sheets_config: Optional[dict] = {}
    is_active: bool = True


class PersonaUpdate(BaseModel):
    name: Optional[str] = None
    personality_traits: Optional[dict] = None
    writing_style: Optional[dict] = None
    response_time_min: Optional[int] = None
    response_time_max: Optional[int] = None
    avatar_url: Optional[str] = None
    niche_tags: Optional[list[str]] = None
    tone: Optional[str] = None
    energy_level: Optional[float] = None
    humor_level: Optional[float] = None
    formality_level: Optional[float] = None
    soul_prompt: Optional[str] = None
    soul_prompt_data: Optional[dict] = None
    group_prompts: Optional[dict] = None
    telegram_account_id: Optional[int] = None
    assigned_group_ids: Optional[list[int]] = None
    webhook_url: Optional[str] = None
    webhook_headers: Optional[dict] = None
    sheets_config: Optional[dict] = None
    is_active: Optional[bool] = None


class PersonaOut(BaseModel):
    id: int
    name: str
    personality_traits: dict
    writing_style: dict
    response_time_min: int
    response_time_max: int
    avatar_url: Optional[str] = None
    niche_tags: list[str]
    tone: str
    energy_level: float
    humor_level: float
    formality_level: float
    soul_prompt: Optional[str] = None
    soul_prompt_data: dict
    group_prompts: dict
    version: int
    template_source: Optional[str] = None
    telegram_account_id: Optional[int] = None
    assigned_group_ids: list[int] = []
    webhook_url: Optional[str] = None
    webhook_headers: dict
    sheets_config: dict
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Campaign ----

class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    campaign_type: str = "engagement"
    config: Optional[dict] = {}
    target_groups: Optional[list[int]] = []
    allowed_hours: Optional[list[int]] = []
    timezone: str = "UTC"
    persona_ids: Optional[list[int]] = []


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    config: Optional[dict] = None
    target_groups: Optional[list[int]] = None
    allowed_hours: Optional[list[int]] = None
    persona_ids: Optional[list[int]] = None


class CampaignOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    campaign_type: str
    status: str
    config: dict
    target_groups: list[int]
    allowed_hours: list[int]
    timezone: str
    persona_ids: list[int]
    created_by: Optional[int] = None
    created_at: datetime
    started_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ---- Group ----

class GroupCreate(BaseModel):
    chat_id: int
    title: str
    group_type: str = "group"
    member_count: int = 0
    niche_tags: Optional[list[str]] = []
    language: Optional[str] = None


class GroupOut(BaseModel):
    id: int
    chat_id: int
    title: str
    group_type: str
    member_count: int
    niche_tags: list[str]
    language: Optional[str] = None
    safety_score: float
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Analytics ----

class MetricPoint(BaseModel):
    timestamp: datetime
    value: float


class EngagementScore(BaseModel):
    group_id: int
    score: float
    total_messages: int
    total_reactions: int
    total_views: int
    unique_participants: int


class ConversionFunnel(BaseModel):
    impressions: int
    engagements: int
    clicks: int
    joins: int
    active_members: int


class AnalyticsSummary(BaseModel):
    campaign_id: int
    engagement_score: float
    conversion_rate: float
    roi: float
    account_health_index: float
    metrics_history: dict[str, list[MetricPoint]]
    funnel: ConversionFunnel


# ---- Pagination ----

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


# ---- Spintax ----

class SpintaxTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    template_text: str = Field(..., min_length=1)
    tone: str = "casual"


class SpintaxTemplateOut(BaseModel):
    id: int
    name: str
    template_text: str
    tone: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SpintaxPreviewRequest(BaseModel):
    template: str
    count: int = 5


class SpintaxGenerateRequest(BaseModel):
    prompt: str
    tone: str = "casual"
    spin_count: int = 3
    persona_context: dict = {}


# ---- Subscription ----

from .subscription import (
    SubscriptionCreate, SubscriptionUpdate, SubscriptionOut,
    PLAN_TIERS, MODULE_CATEGORIES,
)


# ---- Blog (WordPress-style) ----

class BlogCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class BlogCategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BlogPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    slug: Optional[str] = None
    content: str = ""
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    status: str = "draft"
    category_id: Optional[int] = None
    tags: Optional[list[str]] = []
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    template: Optional[list] = None


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[str] = None
    category_id: Optional[int] = None
    tags: Optional[list[str]] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    template: Optional[list] = None


class BlogPostOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    status: str
    category_id: Optional[int] = None
    tags: list[str]
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    published_at: Optional[datetime] = None
    view_count: int
    template: Optional[list] = None
    created_at: datetime
    updated_at: datetime
    author_name: Optional[str] = None
    category_name: Optional[str] = None

    model_config = {"from_attributes": True}


class BlogAIDraftRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=300)
    tone: str = "professional"
    target_words: int = 800
    category: str = "General"


# ---- Partners (marketing page) ----

class PartnerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    img: str = Field(..., min_length=1, max_length=500)
    href: str = ""
    category: str = Field(..., pattern="^(proxies|browsers|sms)$")
    sort_order: int = 0


class PartnerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    img: Optional[str] = Field(None, min_length=1, max_length=500)
    href: Optional[str] = None
    category: Optional[str] = Field(None, pattern="^(proxies|browsers|sms)$")
    sort_order: Optional[int] = None


class PartnerOut(BaseModel):
    id: int
    name: str
    img: str
    href: str
    category: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
