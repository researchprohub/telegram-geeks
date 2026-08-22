"""Main FastAPI application entry point."""

import asyncio
import os
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.core.config import settings
from app.core.logging import setup_logging
from app.middleware.csrf import CSRFMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware
from app.exceptions import PlatformError, global_exception_handler, validation_exception_handler
from app.services.infrastructure import Infrastructure
from app.services.module_dispatcher import dispatcher

# Ensure all models are registered with Base (must precede endpoint imports)
from app.models.base import Base
from app.models import (
    User, Account, Campaign, CampaignTarget, TelegramGroup,
    Persona, SpintaxTemplate, Subscription, Order, Deposit,
    CampaignLogEntry, AuditLog, Alert, Proxy,
)
from app.db.session import engine, async_session_factory

# Import all endpoint routers directly
from app.api.v1.endpoints import (
    auth, accounts, personas, campaigns, groups, analytics,
    admin, payments, tdata_upload, modules, orchestration, advanced_analytics, tools, neuro_text, global_config,
    licenses,
    sms_providers, ip_analyzer, persona_memory, persona_analytics, persona_warmup,
    model_routing, persona_templates, persona_knowledge_base,
    registrar, spambot_remover, postbot,
    persona_emotions_endpoints, community_roles_endpoints, group_knowledge_endpoints,
    proxies,
    blog,
    partners,
)
from app.api.v1.endpoints.proxies import init_proxy_system
from app.core.security import hash_password


