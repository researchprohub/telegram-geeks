from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional

from app.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/api/v1/registrar", tags=["Registrar"])

def _get_registrar(request: Request):
    infra = getattr(request.app.state, "infrastructure", None)
    if not infra:
        raise HTTPException(status_code=503, detail="Infrastructure not initialized")
    svc = infra._resolve_service("registrar")
    if not svc:
        raise HTTPException(status_code=503, detail="Registrar service unavailable")
    return svc

@router.post("/register")
async def register_account(
    sms_provider: str = "5sim", country: str = "any",
    operator: str = "any", voice_verification: bool = False,
    anti_safety: bool = False,
    registrar=Depends(_get_registrar), _: User = Depends(get_current_user),
):
    return await registrar.register_account(sms_provider, country, operator, voice_verification, anti_safety)

@router.post("/flash-call")
async def request_flash_call(
    phone: str, provider: Optional[str] = None,
    registrar=Depends(_get_registrar), _: User = Depends(get_current_user),
):
    return await registrar.request_flash_call(phone, provider)

@router.post("/flash-call/complete")
async def complete_flash_call(
    phone: str, incoming_number: str,
    registrar=Depends(_get_registrar), _: User = Depends(get_current_user),
):
    return await registrar.complete_flash_call_registration(phone, incoming_number)

@router.post("/qr")
async def request_qr(
    cloud_password: Optional[str] = None,
    registrar=Depends(_get_registrar), _: User = Depends(get_current_user),
):
    return await registrar.request_qr_registration(cloud_password)

@router.get("/voice-compatibility")
async def check_voice(sms_provider: str, registrar=Depends(_get_registrar), _: User = Depends(get_current_user)):
    return registrar.check_voice_verification_compatibility(sms_provider)
