from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models import User
from app.db.session import async_session_factory
from telegram_layer.src.proxy.pool import ProxyPool
from telegram_layer.src.proxy.provider_hub import ProxyProviderHub
from telegram_layer.src.proxy.assignment_engine import ProxyAssignmentEngine

router = APIRouter(prefix="/api/v1/proxies", tags=["Proxies"])

_pool: ProxyPool | None = None
_hub: ProxyProviderHub | None = None
_engine: ProxyAssignmentEngine | None = None


def init_proxy_system(config_service=None):
    global _pool, _hub, _engine
    if _pool is not None:
        return
    _hub = ProxyProviderHub()
    _hub.load_defaults()
    from app.db.session import async_session_factory
    _pool = ProxyPool(async_session_factory, config_service=config_service)
    _engine = ProxyAssignmentEngine(_pool, _hub)


def _ensure_init():
    if _pool is None:
        init_proxy_system()


# ─── Pool endpoints ──────────────────────────────────────────────


@router.get("/pool/stats")
async def pool_stats(user=Depends(get_current_user)):
    _ensure_init()
    return await _pool.get_stats()


@router.get("/pool/healthy")
async def pool_healthy(
    account_id: int = Query(...),
    country: str | None = Query(None),
    user=Depends(get_current_user),
):
    _ensure_init()
    proxy = await _pool.get_healthy_proxy(account_id, country)
    if proxy is None:
        raise HTTPException(status_code=404, detail="No healthy proxy available")
    return proxy


@router.post("/pool/check/{proxy_id}")
async def check_proxy(proxy_id: int, user=Depends(get_current_user)):
    _ensure_init()
    try:
        return await _pool.check_proxy(proxy_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/pool/release/{proxy_id}")
async def release_proxy(proxy_id: int, user=Depends(get_current_user)):
    _ensure_init()
    await _pool.release_proxy(proxy_id)
    return {"proxy_id": proxy_id, "released": True}


@router.post("/pool/health-check")
async def run_health_checks(user=Depends(get_current_user)):
    _ensure_init()
    await _pool.run_health_checks()
    return {"status": "health checks triggered"}


# ─── Providers endpoints ────────────────────────────────────────


@router.get("/providers")
async def list_providers(user=Depends(get_current_user)):
    _ensure_init()
    return {"providers": _hub.list_providers()}


@router.get("/providers/free")
async def free_providers(user=Depends(get_current_user)):
    _ensure_init()
    return {"providers": _hub.free_providers()}


@router.get("/providers/paid")
async def paid_providers(user=Depends(get_current_user)):
    _ensure_init()
    return {"providers": _hub.paid_providers()}


@router.get("/providers/{name}")
async def get_provider(name: str, user=Depends(get_current_user)):
    _ensure_init()
    cfg = _hub.get(name)
    if cfg is None:
        raise HTTPException(status_code=404, detail=f"Provider '{name}' not found")
    return cfg


@router.get("/providers/country/{code}")
async def providers_by_country(code: str, user=Depends(get_current_user)):
    _ensure_init()
    return {"country": code, "providers": _hub.get_by_country(code)}


# ─── Assignment endpoints ────────────────────────────────────────


class AssignRequest(BaseModel):
    country: str | None = None
    policy: dict | None = None


@router.post("/assign/{account_id}")
async def assign_proxy(account_id: int, body: AssignRequest, user=Depends(get_current_user)):
    _ensure_init()
    proxy = await _engine.assign_for_account(account_id, body.country, body.policy)
    if proxy is None:
        raise HTTPException(status_code=404, detail="No proxy available for assignment")
    return {"account_id": account_id, "proxy": proxy}


@router.post("/release/{account_id}")
async def release_account(account_id: int, user=Depends(get_current_user)):
    _ensure_init()
    await _engine.release_account(account_id)
    return {"account_id": account_id, "released": True}


@router.get("/assignments/{account_id}")
async def get_assignments(account_id: int, user=Depends(get_current_user)):
    _ensure_init()
    return {"account_id": account_id, "proxies": await _engine.get_account_proxies(account_id)}


@router.get("/assignments/stats")
async def assignment_stats(user=Depends(get_current_user)):
    _ensure_init()
    return await _engine.get_assignment_stats()


@router.post("/policy-check")
async def policy_check(user=Depends(get_current_user)):
    _ensure_init()
    await _engine.run_policy_checks()
    return {"status": "policy checks completed"}
