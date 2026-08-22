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


# ─── CRUD & List endpoints ──────────────────────────────────────


class ProxyCreate(BaseModel):
    host: str
    port: int
    proxy_type: str = "socks5"
    username: Optional[str] = None
    password: Optional[str] = None
    country: Optional[str] = None
    provider: str = "manual"


class ProxyBulkCreate(BaseModel):
    proxies_text: str
    proxy_type: str = "socks5"


@router.get("/")
@router.get("")
async def list_proxies(user=Depends(get_current_user)):
    _ensure_init()
    from sqlalchemy import select
    from app.models import Proxy
    async with async_session_factory() as session:
        result = await session.execute(select(Proxy).order_by(Proxy.id.desc()))
        proxies = result.scalars().all()
        return {
            "total": len(proxies),
            "proxies": [
                {
                    "id": p.id,
                    "host": p.host,
                    "port": p.port,
                    "proxy_type": p.proxy_type,
                    "username": p.username,
                    "country": p.country,
                    "status": p.status,
                    "response_time_ms": p.response_time_ms,
                    "allocated_to_account_id": p.allocated_to_account_id,
                    "provider": p.provider,
                }
                for p in proxies
            ],
        }


@router.post("/")
@router.post("")
async def create_proxy(body: ProxyCreate, user=Depends(get_current_user)):
    _ensure_init()
    from app.models import Proxy
    async with async_session_factory() as session:
        p = Proxy(
            host=body.host.strip(),
            port=int(body.port),
            proxy_type=body.proxy_type.strip().lower(),
            username=body.username.strip() if body.username else None,
            password=body.password.strip() if body.password else None,
            country=body.country.strip().upper() if body.country else None,
            provider=body.provider,
            status="untested",
        )
        session.add(p)
        await session.commit()
        await session.refresh(p)
        return {"id": p.id, "host": p.host, "port": p.port, "status": p.status}


@router.delete("/{proxy_id}")
async def delete_proxy(proxy_id: int, user=Depends(get_current_user)):
    _ensure_init()
    from sqlalchemy import select, delete
    from app.models import Proxy
    async with async_session_factory() as session:
        await session.execute(delete(Proxy).where(Proxy.id == proxy_id))
        await session.commit()
        return {"deleted": True, "proxy_id": proxy_id}


@router.post("/bulk")
async def bulk_import_proxies(body: ProxyBulkCreate, user=Depends(get_current_user)):
    _ensure_init()
    from app.models import Proxy
    lines = [line.strip() for line in body.proxies_text.splitlines() if line.strip()]
    created = 0
    async with async_session_factory() as session:
        for line in lines:
            try:
                # Support formats:
                # 1. socks5://user:pass@host:port or http://user:pass@host:port
                # 2. host:port:user:pass
                # 3. host:port
                proxy_type = body.proxy_type
                host, port, user_str, pass_str = "", 0, None, None
                if "://" in line:
                    from urllib.parse import urlparse
                    parsed = urlparse(line)
                    proxy_type = parsed.scheme or body.proxy_type
                    host = parsed.hostname or ""
                    port = parsed.port or 1080
                    user_str = parsed.username
                    pass_str = parsed.password
                else:
                    parts = line.split(":")
                    if len(parts) >= 4:
                        host, port_str, user_str, pass_str = parts[0], parts[1], parts[2], parts[3]
                        port = int(port_str)
                    elif len(parts) >= 2:
                        host, port_str = parts[0], parts[1]
                        port = int(port_str)
                if host and port:
                    p = Proxy(
                        host=host,
                        port=port,
                        proxy_type=proxy_type.lower(),
                        username=user_str,
                        password=pass_str,
                        status="untested",
                    )
                    session.add(p)
                    created += 1
            except Exception:
                continue
        await session.commit()
    return {"created": created, "total_lines": len(lines)}


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
