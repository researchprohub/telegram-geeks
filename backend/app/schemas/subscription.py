"""Subscription and plan management models."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SubscriptionCreate(BaseModel):
    user_id: int
    plan_tier: str = Field(..., pattern="^(starter|pro|agency)$")
    status: str = "active"
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False


class SubscriptionUpdate(BaseModel):
    plan_tier: Optional[str] = None
    status: Optional[str] = None
    cancel_at_period_end: Optional[bool] = None


class SubscriptionOut(BaseModel):
    id: int
    user_id: int
    plan_tier: str
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Plan Tier Definitions ──
# Based on competitive analysis vs Telegram Expert:
# Telegram Expert: Base $120/mo + individual modules $200-$1250 each
# Our approach: Bundle all modules into tiers for better value

PLAN_TIERS = {
    "starter": {
        "name": "Starter",
        "price_monthly": 29,
        "price_yearly": 290,
        "description": "Perfect for individuals getting started with Telegram automation",
        "modules": [
            # Original starter modules
            "converter", "booster", "mass_messaging", "autoreponder",
            "autoposting", "stories", "reactions", "message_editor",
            "invite_modules", "audience_collector", "contact_book",
            "mass_unsubscriber", "gender_detector",
            # NEW starter modules
            "mass_inspection", "account_folders", "open_dialogs",
            "parameter_generator", "proxy_checker", "views_boost",
            "anti_detection", "channel_comments", "postbot", "mass_subscriptions",
        ],
        "accounts_limit": 5,
        "campaigns_limit": 3,
        "groups_limit": 10,
        "ai_requests_per_day": 100,
        "features": [
            "All core modules",
            "Up to 5 accounts",
            "Up to 3 campaigns",
            "Basic analytics",
            "Email support",
        ],
    },
    "pro": {
        "name": "Pro",
        "price_monthly": 79,
        "price_yearly": 790,
        "description": "For serious marketers scaling their Telegram presence",
        "modules": [
            # Original pro modules
            "converter", "booster", "mass_messaging", "autoreponder",
            "autoposting", "stories", "reactions", "message_editor",
            "invite_modules", "audience_collector", "contact_book",
            "mass_unsubscriber", "gender_detector",
            "cloner", "interceptor", "forwarder",
            "bot_creator", "referrals", "reporter",
            "admin", "link_checker", "database_tools", "calculator_reports",
            "spambot_remover", "account_management", "number_checker",
            "json_generator", "duplicator", "registrar",
            # NEW pro modules
            "parameter_generator", "proxy_checker", "views_boost",
            "mass_subscriptions", "channel_comments", "postbot",
            "anti_detection", "global_search", "admin_chat_search",
            "create_chats",
        ],
        "accounts_limit": 25,
        "campaigns_limit": 20,
        "groups_limit": 100,
        "ai_requests_per_day": 1000,
        "features": [
            "All 44 modules unlocked",
            "Up to 25 accounts",
            "Up to 20 campaigns",
            "Advanced analytics & reports",
            "Priority support",
            "API access",
        ],
    },
    "agency": {
        "name": "Agency",
        "price_monthly": 199,
        "price_yearly": 1990,
        "description": "For agencies managing multiple clients at scale",
        "modules": [
            # All modules
            "converter", "booster", "mass_messaging", "autoreponder",
            "autoposting", "stories", "reactions", "message_editor",
            "invite_modules", "audience_collector", "contact_book",
            "mass_unsubscriber", "gender_detector",
            "cloner", "interceptor", "forwarder",
            "bot_creator", "referrals", "reporter",
            "admin", "link_checker", "database_tools", "calculator_reports",
            "spambot_remover", "account_management", "number_checker",
            "json_generator", "duplicator", "registrar",
            "mass_inspection", "account_folders", "parameter_generator",
            "proxy_checker", "views_boost", "mass_subscriptions",
            "channel_comments", "postbot", "anti_detection",
            "open_dialogs", "global_search", "admin_chat_search",
            "create_chats",
        ],
        "accounts_limit": -1,  # unlimited
        "campaigns_limit": -1,  # unlimited
        "groups_limit": -1,  # unlimited
        "ai_requests_per_day": -1,  # unlimited
        "features": [
            "Everything in Pro, plus:",
            "Unlimited accounts & campaigns",
            "White-label reports",
            "Team collaboration (up to 5 seats)",
            "Dedicated account manager",
            "Custom integrations",
            "SLA guarantee",
        ],
    },
}

# Module categories for easy reference
MODULE_CATEGORIES = {
    "account": ["converter", "booster", "registrar", "duplicator", "json_generator", "spambot_remover", "account_management", "number_checker", "mass_inspection", "parameter_generator", "proxy_checker", "account_folders"],
    "messaging": ["mass_messaging", "autoreponder", "autoposting", "stories", "reactions", "message_editor", "views_boost", "channel_comments", "postbot", "anti_detection"],
    "audience": ["invite_modules", "audience_collector", "contact_book", "mass_unsubscriber", "gender_detector", "mass_subscriptions", "open_dialogs"],
    "content": ["cloner", "interceptor", "forwarder"],
    "growth": ["bot_creator", "referrals", "reporter", "global_search", "admin_chat_search", "create_chats"],
    "admin": ["admin", "link_checker", "database_tools", "calculator_reports"],
}