async def init_database():
    """Create tables and seed initial data."""
    async with engine.begin() as conn:
        from sqlalchemy import inspect
        import app.models  # Ensure all models are registered
        def get_tables(connection):
            return inspect(connection).get_table_names()
        tables = await conn.run_sync(get_tables)
        if not tables:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Empty database detected — created all tables (dev bootstrap)")
        else:
            logger.info(f"Database has {len(tables)} tables, skipping auto-create (use alembic)")

    # Seed demo and admin users — upsert so existing DBs get the desktop credentials
    from sqlalchemy import select
    seed_users = [
        ("demo@test.com", "demo123", "Demo User", "pro"),
        ("telegramgeekspro@atomicmail.io", "Blackhat2020@@@", "Super Admin", "admin"),
    ]
    async with async_session_factory() as session:
        for email, password, full_name, role in seed_users:
            result = await session.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            if user is None:
                user = User(email=email, full_name=full_name, role=role, is_active=True)
                session.add(user)
            user.hashed_password = hash_password(password)
            user.full_name = full_name
            user.role = role
            user.is_active = True
            logger.info(f"Seeded {email} / {password}")
        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    setup_logging()

    logger.info("Initializing database...")
    try:
        await init_database()
    except Exception as e:
        logger.warning(f"Database init failed: {e}")

    from telegram_layer.src.actions.global_config import GlobalConfigService
    global_config = GlobalConfigService()
    app.state.config_service = global_config

    logger.info("Initializing infrastructure...")

    try:
        infra = Infrastructure(
            config_service=global_config,
            telegram_api_id=settings.telegram_api_id,
            telegram_api_hash=settings.telegram_api_hash,
            session_storage_path=settings.session_storage_path,
            ai_provider=settings.default_ai_provider,
            ai_model=settings.default_ai_model,
            ai_routing_strategy=settings.ai_routing_strategy,
            openai_api_key=settings.openai_api_key,
            anthropic_api_key=settings.anthropic_api_key,
            groq_api_key=settings.groq_api_key,
            gemini_api_key=settings.gemini_api_key,
            deepseek_api_key=settings.deepseek_api_key,
            together_api_key=settings.together_api_key,
            sambanova_api_key=settings.sambanova_api_key,
            github_token=settings.github_token,
            cerebras_api_key=settings.cerebras_api_key,
            siliconflow_api_key=settings.siliconflow_api_key,
            nvidia_nim_api_key=settings.nvidia_nim_api_key,
            openrouter_api_key=settings.openrouter_api_key,
            cloudflare_api_token=settings.cloudflare_api_token,
            cloudflare_account_id=settings.cloudflare_account_id,
            mistral_api_key=settings.mistral_api_key,
            cohere_api_key=settings.cohere_api_key,
            huggingface_api_key=settings.huggingface_api_key,
            ollama_base_url=settings.ollama_base_url,
            sms_api_keys={},
        )
        # Wire infrastructure into dispatcher
        dispatcher.infrastructure = infra
        dispatcher._service_cache.clear()
        logger.info(f"Infrastructure ready: {infra.status()}")
        app.state.infrastructure = infra

        from app.services.orchestration_service import OrchestrationEngine, ConversationRouter
        app.state.orchestration_engine = OrchestrationEngine(
            client_manager=infra.client_manager, ai_engine=infra.ai_engine)
        app.state.conversation_router = ConversationRouter(
            client_manager=infra.client_manager, ai_engine=infra.ai_engine)
        logger.info("Orchestration engine and conversation router initialized")

        from app.services.campaign_executor import CampaignExecutor
        app.state.campaign_executor = CampaignExecutor(
            client_manager=infra.client_manager, ai_engine=infra.ai_engine)
        logger.info("Campaign executor initialized")

        # Wire AI engine into neuro_text singleton so API endpoints use real GPT
        from telegram_layer.src.actions.neuro_text import neuro_engine
        neuro_engine.gpt.ai_engine = infra.ai_engine
        logger.info("NeuroText AI engine wired")

        # Wire API keys into model_router so paid providers are available
        from telegram_layer.src.actions.model_routing import model_router
        model_router.api_keys = infra.ai_engine.api_keys
        logger.info("ModelRouter API keys wired")
    except Exception as e:
        logger.warning(f"Infrastructure init failed (degraded mode): {e}")
        app.state.infrastructure = None

    logger.info(f"ModuleDispatcher now has {len(dispatcher.available_modules)} modules available")

    # Initialize proxy system
    try:
        init_proxy_system(config_service=global_config)
        logger.info("Proxy system initialized (pool, hub, engine)")
    except Exception as e:
        logger.warning(f"Proxy system init failed: {e}")

    # Start background tasks
    bg_tasks = []

    async def _sub_expiry_loop():
        while True:
            try:
                from sqlalchemy import select
                from app.models import Subscription
                async with async_session_factory() as s:
                    now_dt = datetime.now(timezone.utc).replace(tzinfo=None)
                    result = await s.execute(
                        select(Subscription).where(
                            Subscription.status == "active",
                            Subscription.expires_at.isnot(None),
                            Subscription.expires_at <= now_dt,
                        )
                    )
                    expired = result.scalars().all()
                    for sub in expired:
                        sub.status = "expired"
                        user_r = await s.execute(select(User).where(User.id == sub.user_id))
                        user = user_r.scalar_one_or_none()
                        if user and user.role != "admin":
                            user.role = "operator"
                    await s.commit()
                    if expired:
                        logger.info(f"Subscription expiry: {len(expired)} expired")
            except Exception as e:
                logger.warning(f"Subscription expiry check error: {e}")
            await asyncio.sleep(3600)

    async def _health_loop():
        while True:
            try:
                from app.services.account_health import scheduled_health_check
                await scheduled_health_check(async_session_factory, interval_seconds=1800)
            except Exception as e:
                logger.warning(f"Health loop error: {e}")
            await asyncio.sleep(1800)

    async def _flood_resume_loop():
        while True:
            try:
                from app.services.flood_resume_service import resume_flood_accounts
                async with async_session_factory() as s:
                    await resume_flood_accounts(s)
            except Exception as e:
                logger.warning(f"Flood resume loop error: {e}")
            await asyncio.sleep(120)

    async def _postbot_scheduler_loop():
        """Check and publish due scheduled posts every 30s."""
        while True:
            try:
                svc = getattr(app.state, 'infrastructure', None)
                if svc:
                    postbot = getattr(svc, '_postbot_service', None) or svc._resolve_service("postbot")
                    if postbot and hasattr(postbot, 'publish_due_posts'):
                        n = await postbot.publish_due_posts()
                        if n:
                            logger.info(f"PostBot scheduler: published {n} due posts")
            except Exception as e:
                logger.warning(f"PostBot scheduler error: {e}")
            await asyncio.sleep(30)

    async def _proxy_health_loop():
        """Periodic proxy health check every 5 min."""
        while True:
            try:
                from app.api.v1.endpoints.proxies import _pool
                if _pool:
                    await _pool.run_health_checks()
            except Exception as e:
                logger.warning(f"Proxy health check error: {e}")
            await asyncio.sleep(300)

    task1 = asyncio.create_task(_sub_expiry_loop())
    task2 = asyncio.create_task(_health_loop())
    task3 = asyncio.create_task(_flood_resume_loop())
    task4 = asyncio.create_task(_postbot_scheduler_loop())
    task5 = asyncio.create_task(_proxy_health_loop())
    bg_tasks.extend([task1, task2, task3, task4, task5])
    logger.info("Background tasks started: sub expiry, health check, flood resume, postbot scheduler, proxy health")

    yield

    for t in bg_tasks:
        t.cancel()
    logger.info("Background tasks cancelled")

    # Cleanup on shutdown
    logger.info("Shutting down infrastructure...")
    infra = getattr(app.state, 'infrastructure', None)
    if infra and getattr(infra, 'client_manager', None):
        if hasattr(infra.client_manager, 'disconnect_all'):
            await infra.client_manager.disconnect_all()
    from app.core.redis_client import close_redis
    await close_redis()
    logger.info("Shutdown complete")


