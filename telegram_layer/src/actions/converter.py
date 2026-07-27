"""Converter module — TDATA format conversion (Telegram Expert clone)."""

import os
import json
import shutil
from pathlib import Path
from typing import Optional
from loguru import logger


class ConverterService:
    """Convert between session+json and TDATA format for Telegram Desktop."""

    def __init__(self, storage_path: str = "./sessions"):
        self.storage_path = storage_path

    def convert_to_tdata(
        self,
        session_string: str,
        api_id: int,
        api_hash: str,
        output_dir: str,
        phone_number: str = "",
        device_model: str = "TP Engagement Platform",
        app_version: str = "1.0.0",
    ) -> str:
        """Convert session+json to TDATA Portable Desktop format."""
        tdata_dir = Path(output_dir)
        tdata_dir.mkdir(parents=True, exist_ok=True)

        # Create data structure
        data_dir = tdata_dir / "data"
        sessions_dir = data_dir / "sessions"
        keys_dir = data_dir / "keys"
        profiles_dir = data_dir / "profiles"
        for d in [sessions_dir, keys_dir, profiles_dir]:
            d.mkdir(parents=True, exist_ok=True)

        # Save session file
        session_file = sessions_dir / f"{phone_number or 'main'}.session"
        session_file.write_text(session_string)

        # Save app config
        config = {
            "api_id": api_id,
            "api_hash": api_hash,
            "device_model": device_model,
            "app_version": app_version,
            "system_version": "Windows 10",
            "language_pack": "en",
            "system_language_pack": "en",
        }
        (data_dir / "config.json").write_text(json.dumps(config, indent=2))

        # Save profile
        if phone_number:
            profile = {
                "first_name": phone_number,
                "phone": phone_number,
            }
            (profiles_dir / f"{phone_number}.json").write_text(json.dumps(profile, indent=2))

        logger.info(f"Converted to TDATA: {output_dir}")
        return str(tdata_dir)

    def convert_from_tdata(self, tdata_dir: str) -> dict:
        """Convert TDATA Portable Desktop format back to session+json."""
        tdata = Path(tdata_dir)
        data_dir = tdata / "data"

        # Read config
        config_file = data_dir / "config.json"
        if not config_file.exists():
            raise ValueError(f"No config.json found in {tdata_dir}")

        config = json.loads(config_file.read_text())

        # Read session
        sessions = list((data_dir / "sessions").glob("*.session"))
        if not sessions:
            raise ValueError(f"No session files found in {tdata_dir}")

        session_string = sessions[0].read_text()

        result = {
            "session_string": session_string,
            "api_id": config.get("api_id"),
            "api_hash": config.get("api_hash"),
            "phone_number": sessions[0].stem,
            "device_model": config.get("device_model", ""),
            "app_version": config.get("app_version", ""),
        }

        logger.info(f"Converted from TDATA: {tdata_dir}")
        return result

    def mass_convert(
        self,
        accounts: list[dict],
        source_format: str = "session_json",
        target_format: str = "tdata",
        output_base: str = "./converted",
    ) -> dict:
        """Mass convert multiple accounts between formats."""
        results = {"success": 0, "failed": 0, "errors": []}
        output_dir = Path(output_base)
        output_dir.mkdir(parents=True, exist_ok=True)

        for i, account in enumerate(accounts):
            try:
                phone = account.get("phone_number", f"account_{i}")
                dest = output_dir / phone

                if source_format == "session_json" and target_format == "tdata":
                    self.convert_to_tdata(
                        session_string=account["session_string"],
                        api_id=account["api_id"],
                        api_hash=account["api_hash"],
                        output_dir=str(dest),
                        phone_number=phone,
                    )
                elif source_format == "tdata" and target_format == "session_json":
                    self.convert_from_tdata(str(dest.parent / phone))

                results["success"] += 1
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({"account": phone, "error": str(e)})
                logger.error(f"Mass convert failed for {phone}: {e}")

        logger.info(f"Mass conversion: {results['success']} success, {results['failed']} failed")
        return results
