"""SQLAlchemy ORM models."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    func,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
import uuid
import enum as std_enum
import re


def slugify(value: str) -> str:
    """URL-safe slug from a title (WP-style)."""
    value = str(value).strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "post"


class AccountStatus(std_enum.Enum):
    ACTIVE = "active"
    SPAMBLOCK_TEMP = "spamblock_temp"
    SPAMBLOCK_PERM = "spamblock_perm"
    FROZEN = "frozen"
    ARCHIVED = "archived"
    BANNED = "ban"
    SUSPENDED = "suspended"
    DELETED = "deleted"
    WARMING = "warming"


class CampaignStatus(std_enum.Enum):
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"


class UserRole(std_enum.Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"
    WRITER = "writer"


class CampaignType(std_enum.Enum):
    ENGAGEMENT = "engagement"
    INVITE = "invite"
    MESSAGING = "messaging"
    SOCIAL_PROOF = "social_proof"


# ─── Account ────────────────────────────────────────────────

class Account(Base, TimestampMixin):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    session_string: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="warming", server_default="warming")
    proxy_config: Mapped[dict] = mapped_column(JSON, default=dict, server_default=text("'{}'"))
    api_id: Mapped[int] = mapped_column(Integer, nullable=True)
    api_hash: Mapped[str] = mapped_column(String(64), nullable=True)
    last_activity: Mapped[datetime | None] = mapped_column(nullable=True)
    flood_wait_until: Mapped[datetime | None] = mapped_column(nullable=True)
    ban_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    trust_score: Mapped[float] = mapped_column(Float, default=0.0, server_default=text("0.0"))
    daily_message_count: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Sprint-01: Account Status Folder System
    spamblock_until: Mapped[datetime | None] = mapped_column(nullable=True)
    health_check_at: Mapped[datetime | None] = mapped_column(nullable=True)
    health_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dc_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ping_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Sprint-01: IP tracking for intersection analysis
    last_known_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    last_proxy: Mapped[str | None] = mapped_column(String(200), nullable=True)
    ip_country: Mapped[str | None] = mapped_column(String(100), nullable=True)

    conversations: Mapped[list["Conversation"]] = relationship(back_populates="account")
    campaign_accounts: Mapped[list["CampaignAccount"]] = relationship(back_populates="account")

    __table_args__ = (
        UniqueConstraint("phone_number"),
    )


# ─── Persona ────────────────────────────────────────────────

class Persona(Base, TimestampMixin):
    __tablename__ = "personas"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    personality_traits: Mapped[dict] = mapped_column(JSON, default=dict, server_default=text("'{}'"))
    writing_style: Mapped[dict] = mapped_column(JSON, default=dict, server_default=text("'{}'"))
    response_time_min: Mapped[int] = mapped_column(Integer, default=30, server_default=text("30"))
    response_time_max: Mapped[int] = mapped_column(Integer, default=300, server_default=text("300"))
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    niche_tags: Mapped[list[str]] = mapped_column(JSON, default=list, server_default=text("'[]'"))
    tone: Mapped[str] = mapped_column(String(50), default="casual", server_default="casual")
    energy_level: Mapped[float] = mapped_column(Float, default=0.5, server_default=text("0.5"))
    humor_level: Mapped[float] = mapped_column(Float, default=0.3, server_default=text("0.3"))
    formality_level: Mapped[float] = mapped_column(Float, default=0.4, server_default=text("0.4"))

    # Sprint-01: Soul Prompt (Layer 0) — core identity prompt
    soul_prompt: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    soul_prompt_data: Mapped[dict] = mapped_column(JSON, default=dict, server_default=text("'{}'"))

    # Sprint-01: Group prompts — per-group context overrides
    group_prompts: Mapped[dict] = mapped_column(JSON, default=dict, server_default=text("'{}'"))

    # Sprint-01: Persona versioning
    version: Mapped[int] = mapped_column(Integer, default=1, server_default=text("1"))
    template_source: Mapped[str | None] = mapped_column(String(100), nullable=True)  # template_id or "custom"

    # Sprint-02: Telegram account assignment
    telegram_account_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)

    # Sprint-02: Assigned Telegram groups (list of group ids)
    assigned_group_ids: Mapped[list[int]] = mapped_column(JSON, default=list, server_default=text("'[]'"))

    # Sprint-02: Webhook posting for generated content
    webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    webhook_headers: Mapped[dict] = mapped_column(JSON, default=dict, server_default=text("'{}'"))

    # Sprint-02: Google Sheets integration config
    sheets_config: Mapped[dict] = mapped_column(JSON, default=dict, server_default=text("'{}'"))

    # Sprint-02: Active toggle
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))

    conversations: Mapped[list["Conversation"]] = relationship(back_populates="persona")


# ─── User ───────────────────────────────────────────────────

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="operator", server_default="operator")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    last_login: Mapped[datetime | None] = mapped_column(nullable=True)

    campaigns: Mapped[list["Campaign"]] = relationship(
        back_populates="created_by_user",
        foreign_keys="[Campaign.created_by]",
    )
    groups: Mapped[list["TelegramGroup"]] = relationship(
        back_populates="owner",
        foreign_keys="[TelegramGroup.user_id]",
    )


# ─── Group / Channel ────────────────────────────────────────

class TelegramGroup(Base, TimestampMixin):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    chat_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    group_type: Mapped[str] = mapped_column(String(20), default="group", server_default="group")
    member_count: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    niche_tags: Mapped[list[str]] = mapped_column(JSON, default=list, server_default=text("'[]'"))
    language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    last_activity: Mapped[datetime | None] = mapped_column(nullable=True)
    safety_score: Mapped[float] = mapped_column(Float, default=100.0, server_default=text("100.0"))
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)

    campaign_targets: Mapped[list["CampaignTarget"]] = relationship(back_populates="group")
    owner: Mapped["User"] = relationship(back_populates="groups", foreign_keys=[user_id])


# ─── Campaign ───────────────────────────────────────────────

class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    campaign_type: Mapped[str] = mapped_column(String(20), default="engagement", server_default="engagement")
    status: Mapped[str] = mapped_column(String(20), default="draft", server_default="draft")
    config: Mapped[dict] = mapped_column(JSON, default=dict, server_default=text("'{}'"))
    target_groups: Mapped[list[int]] = mapped_column(JSON, default=list, server_default=text("'[]'"))
    allowed_hours: Mapped[list[int]] = mapped_column(JSON, default=list, server_default=text("'[]'"))
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", server_default="UTC")
    persona_ids: Mapped[list[int]] = mapped_column(JSON, default=list, server_default=text("'[]'"))
    # created_by is the FK for the User.campaigns relationship
    created_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by_user: Mapped["User"] = relationship(
        back_populates="campaigns",
        foreign_keys=[created_by],
    )
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="campaign")
    targets: Mapped[list["CampaignTarget"]] = relationship(back_populates="campaign")
    analytics_records: Mapped[list["AnalyticsRecord"]] = relationship(back_populates="campaign")
    campaign_accounts: Mapped[list["CampaignAccount"]] = relationship(back_populates="campaign")


class CampaignAccount(Base):
    """Association table: Campaign <-> Account"""
    __tablename__ = "campaign_accounts"

    campaign_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, primary_key=True
    )
    account_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, primary_key=True
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    campaign: Mapped["Campaign"] = relationship(back_populates="campaign_accounts")
    account: Mapped["Account"] = relationship(back_populates="campaign_accounts")


class CampaignTarget(Base):
    """Association table: Campaign <-> Group"""
    __tablename__ = "campaign_targets"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    campaign: Mapped["Campaign"] = relationship(back_populates="targets")
    group: Mapped["TelegramGroup"] = relationship(back_populates="campaign_targets")


# ─── Conversation ───────────────────────────────────────────

class Conversation(Base, TimestampMixin):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    group_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    message_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    thread_parent_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    persona_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("personas.id", ondelete="SET NULL"), nullable=True)
    account_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    response_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_model_used: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    campaign: Mapped["Campaign"] = relationship(back_populates="conversations")
    persona: Mapped["Persona"] = relationship(back_populates="conversations")
    account: Mapped["Account"] = relationship(back_populates="conversations")


# ─── Analytics ──────────────────────────────────────────────

class AnalyticsRecord(Base):
    __tablename__ = "analytics"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("campaigns.id"), nullable=True)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    metric_value: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    period: Mapped[str] = mapped_column(String(20), default="hourly", server_default="hourly")

    campaign: Mapped["Campaign"] = relationship(back_populates="analytics_records")


# ─── Spintax Template ──────────────────────────────────────

class SpintaxTemplate(Base, TimestampMixin):
    """Saved spintax template for reuse."""
    __tablename__ = "spintax_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    template_text: Mapped[str] = mapped_column(Text, nullable=False)
    tone: Mapped[str] = mapped_column(String(50), default="casual", server_default="casual")


# ─── Event Log ──────────────────────────────────────────────

class SystemSetting(Base):
    """Key-value system settings."""
    __tablename__ = "system_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class EventLog(Base, TimestampMixin):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    event_data: Mapped[dict] = mapped_column(JSON, default=dict, server_default=text("'{}'"))
    account_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    group_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    processed: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))


class Subscription(Base, TimestampMixin):
    """User subscription/plan."""
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_tier: Mapped[str] = mapped_column(String(20), default="starter", server_default="starter")
    status: Mapped[str] = mapped_column(String(20), default="active", server_default="active")
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    billing_cycle: Mapped[str] = mapped_column(String(10), default="monthly", server_default="monthly")
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    max_accounts: Mapped[int] = mapped_column(Integer, default=5, server_default=text("5"))
    max_campaigns: Mapped[int] = mapped_column(Integer, default=3, server_default=text("3"))
    team_seats: Mapped[int] = mapped_column(Integer, default=1, server_default=text("1"))


class ModuleAccess(Base, TimestampMixin):
    """Per-module add-on subscription (separate from the base plan)."""
    __tablename__ = "module_access"
    __table_args__ = (UniqueConstraint("user_id", "module_id", name="uq_user_module"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    module_id: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", server_default="active")
    starts_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)


class Order(Base, TimestampMixin):
    """Payment order."""
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    order_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", server_default="USD")
    crypto_currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    crypto_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    gateway: Mapped[str] = mapped_column(String(20), default="nowpayments", server_default="nowpayments")
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    plan_tier: Mapped[str | None] = mapped_column(String(20), nullable=True)
    billing_cycle: Mapped[str | None] = mapped_column(String(10), nullable=True)
    gateway_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tx_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True)
    processed: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))


class CampaignLogEntry(Base, TimestampMixin):
    """Per-message delivery log for campaign executions."""
    __tablename__ = "campaign_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    account_id: Mapped[int] = mapped_column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    group_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    action: Mapped[str] = mapped_column(String(30), nullable=False)  # sent, reacted, invited, boosted, failed
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")  # pending, sent, failed
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class AuditLog(Base):
    """Admin audit trail for sensitive operations."""
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Alert(Base, TimestampMixin):
    """System alerts for admin notifications."""
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)  # health_drop, flood_spike, ban, system
    severity: Mapped[str] = mapped_column(String(10), default="info", server_default="info")  # info, warning, critical
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=True)
    data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    acknowledged_at: Mapped[datetime | None] = mapped_column(nullable=True)
    acknowledged_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class Deposit(Base, TimestampMixin):
    """Manual crypto deposit request."""
    __tablename__ = "deposits"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    address: Mapped[str] = mapped_column(String(128), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    network: Mapped[str] = mapped_column(String(20), nullable=True)
    expected_amount: Mapped[float] = mapped_column(Float, nullable=False)
    received_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    tx_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    confirmations: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    confirmed_at: Mapped[datetime | None] = mapped_column(nullable=True)


# ─── Blog (WordPress-style) ──────────────────────────────────

class BlogCategory(Base, TimestampMixin):
    """Blog post category (WP-style taxonomy)."""
    __tablename__ = "blog_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    posts: Mapped[list["BlogPost"]] = relationship(back_populates="category")


class BlogPost(Base, TimestampMixin):
    __tablename__ = "blog_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    content: Mapped[str] = mapped_column(Text, default="")
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", server_default="draft")  # draft | publish
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("blog_categories.id", ondelete="SET NULL"), nullable=True)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list, server_default=text("'[]'"))
    # SEO fields
    seo_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(300), nullable=True)
    seo_keywords: Mapped[str | None] = mapped_column(String(300), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(nullable=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    # Elementor-style single-post template: ordered list of enabled sections/widgets.
    template: Mapped[list | None] = mapped_column(JSON, nullable=True)

    category: Mapped["BlogCategory | None"] = relationship(back_populates="posts")


class Proxy(Base, TimestampMixin):
    __tablename__ = "proxies"

    id: Mapped[int] = mapped_column(primary_key=True)
    provider: Mapped[str] = mapped_column(String(50), default="manual", server_default="manual")
    proxy_type: Mapped[str] = mapped_column(String(10), default="socks5", server_default="socks5")
    host: Mapped[str] = mapped_column(String(100))
    port: Mapped[int] = mapped_column(Integer)
    username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    password: Mapped[str | None] = mapped_column(String(200), nullable=True)
    country: Mapped[str | None] = mapped_column(String(4), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="untested", server_default="untested")
    last_checked: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    success_count: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    fail_count: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    allocated_to_account_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    allocated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    source: Mapped[str] = mapped_column(String(30), default="user_added", server_default="user_added")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Partner(Base, TimestampMixin):
    """Marketing partners page entry (name/logo/link/category)."""
    __tablename__ = "partners"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    img: Mapped[str] = mapped_column(String(500), nullable=False)
    href: Mapped[str] = mapped_column(String(500), default="", server_default="")
    category: Mapped[str] = mapped_column(String(20), nullable=False)  # proxies | browsers | sms
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
