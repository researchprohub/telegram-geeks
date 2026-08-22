"""Parameter Generator API endpoints — Fingerprints, Presets, Exports, and Validation."""

from typing import Optional, List, Dict, Any, Literal
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field

from app.models import User
from app.dependencies import get_current_user
from app.services.parameter_generator import (
    ParameterGenerator,
    ANDROID_DEVICES,
    TELEGRAM_APP_VERSIONS,
    TELEGRAM_API_CREDENTIALS,
    COUNTRY_PROFILES,
)

router = APIRouter(prefix="/generator", tags=["Parameter Generator"])


class BeginnerGenerateRequest(BaseModel):
    count: int = Field(default=10, ge=1, le=10000)
    country: str = Field(default="US")
    gender: Literal["male", "female", "mixed"] = "mixed"


class ProfessionalGenerateRequest(BaseModel):
    count: int = Field(default=100, ge=1, le=50000)
    config: Dict[str, Any] = Field(default_factory=dict)


class ValidateParamsRequest(BaseModel):
    params: List[Dict[str, Any]]


@router.get("/presets")
async def get_presets(current_user: User = Depends(get_current_user)):
    """Returns available presets for devices, versions, countries, and API credentials."""
    return {
        "countries": [
            {"code": k, "prefix": v[0], "lang": v[1], "sys_lang": v[2]}
            for k, v in COUNTRY_PROFILES.items()
        ],
        "devices": [
            {"model": d[0], "android": d[1], "res": d[2]}
            for d in ANDROID_DEVICES
        ],
        "app_versions": TELEGRAM_APP_VERSIONS,
        "credentials_count": len(TELEGRAM_API_CREDENTIALS),
    }


@router.post("/beginner")
async def generate_beginner(
    payload: BeginnerGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generates simplified device fingerprints (Beginner mode)."""
    data = await ParameterGenerator.generate_beginner(
        count=payload.count,
        country=payload.country,
        gender=payload.gender,
    )
    return {
        "status": "success",
        "count": len(data),
        "mode": "beginner",
        "items": data,
    }


@router.post("/professional")
async def generate_professional(
    payload: ProfessionalGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generates customized device fingerprints (Professional mode)."""
    data = await ParameterGenerator.generate_professional(
        count=payload.count,
        config=payload.config,
    )
    return {
        "status": "success",
        "count": len(data),
        "mode": "professional",
        "items": data,
    }


@router.post("/export/json")
async def export_json(
    params: List[Dict[str, Any]] = Body(...),
    current_user: User = Depends(get_current_user),
):
    """Exports parameter records to session+json format."""
    exported = ParameterGenerator.export_as_json(params)
    return {"status": "success", "count": len(exported), "data": exported}


@router.post("/export/csv")
async def export_csv(
    params: List[Dict[str, Any]] = Body(...),
    current_user: User = Depends(get_current_user),
):
    """Exports parameter records as CSV string."""
    csv_str = ParameterGenerator.export_as_csv(params)
    return {"status": "success", "csv": csv_str}


@router.post("/validate")
async def validate_parameters(
    payload: ValidateParamsRequest,
    current_user: User = Depends(get_current_user),
):
    """Validates parameter records for correctness before session creation."""
    return ParameterGenerator.validate(payload.params)
