"""GlobalConfig API — Centralized settings for proxy, delays, threads, GPT, license."""
import asyncio
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from loguru import logger
from app.dependencies import get_current_user
from app.models import User

router = APIRouter(tags=["Global Config"])


class ConfigUpdate(BaseModel):
    section: str
    key: str
    value: Any


class SectionUpdate(BaseModel):
    section: str
    data: dict


class LicenseUpdate(BaseModel):
    key: str


def _get_global_config():
    from telegram_layer.src.actions.global_config import GlobalConfigService
    return GlobalConfigService()


@router.get("/global-config", tags=["Global Config"])
async def get_config(user: User = Depends(get_current_user)):
    cfg = _get_global_config()
    return cfg.get_all()


USER_EDITABLE_SECTIONS = {"ai_providers", "gpt"}

@router.put("/global-config/section", tags=["Global Config"])
async def update_section(body: SectionUpdate, user: User = Depends(get_current_user)):
    if body.section not in USER_EDITABLE_SECTIONS and user.role not in ("admin", "pro"):
        raise HTTPException(403, "Only admin/pro can change global config")
    cfg = _get_global_config()
    cfg.update_section(body.section, body.data)
    return {"ok": True, "section": body.section}


@router.put("/global-config", tags=["Global Config"])
async def update_config(body: ConfigUpdate, user: User = Depends(get_current_user)):
    if body.section not in USER_EDITABLE_SECTIONS and user.role not in ("admin", "pro"):
        raise HTTPException(403, "Only admin/pro can change global config")
    cfg = _get_global_config()
    cfg.set(body.section, body.key, body.value)
    return {"ok": True, "section": body.section, "key": body.key}


@router.get("/global-config/license", tags=["Global Config"])
async def check_license_status(user: User = Depends(get_current_user)):
    cfg = _get_global_config()
    return cfg.check_license()


@router.post("/global-config/license", tags=["Global Config"])
async def set_license_key(body: LicenseUpdate, user: User = Depends(get_current_user)):
    if user.role not in ("admin", "pro"):
        raise HTTPException(403, "Only admin/pro can set license key")
    cfg = _get_global_config()
    result = cfg.set_license(body.key)
    return result


@router.get("/global-config/antivirus-warning", tags=["Global Config"])
async def antivirus_warning(user: User = Depends(get_current_user)):
    enabled = False
    if os.name == "nt":
        proc = await asyncio.create_subprocess_exec(
            "powershell", "-Command",
            "Get-MpComputerStatus | Select-Object -ExpandProperty RealTimeProtectionEnabled",
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL,
        )
        stdout, _ = await proc.communicate()
        defender = stdout.decode().strip() if stdout else ""
        enabled = defender == "True"
    cfg = _get_global_config()
    if enabled:
        cfg.set("antivirus", "last_warned", datetime.now(timezone.utc).isoformat())
    return {"microsoft_defender_enabled": enabled, "warning": "Disable Microsoft Defender for Telegram Expert Pro" if enabled else None}
