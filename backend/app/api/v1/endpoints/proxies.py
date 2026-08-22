"""Proxies API endpoints — Pool testing, assignment, rotation, and import."""

from typing import Optional, List, Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, desc

from app.models import User, Proxy, ProxyStatus
from app.dependencies import get_current_user
from app.db.session import async_session_factory
from app.services.proxy_service import ProxyService

router = APIRouter(prefix="/proxies", tags=["Proxies"])


def init_proxy_system(config_service=None):
    """Compatibility initializer for proxy subsystem."""
    pass


class TestAllRequest(BaseModel):
    concurrency: int = Field(default=20, ge=1, le=100)


class AssignProxiesRequest(BaseModel):
    account_ids: List[str] = Field(default_factory=list)
    strategy: Literal["round_robin", "least_used", "geo_match", "random"] = "round_robin"


class BulkImportRequest(BaseModel):
    raw_text: str
    proxy_type: Literal["socks5", "socks4", "http"] = "socks5"


@router.get("/stats")
async def get_proxy_stats(current_user: User = Depends(get_current_user)):
    """Returns proxy pool statistics (alive, dead, avg latency, etc)."""
    return await ProxyService.get_stats()


@router.get("/")
async def list_proxies(
    status: Optional[str] = None,
    proxy_type: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
):
    """Lists proxies with optional filtering and pagination."""
    async with async_session_factory() as db:
        query = select(Proxy)
        if status:
            query = query.where(Proxy.status == status.lower())
        if proxy_type:
            query = query.where(Proxy.proxy_type == proxy_type.lower())

        total = (await db.execute(select(func.count(Proxy.id)))).scalar() or 0
        query = query.order_by(desc(Proxy.id)).offset(offset).limit(limit)
        result = await db.execute(query)
        proxies = result.scalars().all()

        return {
            "total": total,
            "items": [
                {
                    "id": p.id,
                    "host": p.host,
                    "port": p.port,
                    "username": p.username,
                    "proxy_type": p.proxy_type,
                    "status": p.status,
                    "latency_ms": p.latency_ms,
                    "fail_count": p.fail_count,
                    "country": p.country,
                    "last_checked": p.last_checked.isoformat() if p.last_checked else None,
                    "added_at": p.added_at.isoformat() if getattr(p, "added_at", None) else None,
                }
                for p in proxies
            ],
        }


@router.post("/test-all")
async def test_all_proxies(
    payload: TestAllRequest,
    current_user: User = Depends(get_current_user),
):
    """Tests all proxies concurrently against Telegram DC2."""
    return await ProxyService.test_all(concurrency=payload.concurrency)


@router.post("/assign")
async def assign_proxies(
    payload: AssignProxiesRequest,
    current_user: User = Depends(get_current_user),
):
    """Assigns alive proxies to accounts using the chosen strategy."""
    count = await ProxyService.assign_to_accounts(
        account_ids=payload.account_ids,
        strategy=payload.strategy,
    )
    return {
        "status": "success",
        "assigned_count": count,
        "strategy": payload.strategy,
    }


@router.post("/rotate/{account_id}")
async def rotate_account_proxy(
    account_id: str,
    current_user: User = Depends(get_current_user),
):
    """Rotates an account to a new alive proxy."""
    res = await ProxyService.rotate_proxy(account_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res


@router.post("/bulk-import")
async def bulk_import_proxies(
    payload: BulkImportRequest,
    current_user: User = Depends(get_current_user),
):
    """Bulk imports proxies from raw text."""
    return await ProxyService.bulk_import(
        raw_text=payload.raw_text,
        proxy_type=payload.proxy_type,
    )


@router.delete("/{proxy_id}")
async def delete_proxy(
    proxy_id: int,
    current_user: User = Depends(get_current_user),
):
    """Deletes a proxy by ID."""
    async with async_session_factory() as db:
        p = await db.get(Proxy, proxy_id)
        if not p:
            raise HTTPException(status_code=404, detail="Proxy not found")
        await db.delete(p)
        await db.commit()
    return {"status": "success", "message": f"Proxy {proxy_id} deleted"}
