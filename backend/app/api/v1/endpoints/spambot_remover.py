from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional

from app.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/api/v1/spambot", tags=["SpamBot Remover"])

def _get_svc(request: Request):
    infra = getattr(request.app.state, "infrastructure", None)
    if not infra:
        raise HTTPException(status_code=503, detail="Infrastructure not initialized")
    svc = infra._resolve_service("spambot_remover")
    if not svc:
        raise HTTPException(status_code=503, detail="SpamBot Remover service unavailable")
    return svc

@router.get("/status/{phone}")
async def check_spam_status(phone: str, remover=Depends(_get_svc), _: User = Depends(get_current_user)):
    return await remover.check_spam_status(phone)

@router.post("/appeal")
async def submit_appeal(phone: str, strategy: str = "auto", remover=Depends(_get_svc), _: User = Depends(get_current_user)):
    return await remover.submit_appeal(phone, strategy)

@router.post("/remove")
async def remove_restrictions(phone: str, strategy: str = "auto", max_attempts: int = 3, remover=Depends(_get_svc), _: User = Depends(get_current_user)):
    return await remover.remove_restrictions(phone, strategy, max_attempts)

@router.post("/batch-remove")
async def batch_remove(phones: list[str], max_workers: int = 3, remover=Depends(_get_svc), _: User = Depends(get_current_user)):
    return await remover.batch_remove_restrictions(phones, max_workers)