# Conditionally enable docs based on environment
docs_enabled = settings.enable_docs or settings.environment == "development"

app = FastAPI(
    title="Telegram Engagement Platform",
    description="AI-Powered Multi-Account Community Engagement for Telegram",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
)

# Global exception handlers
from fastapi.exceptions import RequestValidationError
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# CORS — allow browser requests from frontend
_cors = {"allow_origins": settings.cors_origins, "allow_credentials": True}
if settings.environment == "desktop":
    # Electron SPA origin differs from the API origin (file:// or 127.0.0.1:5173);
    # auth is Bearer-only (no cookies), so opening CORS is safe.
    _cors = {"allow_origins": ["*"], "allow_credentials": False}
app.add_middleware(
    CORSMiddleware,
    **_cors,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)

app.add_middleware(CSRFMiddleware)
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# Mount static file serving for uploads
import os
_static_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(_static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=_static_dir), name="static")


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    if settings.environment == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response

# Maintenance mode middleware
@app.middleware("http")
async def maintenance_middleware(request: Request, call_next):
    path = request.url.path
    if path.startswith("/api/") and not path.startswith(("/api/v1/auth/login", "/api/v1/admin/")):
        from app.db.session import async_session_factory
        from app.services.settings_service import SettingsService
        async with async_session_factory() as session:
            svc = SettingsService(session)
            mm = await svc.get("maintenance_mode")
            if mm == "true":
                from fastapi.responses import JSONResponse
                return JSONResponse(status_code=503, content={"detail": "Service temporarily unavailable — maintenance mode"})
    return await call_next(request)


# Catch-all OPTIONS handler for CORS preflight
@app.options("/{full_path:path}")
async def handle_options(full_path: str):
    """Handle CORS preflight requests for all routes."""
    from fastapi.responses import Response
    return Response(status_code=200)


