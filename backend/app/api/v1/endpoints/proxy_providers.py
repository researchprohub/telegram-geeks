# =============================================================================
# backend/app/api/v1/endpoints/proxy_providers.py
# REST API for managing rotating proxy providers with crypto billing
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel, Field
from typing import Optional
from app.dependencies import get_current_user
from app.models import User
from app.services.proxy_hub_orchestrator import proxy_hub
from app.services.proxy_provider_hub import (
    ProviderCredentials, ProxyProvider, ProxyType,
    ProxyProtocol, RotationMode
)

router = APIRouter(prefix="/api/v1/proxy-providers", tags=["Proxy Providers"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class RegisterProviderRequest(BaseModel):
    provider:         ProxyProvider
    api_key:          Optional[str] = None
    username:         Optional[str] = None
    password:         Optional[str] = None
    customer_id:      Optional[str] = None
    zone_name:        Optional[str] = None
    plan_type:        ProxyType     = ProxyType.RESIDENTIAL
    monthly_gb_limit: Optional[float] = None


class GetProxyRequest(BaseModel):
    account_id:    str
    telegram_dc:   int            = Field(default=2, ge=1, le=5)
    country:       Optional[str]  = None
    city:          Optional[str]  = None
    proxy_type:    ProxyType      = ProxyType.RESIDENTIAL
    protocol:      ProxyProtocol  = ProxyProtocol.SOCKS5
    rotation_mode: RotationMode   = RotationMode.STICKY_30M
    provider:      Optional[ProxyProvider] = None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/catalog")
async def list_all_providers(user: User = Depends(get_current_user)):
    """List all 14 supported providers with their specs and registration status."""
    return {"providers": proxy_hub.get_provider_catalog()}


@router.post("/register")
async def register_provider(
    body: RegisterProviderRequest,
    user: User = Depends(get_current_user),
):
    """Register a proxy provider with API credentials."""
    credentials = ProviderCredentials(
        provider=body.provider,
        api_key=body.api_key,
        username=body.username,
        password=body.password,
        customer_id=body.customer_id,
        zone_name=body.zone_name,
        plan_type=body.plan_type,
        monthly_gb_limit=body.monthly_gb_limit,
    )
    try:
        proxy_hub.register_provider(credentials)
        return {"status": "registered", "provider": body.provider.value}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/get-proxy")
async def get_proxy(
    body: GetProxyRequest,
    user: User = Depends(get_current_user),
):
    """Request a working proxy for a specific Telegram account + DC combination."""
    proxy = await proxy_hub.get_proxy_for_account(
        account_id=body.account_id,
        telegram_dc=body.telegram_dc,
        country=body.country,
        city=body.city,
        proxy_type=body.proxy_type,
        protocol=body.protocol,
        rotation_mode=body.rotation_mode,
        provider_id=body.provider,
    )
    if not proxy:
        raise HTTPException(status_code=503, detail="No healthy proxy available across all providers")
    return proxy.to_dict()


@router.get("/health-sweep")
async def run_health_sweep(user: User = Depends(get_current_user)):
    """Run a health check across all registered proxy providers."""
    results = await proxy_hub.bulk_health_sweep()
    return {"health": results}


@router.get("/usage-stats")
async def get_usage_stats(user: User = Depends(get_current_user)):
    """Pull bandwidth usage from all registered providers."""
    stats = await proxy_hub.get_all_usage_stats()
    return {"usage": stats}


@router.get("/dc-map")
async def get_dc_map(user: User = Depends(get_current_user)):
    """Return the Telegram DC → optimal proxy country mapping."""
    return {"dc_geo_map": proxy_hub.DC_GEO_MAP}
