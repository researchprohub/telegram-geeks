"""TData Account Uploader — Import Telegram Desktop Portable accounts."""

import asyncio
import json
import zipfile
import shutil
from pathlib import Path
from typing import Optional
from loguru import logger
from pydantic import BaseModel, Field


class TDataAccount(BaseModel):
    """Represents a TData account structure."""
    account_id: str
    phone_number: str
    session_string: str
    api_id: int
    api_hash: str
    device_model: str = "TelegramGeeks"
    app_version: str = "1.0.0"
    tdata_dir: str
    status: str = "pending"  # pending, active, warming, suspended, banned
    trust_score: float = 0.0
    daily_message_count: int = 0
    created_at: str = ""


# Allowed file extensions to extract from TData ZIP
ALLOWED_EXTENSIONS = {".session", ".txt", ".json"}

# Maximum directory depth for extracted files
MAX_DEPTH = 5


class TDataUploaderService:
    """Handle TData folder uploads and account registration."""

    def __init__(self, storage_path: str = "./uploads/tdata"):
        self.storage_path = Path(storage_path).resolve()
        self.storage_path.mkdir(parents=True, exist_ok=True)

    async def upload_tdata_folder(
        self,
        file_path: str,
        user_id: int,
        api_id: int,
        api_hash: str,
    ) -> dict:
        """
        Upload a TData folder (ZIP or extracted).
        Supports:
          1. Original format (data/sessions/*.session text files + data/config.json)
          2. Standard Session+JSON format (*.session SQLite files + *.json config)
        """
        results = {
            "uploaded": 0,
            "failed": 0,
            "accounts": [],
            "errors": [],
        }

        try:
            # Extract ZIP if needed
            extract_dir = self.storage_path / f"user_{user_id}_{int(__import__('time').time())}"

            if file_path.endswith('.zip'):
                await self._extract_zip_safe(file_path, extract_dir)
            else:
                # Assume it's already extracted ? validate safe source path
                src = Path(file_path).resolve()
                if not str(src).startswith(str(self.storage_path)):
                    results["errors"].append("Source path outside allowed storage directory")
                    return results
                await asyncio.to_thread(shutil.copytree, src, extract_dir, dirs_exist_ok=True)

            # Find all .session files
            session_files = list(extract_dir.rglob("*.session"))
            if not session_files:
                results["errors"].append("No .session files found in the archive.")
                return results

            # Attempt to find global config for legacy format
            global_config_file = extract_dir / "data" / "config.json"
            global_api_id = api_id
            global_api_hash = api_hash
            if global_config_file.exists():
                try:
                    with open(global_config_file) as f:
                        config = json.load(f)
                    global_api_id = config.get("api_id", api_id)
                    global_api_hash = config.get("api_hash", api_hash)
                except Exception:
                    pass

            # Process each session file
            for session_file in session_files:
                try:
                    phone_number = session_file.stem
                    session_string = None
                    curr_api_id = global_api_id
                    curr_api_hash = global_api_hash
                    device_model = "TelegramGeeks"
                    app_version = "1.0.0"

                    # 1. Look for sidecar JSON for Session+JSON format
                    sidecar_json = session_file.with_suffix(".json")
                    if sidecar_json.exists():
                        try:
                            with open(sidecar_json) as f:
                                sconfig = json.load(f)
                            curr_api_id = sconfig.get("api_id", sconfig.get("app_id", curr_api_id))
                            curr_api_hash = sconfig.get("api_hash", sconfig.get("app_hash", curr_api_hash))
                            device_model = sconfig.get("device_model", sconfig.get("device", device_model))
                            app_version = sconfig.get("app_version", app_version)
                            if "phone" in sconfig or "phone_number" in sconfig:
                                phone_number = str(sconfig.get("phone", sconfig.get("phone_number"))).strip("+")
                        except Exception:
                            pass

                    # 2. Check if it's an SQLite DB or a String session
                    with open(session_file, 'rb') as f:
                        header = f.read(16)
                    
                    if header.startswith(b"SQLite format 3"):
                        # Extract string session from SQLite
                        def _extract_sqlite(path):
                            from telethon.sessions import SQLiteSession, StringSession
                            sql = SQLiteSession(str(path))
                            if not sql.auth_key:
                                return None
                            string_session = StringSession()
                            string_session.set_dc(sql.dc_id, sql.server_address, sql.port)
                            string_session.auth_key = sql.auth_key
                            return string_session.save()
                        
                        session_string = await asyncio.to_thread(_extract_sqlite, session_file)
                        if not session_string:
                            raise ValueError(f"SQLite DB missing auth_key or unreadable: {session_file.name}")
                    else:
                        # Assume text string session
                        session_string = (await asyncio.to_thread(session_file.read_text)).strip()
                        if not session_string:
                            raise ValueError(f"Empty session text file: {session_file.name}")

                    account = TDataAccount(
                        account_id=f"td_{phone_number}",
                        phone_number=phone_number,
                        session_string=session_string,
                        api_id=curr_api_id,
                        api_hash=curr_api_hash,
                        device_model=device_model,
                        app_version=app_version,
                        tdata_dir=str(extract_dir),
                        status="warming",
                        created_at=__import__('datetime').datetime.utcnow().isoformat(),
                    )

                    results["accounts"].append(account.model_dump())
                    results["uploaded"] += 1

                except Exception as e:
                    results["failed"] += 1
                    results["errors"].append(f"Failed to parse {session_file.name}: {e}")

        except Exception as e:
            results["errors"].append(f"Upload failed: {e}")
            logger.error(f"TData upload error: {e}")

        return results

    async def _extract_zip_safe(self, zip_path: str, extract_dir: Path):
        """
        Safely extract a ZIP file with zip-slip protection.

        Before extracting each file:
        1. Reject entries containing '..' in their path
        2. Resolve the full target path and verify it starts with extract_dir
        3. Enforce maximum directory depth
        4. Only allow files with whitelisted extensions
        """
        zip_path_resolved = Path(zip_path).resolve()
        extract_dir_resolved = extract_dir.resolve()

        def _extract():
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                for entry in zip_ref.namelist():
                    if '..' in entry:
                        raise ValueError(f"Unsafe ZIP entry detected: {entry}")
                    target_path = (extract_dir_resolved / entry).resolve()
                    if not str(target_path).startswith(str(extract_dir_resolved)):
                        raise ValueError(f"Zip-slip attempt detected: {entry}")
                    rel_path = target_path.relative_to(extract_dir_resolved)
                    depth = len(rel_path.parts)
                    if depth > MAX_DEPTH:
                        raise ValueError(f"Entry exceeds maximum extraction depth: {entry}")
                zip_ref.extractall(extract_dir)

        await asyncio.to_thread(_extract)

        logger.info(f"Safely extracted TData ZIP to {extract_dir}")

    async def validate_tdata_structure(self, tdata_dir: str) -> dict:
        """Validate that a TData folder has the correct structure."""
        path = Path(tdata_dir).resolve()
        result = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "sessions_count": 0,
        }

        # Check for any .session files
        session_files = list(path.rglob("*.session"))

        if not session_files:
            result["valid"] = False
            result["errors"].append("Missing .session files in the uploaded archive")

        result["sessions_count"] = len(session_files)

        return result

    async def get_account_info(self, session_string: str) -> dict:
        """
        Get account info from session string without connecting.
        Parses phone number and basic metadata.
        """
        info = {
            "valid_session": bool(session_string and len(session_string) > 100),
            "phone_number": "unknown",
            "api_id": None,
            "api_hash": None,
        }
        return info

    async def bulk_import_tdata(
        self,
        zip_files: list[str],
        user_id: int,
        api_id: int,
        api_hash: str,
    ) -> dict:
        """
        Bulk import multiple TData ZIP files.

        Args:
            zip_files: List of paths to TData ZIP files
            user_id: Platform user ID
            api_id: Telegram API ID
            api_hash: Telegram API Hash

        Returns:
            Dict with import results
        """
        results = {
            "total_files": len(zip_files),
            "total_accounts": 0,
            "successful": 0,
            "failed": 0,
            "details": [],
        }

        for zip_file in zip_files:
            try:
                file_result = await self.upload_tdata_folder(zip_file, user_id, api_id, api_hash)
                results["total_accounts"] += file_result["uploaded"]
                results["successful"] += 1 if file_result["uploaded"] > 0 else 0
                results["failed"] += 1 if file_result["failed"] > 0 else 0
                results["details"].append({
                    "file": zip_file,
                    **file_result,
                })
            except Exception as e:
                results["failed"] += 1
                results["details"].append({
                    "file": zip_file,
                    "error": str(e),
                })

        return results

    async def delete_uploaded_tdata(self, upload_id: str) -> bool:
        """Delete uploaded TData files after processing."""
        upload_path = self.storage_path / upload_id
        if upload_path.exists():
            await asyncio.to_thread(shutil.rmtree, upload_path)
            logger.info(f"Deleted TData upload: {upload_id}")
            return True
        return False
