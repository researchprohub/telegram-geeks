"""Tools endpoints — TData export / session+JSON download, etc."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models import Account, User
from app.services.tdata_export import build_tdata_zip, build_session_json_zip

router = APIRouter(tags=["Tools"])


@router.post("/export-tdata")
async def export_tdata(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export selected accounts as TData ZIP download."""
    q = select(Account)
    if current_user.role != "admin":
        q = q.where(Account.user_id == current_user.id)
    if not body.get("select_all"):
        ids = body.get("account_ids", [])
        if not ids:
            raise HTTPException(400, "Provide account_ids or select_all=true")
        q = q.where(Account.id.in_(ids))

    result = await db.execute(q)
    accounts = list(result.scalars().all())

    buf = build_tdata_zip(accounts)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=accounts_tdata.zip"},
    )


@router.post("/export-session-json")
async def export_session_json(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export selected accounts as session+JSON ZIP download."""
    q = select(Account)
    if current_user.role != "admin":
        q = q.where(Account.user_id == current_user.id)
    if not body.get("select_all"):
        ids = body.get("account_ids", [])
        if not ids:
            raise HTTPException(400, "Provide account_ids or select_all=true")
        q = q.where(Account.id.in_(ids))

    result = await db.execute(q)
    accounts = list(result.scalars().all())

    buf = build_session_json_zip(accounts)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=accounts_session_json.zip"},
    )
