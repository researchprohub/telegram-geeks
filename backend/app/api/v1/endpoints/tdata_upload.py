"""TData Account Upload API endpoints."""

import os
import tempfile
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models import User, Account
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


from fastapi import BackgroundTasks

@router.post("/bulk", response_model=BulkUploadResult)
async def bulk_upload_tdata(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="Multiple TData ZIP files"),
    api_id: int = Form(...),
    api_hash: str = Form(...),
    custom_first_name: Optional[str] = Form(None),
    custom_username: Optional[str] = Form(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Bulk upload multiple TData ZIP files.

    Each ZIP file can contain multiple session files.
    """
    temp_files = []
    skipped_files = []

    logger.info(f"Bulk TData upload: received {len(files)} file(s) from user {user.id}")

    for file in files:
        logger.info(f"Bulk upload: processing file '{file.filename}', content_type='{file.content_type}', size hint={file.size}")

        if not file.filename or not file.filename.lower().endswith(".zip"):
            logger.warning(f"Bulk upload: file '{file.filename}' does not end in .zip, skipping")
            skipped_files.append(f"{file.filename}: not a .zip file")
            continue

        # Read and validate size
        content = await file.read()
        logger.info(f"Bulk upload: read {len(content)} bytes from '{file.filename}'")

        if len(content) > MAX_FILE_SIZE:
            logger.warning(f"Bulk upload: file {file.filename} exceeds 50MB ({len(content)} bytes), skipping")
            skipped_files.append(f"{file.filename}: exceeds 50MB limit")
            continue

        # Magic byte validation (most reliable - ignore content-type entirely)
        if len(content) < 4 or content[:4] != ZIP_MAGIC:
            logger.warning(f"Bulk upload: file {file.filename} is not a valid ZIP (magic bytes: {content[:4].hex() if len(content) >= 4 else 'too short'}), skipping")
            skipped_files.append(f"{file.filename}: not a valid ZIP archive")
            continue

        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
            tmp.write(content)
            temp_files.append(tmp.name)
            logger.info(f"Bulk upload: saved '{file.filename}' to temp file '{tmp.name}'")

    if not temp_files:
        logger.error(f"Bulk upload: no valid ZIP files to process. Skipped: {skipped_files}")
        return BulkUploadResult(
            total_files=len(files),
            total_accounts=0,
            successful=0,
            failed=len(files),
            details=[{"error": reason} for reason in skipped_files] if skipped_files else [{"error": "No valid ZIP files found in the upload"}],
        )

    try:
        result = await tdata_uploader.bulk_import_tdata(temp_files, user.id, api_id, api_hash)
        logger.info(f"Bulk upload parse result: total_accounts={result.get('total_accounts')}, successful={result.get('successful')}")

        saved_phones = []
        # Persist parsed accounts to the database
        saved_count = 0
        for detail in result.get("details", []):
            for acct_data in detail.get("accounts", []):
                phone = acct_data.get("phone_number", "")
                session_str = acct_data.get("session_string", "")
                if not phone or not session_str:
                    continue

                # Check for duplicate
                existing = await db.execute(
                    select(Account).where(Account.phone_number == phone)
                )
                if existing.scalar_one_or_none():
                    logger.info(f"Account {phone} already exists, updating session")
                    existing_acct = (await db.execute(
                        select(Account).where(Account.phone_number == phone)
                    )).scalar_one()
                    existing_acct.session_string = session_str
                    existing_acct.api_id = acct_data.get("api_id", api_id)
                    existing_acct.api_hash = acct_data.get("api_hash", api_hash)
                    existing_acct.device_model = acct_data.get("device_model")
                    existing_acct.app_version = acct_data.get("app_version")
                    if custom_first_name:
                        existing_acct.first_name = custom_first_name
                    if custom_username:
                        existing_acct.username = custom_username
                    saved_count += 1
                    saved_phones.append(phone)
                    continue

                new_account = Account(
                    user_id=user.id,
                    phone_number=phone,
                    session_string=session_str,
                    api_id=acct_data.get("api_id", api_id),
                    api_hash=acct_data.get("api_hash", api_hash),
                    device_model=acct_data.get("device_model"),
                    app_version=acct_data.get("app_version"),
                    status="warming",
                    trust_score=0.0,
                    daily_message_count=0,
                    first_name=custom_first_name,
                    username=custom_username,
                )
                db.add(new_account)
                saved_count += 1
                saved_phones.append(phone)
                logger.info(f"Saved account {phone} to database")

        if saved_count > 0:
            await db.commit()
            logger.info(f"Committed {saved_count} accounts to database")
            
            # Fetch all created/updated account IDs for background extraction
            res = await db.execute(select(Account.id).where(Account.phone_number.in_(saved_phones)))
            saved_ids = [r[0] for r in res.all()]
            if saved_ids:
                async def _bg_extract(account_ids: list[int]):
                    import asyncio
                    from app.db.session import async_session_factory
                    from app.services.account_health import check_bulk
                    await asyncio.sleep(3)  # brief delay to ensure transaction finishes
                    async with async_session_factory() as bg_db:
                        logger.info(f"Running background auto-extract for {len(account_ids)} accounts")
                        await check_bulk(bg_db, account_ids)
                
                background_tasks.add_task(_bg_extract, saved_ids)

        return result
    except Exception as e:
        logger.error(f"Bulk upload fatal error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return BulkUploadResult(
            total_files=len(files),
            total_accounts=0,
            successful=0,
            failed=len(files),
            details=[{"error": str(e)}],
        )
    finally:
        for tmp in temp_files:
            try:
                os.unlink(tmp)
            except OSError:
                pass


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
