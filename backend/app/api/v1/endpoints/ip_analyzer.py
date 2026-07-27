"""IP Intersection Analyzer API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger

from app.dependencies import get_current_user
from app.models import User
try:
    from telegram_layer.src.actions.ip_analyzer import ip_analyzer
except ImportError:
    ip_analyzer = None

router = APIRouter(prefix="/api/v1/ip-analyzer", tags=["IP Analyzer"])


@router.post("/register")
async def register_ip(phone: str, ip: str, proxy: Optional[str] = None, country: Optional[str] = None, user: User = Depends(get_current_user)):
    ip_analyzer.register_account_ip(phone, ip, proxy, country)
    logger.info(f"IP {ip} registered for account {phone} by user {user.id}")
    return {"phone": phone, "ip": ip, "registered": True}


@router.get("/intersections")
async def get_intersections(min_accounts: int = 2, user: User = Depends(get_current_user)):
    return {"intersections": ip_analyzer.find_intersections(min_accounts)}


@router.get("/clusters")
async def get_clusters(min_size: int = 3, user: User = Depends(get_current_user)):
    return {"clusters": ip_analyzer.find_clusters(min_size)}


@router.get("/proxy-overlaps")
async def get_proxy_overlaps(user: User = Depends(get_current_user)):
    return {"overlaps": ip_analyzer.get_proxy_overlap()}


@router.get("/account/{phone}")
async def check_account(phone: str, user: User = Depends(get_current_user)):
    return ip_analyzer.check_account_risk(phone)


@router.get("/ip/{ip}")
async def get_ip_accounts(ip: str, user: User = Depends(get_current_user)):
    return {"ip": ip, "accounts": ip_analyzer.get_ip_accounts(ip)}


@router.delete("/account/{phone}")
async def remove_account(phone: str, user: User = Depends(get_current_user)):
    ip_analyzer.remove_account(phone)
    return {"phone": phone, "removed": True}


@router.get("/report")
async def get_report(user: User = Depends(get_current_user)):
    return ip_analyzer.export_report()
