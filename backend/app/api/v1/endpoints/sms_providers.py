"""SMS Provider Hub API endpoints — admin provider config, balance, routing."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger

from app.dependencies import get_current_user
from app.models import User
from app.services.sms_provider_hub import hub, PROVIDER_REGISTRY

router = APIRouter(prefix="/api/v1/sms-providers", tags=["SMS Providers"])


@router.get("")
@router.get("/")
async def list_providers(user: User = Depends(get_current_user)):
    return hub.list_providers(user.id)


@router.get("/{provider_id}")
async def get_provider(provider_id: str, user: User = Depends(get_current_user)):
    info = hub.get_provider_info(provider_id)
    if not info:
        raise HTTPException(status_code=404, detail=f"Provider '{provider_id}' not found")
    return info


@router.get("/country/{country}")
async def get_providers_by_country(country: str, user: User = Depends(get_current_user)):
    return {"country": country, "providers": hub.get_providers_by_country(country)}


class ConfigRequest(BaseModel):
    api_key: str


@router.post("/{provider_id}/configure")
async def configure_provider(provider_id: str, body: ConfigRequest, user: User = Depends(get_current_user)):
    if provider_id not in PROVIDER_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Unknown provider '{provider_id}'")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can configure providers")
    hub.api_keys[provider_id] = body.api_key
    hub.health[provider_id].healthy = True
    logger.info(f"Provider {provider_id} configured by admin {user.id}")
    return {"provider": provider_id, "configured": True}


@router.post("/{provider_id}/deactivate")
async def deactivate_provider(provider_id: str, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can deactivate providers")
    hub.api_keys.pop(provider_id, None)
    hub.health[provider_id].healthy = False
    return {"provider": provider_id, "deactivated": True}


class PriorityRequest(BaseModel):
    priority_chain: list[str]


@router.put("/priority")
async def set_priority_chain(body: PriorityRequest, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can set global priority")
    hub.priority_chain = body.priority_chain
    return {"priority_chain": hub.priority_chain}


@router.put("/priority/me")
async def set_user_priority(body: PriorityRequest, user: User = Depends(get_current_user)):
    hub.set_user_priority(user.id, body.priority_chain)
    return {"priority_chain": body.priority_chain, "user_id": user.id}


@router.get("/status/health")
async def provider_health(user: User = Depends(get_current_user)):
    return hub.get_health_summary()


class PhoneRequest(BaseModel):
    provider: str = "5sim"
    country: str = "any"
    operator: str = "any"
    service: str = "telegram"
    voice_verification: bool = False


@router.post("/phone")
async def get_phone(body: PhoneRequest, user: User = Depends(get_current_user)):
    result = await hub.get_phone_with_fallback(
        country=body.country, operator=body.operator,
        service=body.service, voice_verification=body.voice_verification,
        user_id=user.id,
    )
    return result


@router.post("/phone/{provider_id}")
async def get_phone_from_provider(provider_id: str, body: PhoneRequest, user: User = Depends(get_current_user)):
    result = await hub.get_phone_number(
        provider_id, country=body.country, operator=body.operator,
        service=body.service, voice_verification=body.voice_verification,
        user_id=user.id,
    )
    return result


class SmsCodeRequest(BaseModel):
    phone: str
    provider: Optional[str] = None


@router.post("/code")
async def get_sms_code(body: SmsCodeRequest, user: User = Depends(get_current_user)):
    code = await hub.get_sms_code(body.phone, body.provider)
    return {"phone": body.phone, "code": code}


@router.post("/withdraw")
async def withdraw_number(body: SmsCodeRequest, user: User = Depends(get_current_user)):
    ok = await hub.withdraw_number(body.phone, body.provider)
    return {"phone": body.phone, "withdrawn": ok}