@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
@app.get("/api/v1/health", tags=["System"])
async def health_check():
    """Health check endpoint with live DB and AI provider checks."""
    live_checks = {"database": False, "ai_providers": False}

    try:
        from app.db.session import async_session_factory
        from sqlalchemy import text
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        live_checks["database"] = True
    except Exception as e:
        live_checks["database_error"] = str(e)

    infra_status = {}
    if hasattr(app.state, 'infrastructure') and app.state.infrastructure:
        infra = app.state.infrastructure
        try:
            import asyncio
            result = await asyncio.wait_for(
                infra.ai_engine.generate("ping", system="respond with OK only", max_tokens=10),
                timeout=5,
            )
            live_checks["ai_providers"] = bool(result and "OK" in str(result))
        except asyncio.TimeoutError:
            live_checks["ai_providers_error"] = "timeout"
        except Exception as e:
            live_checks["ai_providers_error"] = str(e)
        infra_status = infra.status()

    all_ok = live_checks.get("database") and live_checks.get("ai_providers")
    status = "healthy" if all_ok else "degraded"

    return {
        "status": status,
        "version": "1.0.0",
        "checks": live_checks,
        "infrastructure": infra_status,
    }


# ─── Mount all endpoint routers directly ───────────────────────

# Authentication
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])

# Accounts
app.include_router(accounts.router, prefix="/api/v1/accounts", tags=["Accounts"])

# Personas
app.include_router(personas.router, prefix="/api/v1/personas", tags=["Personas"])

# Campaigns
app.include_router(campaigns.router, prefix="/api/v1/campaigns", tags=["Campaigns"])

# Groups
app.include_router(groups.router, prefix="/api/v1/groups", tags=["Groups"])

# Analytics
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])

# Modules
app.include_router(modules.router, prefix="/api/v1/modules", tags=["Modules"])

# Orchestration
app.include_router(orchestration.router, prefix="/api/v1/orchestration", tags=["Orchestration"])

# Advanced Analytics
app.include_router(advanced_analytics.router, prefix="/api/v1/advanced-analytics", tags=["Advanced Analytics"])

# TData Upload
app.include_router(tdata_upload.router, prefix="/api/v1", tags=["Account Upload"])

# Payments
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])

# Licenses (Key generator, HWID binding, and activation)
app.include_router(licenses.router, prefix="/api/v1/licenses", tags=["Licenses"])

# Admin
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])

# Tools (export TData, session+JSON)
app.include_router(tools.router, prefix="/api/v1/tools", tags=["Tools"])

# Neuro-Text Engine (spintax + GPT generation)
app.include_router(neuro_text.router, prefix="/api/v1/neuro-text", tags=["Neuro-Text"])
app.include_router(global_config.router, prefix="/api/v1", tags=["Global Config"])

# SMS Provider Hub
app.include_router(sms_providers.router, tags=["SMS Providers"])

# IP Intersection Analyzer
app.include_router(ip_analyzer.router, tags=["IP Analyzer"])

# Persona Memory System
app.include_router(persona_memory.router, tags=["Persona Memory"])

# Persona Analytics
app.include_router(persona_analytics.router, tags=["Persona Analytics"])

# Persona Warmup
app.include_router(persona_warmup.router, tags=["Persona Warmup"])

# Model Routing
app.include_router(model_routing.router, tags=["Model Routing"])

# Persona Templates
app.include_router(persona_templates.router, tags=["Persona Templates"])

# Persona Knowledge Base
app.include_router(persona_knowledge_base.router, tags=["Persona Knowledge Base"])

# Registrar (Flash Call, QR)
app.include_router(registrar.router)

# SpamBot Remover
app.include_router(spambot_remover.router)

# PostBot
app.include_router(postbot.router)

# Persona Emotions
app.include_router(persona_emotions_endpoints.router)

# Community Roles
app.include_router(community_roles_endpoints.router)

# Group Knowledge
app.include_router(group_knowledge_endpoints.router)

# Proxy Management
app.include_router(proxies.router)
from app.api.v1.endpoints import proxy_providers
app.include_router(proxy_providers.router)

# Blog (WordPress-style)
app.include_router(blog.router, prefix="/api/v1/blog", tags=["Blog"])

# Partners (marketing page)
app.include_router(partners.router, prefix="/api/v1", tags=["Partners"])
