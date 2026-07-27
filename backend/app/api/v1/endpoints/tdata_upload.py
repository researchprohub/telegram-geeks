"""TData Account Upload API endpoints."""

import os
import tempfile
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models import User
from app.services.tdata_uploader import TDataUploaderService

router = APIRouter(tags=["Account Upload"])

tdata_uploader = TDataUploaderService()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ZIP_MAGIC = b"PK\x03\x04"


class UploadResult(BaseModel):
    uploaded: int
    failed: int
    accounts: List[dict]
    errors: List[str]


class BulkUploadResult(BaseModel):
    total_files: int
    total_accounts: int
    successful: int
    failed: int
    details: List[dict]


class ValidateTDataRequest(BaseModel):
    tdata_dir: str = Field(..., description="Path to TData folder")


def _validate_zip_header(file: UploadFile) -> None:
    """Validate that the uploaded file is actually a ZIP archive."""
    # Peek at the first 4 bytes for ZIP magic signature
    header = file.file.read(4)
    file.file.seek(0)  # Reset pointer for later reading

    if len(header) < 4 or header != ZIP_MAGIC:
        raise HTTPException(
            status_code=400,
            detail="Invalid file: not a valid ZIP archive (missing PK\\x03\\x04 magic bytes)",
        )


@router.post("/single", response_model=UploadResult)
async def upload_single_tdata(
    file: UploadFile = File(..., description="TData ZIP file or extracted folder"),
    api_id: int = Form(...),
    api_hash: str = Form(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a single TData ZIP file containing Telegram Desktop Portable accounts.

    The ZIP should contain:
    - data/sessions/*.session (session string files)
    - data/config.json (optional, with api_id/api_hash)
    """
    # Content-type validation
    if file.content_type and not file.content_type.startswith("application/zip"):
        raise HTTPException(
            status_code=400,
            detail="Only ZIP files are supported (content-type must be application/zip)",
        )

    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files are supported")

    # Read content and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {len(content) / (1024*1024):.1f}MB exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit",
        )

    # Magic byte validation
    import io
    file_like = io.BytesIO(content)
    peeked = file_like.read(4)
    file_like.seek(0)
    if peeked != ZIP_MAGIC:
        raise HTTPException(
            status_code=400,
            detail="Invalid file: not a valid ZIP archive (missing PK\\x03\\x04 magic bytes)",
        )

    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = await tdata_uploader.upload_tdata_folder(tmp_path, user.id, api_id, api_hash)
        return result
    finally:
        os.unlink(tmp_path)


@router.post("/bulk", response_model=BulkUploadResult)
async def bulk_upload_tdata(
    files: List[UploadFile] = File(..., description="Multiple TData ZIP files"),
    api_id: int = Form(...),
    api_hash: str = Form(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Bulk upload multiple TData ZIP files.

    Each ZIP file can contain multiple session files.
    """
    temp_files = []

    for file in files:
        if not file.filename.endswith(".zip"):
            continue

        # Content-type validation
        if file.content_type and not file.content_type.startswith("application/zip"):
            continue

        # Read and validate size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            logger.warning(f"Bulk upload: file {file.filename} exceeds 50MB, skipping")
            continue

        # Magic byte validation
        if len(content) >= 4 and content[:4] != ZIP_MAGIC:
            logger.warning(f"Bulk upload: file {file.filename} is not a valid ZIP, skipping")
            continue

        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
            tmp.write(content)
            temp_files.append(tmp.name)

    try:
        result = await tdata_uploader.bulk_import_tdata(temp_files, user.id, api_id, api_hash)
        return result
    finally:
        for tmp in temp_files:
            os.unlink(tmp)


@router.post("/validate")
async def validate_tdata_structure(
    tdata_dir: str = Form(...),
):
    """Validate TData folder structure before upload."""
    result = await tdata_uploader.validate_tdata_structure(tdata_dir)
    return result


@router.get("/upload-history")
async def get_upload_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get upload history for the current user."""
    return {
        "uploads": [],
        "total_accounts_imported": 0,
    }
