"""API v1 router — wires all endpoints including 45 module operations."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, accounts, personas, campaigns, groups, analytics,
    admin, payments, tdata_upload, modules, orchestration, advanced_analytics, tools, neuro_text, global_config,
)

api_router = APIRouter(redirect_slashes=False)

# Core
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["Accounts"])
api_router.include_router(personas.router, prefix="/personas", tags=["Personas"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["Campaigns"])
api_router.include_router(groups.router, prefix="/groups", tags=["Groups"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

# Telegram Expert modules
api_router.include_router(modules.router, tags=["Modules"])

# Multi-account orchestration (key differentiator)
api_router.include_router(orchestration.router, prefix="/orchestration", tags=["Orchestration"])

# Advanced analytics
api_router.include_router(advanced_analytics.router, prefix="/advanced-analytics", tags=["Advanced Analytics"])

# Account import (TData)
api_router.include_router(tdata_upload.router, prefix="/accounts/upload", tags=["Account Upload"])

# Payments (admin-managed)
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])

# Admin dashboard
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

# Tools (export TData, session+JSON)
api_router.include_router(tools.router, prefix="/tools", tags=["Tools"])

# Neuro-Text Engine
api_router.include_router(neuro_text.router, prefix="/neuro-text", tags=["Neuro-Text"])

# Global Config (proxy, delays, threads, GPT, license)
api_router.include_router(global_config.router, tags=["Global Config"])
